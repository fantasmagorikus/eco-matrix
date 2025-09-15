# Eco‑Matrix – Architecture Canvas

Este Canvas consolida visão, limites e contratos entre módulos. Serve como guia vivo (atualize via PR junto das mudanças de código).

## 1) Contexto e Objetivos
- Frontend: Next.js (SSR/ISR) em Vercel.
- Backend core: Medusa (Node) para domínios de e‑commerce (produtos, pedidos, pagamentos…).
- BFF/Gateway: Apollo GraphQL (unifica Medusa + serviços auxiliares).
- Dados: PostgreSQL (Prisma ORM) + Redis (cache/filas, opcional).
- Edge/Ingress: Cloudflare (DNS/TLS/HSTS/CORS/Cache) + NGINX (roteamento/domínios e headers server‑side quando aplicável).
- Observabilidade: request‑id, logs estruturados, métricas por rota; alertas por SLO.
- Segurança: CSP estrita, HSTS preload, cookies Secure+HttpOnly, SameSite=Lax, rotação de chaves.

## 2) Módulos Medusa (Domínios)
- Catálogo: Produtos, Categorias, Variedades/Atributos, Mídias.
- Preços & Promoções: tabelas de preço, cupons, regras de desconto.
- Inventário: estoques, reservas.
- Carrinho & Checkout: sessão de carrinho, frete, impostos.
- Pedidos: captura, fatura, status, devoluções.
- Pagamentos: provedores (ex.: Stripe/PSP), webhooks, idempotência por `eventId`.
- Clientes: contas, endereços, autenticação.
- Operações: webhooks internos, tarefas agendadas, auditoria.

Responsabilidades Medusa
- Expor REST (nativo) e/ou GraphQL (via plugin) para o Gateway.
- Emitir/consumir webhooks para integrações de pagamentos e logística.
- Persistência via Prisma (tabelas mapeadas abaixo).

## 3) Schema GraphQL (Gateway/BFF – rascunho)
```graphql
# Interfaces e utilitários
interface Node { id: ID! }

type PageInfo { hasNextPage: Boolean!, endCursor: String }

type Money { amount: Int!, currency: String! }

# Catálogo
type Product implements Node {
  id: ID!
  slug: String!
  title: String!
  description: String
  price: Money!
  images: [String!]!
  categories: [Category!]!
}

type Category implements Node {
  id: ID!
  name: String!
  slug: String!
}

# Comércio
type Cart implements Node {
  id: ID!
  items: [CartItem!]!
  total: Money!
}

type CartItem {
  product: Product!
  quantity: Int!
  unitPrice: Money!
}

type Order implements Node {
  id: ID!
  number: String!
  total: Money!
  status: String!
  createdAt: String!
}

# Consultas
type Query {
  product(slug: String!): Product
  products(after: String, first: Int = 20, search: String): ProductConnection!
  cart(id: ID!): Cart
  order(id: ID!): Order
}

type ProductConnection { edges: [ProductEdge!]!, pageInfo: PageInfo! }

type ProductEdge { node: Product!, cursor: String! }

# Mutations principais
input AddToCartInput { cartId: ID, productId: ID!, quantity: Int! }
input CheckoutInput { cartId: ID!, paymentMethod: String!, addressId: ID! }

type Mutation {
  addToCart(input: AddToCartInput!): Cart!
  checkout(input: CheckoutInput!): Order!
}
```

Observações
- O Gateway delega resolvers a Medusa (REST/GraphQL) e serviços auxiliares.
- Padronizar paginação (Conexões), Money e IDs.

## 4) Entidades Prisma (rascunho)
```prisma
// schema.prisma – fragmento
model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?
  priceCents  Int
  currency    String   @default("USD")
  images      String[]
  categories  Category[] @relation(references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Category {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  products  Product[]
}

model Customer {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  addresses Address[]
  createdAt DateTime @default(now())
}

model Address {
  id         String   @id @default(cuid())
  customer   Customer @relation(fields: [customerId], references: [id])
  customerId String
  line1      String
  city       String
  country    String
}

model Cart {
  id        String   @id @default(cuid())
  items     CartItem[]
  totalCents Int     @default(0)
  currency  String   @default("USD")
}

model CartItem {
  id        String  @id @default(cuid())
  cart      Cart    @relation(fields: [cartId], references: [id])
  cartId    String
  productId String
  quantity  Int
  unitCents Int
}

model Order {
  id         String   @id @default(cuid())
  number     String   @unique
  totalCents Int
  currency   String   @default("USD")
  status     String
  customerId String?
  createdAt  DateTime @default(now())
}

model PaymentWebhook {
  id            String   @id @default(cuid())
  provider      String
  eventId       String   @unique // idempotência forte
  payload       Json
  processedAt   DateTime?
  createdAt     DateTime @default(now())
}
```

Observações
- `PaymentWebhook.eventId` garante idempotência por evento do PSP.
- Tabelas podem se alinhar 1‑para‑1 aos agregados Medusa, ou usar as do Medusa nativamente (se plugado com Prisma/TypeORM).

## 5) NGINX – Rotas/Domínios (exemplo)
```nginx
# Web (SSR/ISR) – pode ficar atrás do Vercel/Edge
server {
  listen 443 ssl http2;
  server_name eco-matrix.app www.eco-matrix.app;

  # Segurança baseline
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "no-referrer" always;
  add_header Cross-Origin-Opener-Policy "same-origin" always;
  add_header Cross-Origin-Resource-Policy "same-origin" always;
  # CSP deve refletir o front
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'" always;

  location / {
    proxy_set_header X-Request-ID $request_id;
    proxy_set_header Host $host;
    proxy_pass http://web_upstream;
  }
}

# API (Medusa/Apollo)
server {
  listen 443 ssl http2;
  server_name api.eco-matrix.app;

  # CORS estrito – ajuste origins conforme necessidade
  if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' 'https://eco-matrix.app' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Max-Age' 86400 always;
    return 204;
  }
  add_header 'Access-Control-Allow-Origin' 'https://eco-matrix.app' always;

  location /graphql {
    proxy_set_header X-Request-ID $request_id;
    proxy_set_header Host $host;
    proxy_pass http://apollo_upstream;
  }

  location /medusa/ {
    proxy_set_header X-Request-ID $request_id;
    proxy_pass http://medusa_upstream;
  }
}
```

## 6) Fluxos Críticos
- Checkout: `Cart -> addToCart -> shipping/taxes -> checkout -> Order`.
- Pagamentos: webhook PSP -> persistir `PaymentWebhook` (idempotência por `eventId`) -> atualizar `Order` -> logs/alertas.
- Catálogo: importação/atualização de produtos e preços (batch), invalidando caches (ISR revalidate/Edge cache purge).

## 7) Observabilidade & Segurança
- `x-request-id` em toda a cadeia (Edge → Gateway → Medusa).
- Logs JSON (level, requestId, rota, latência, status) + métricas por rota.
- CSP report‑only em staging → sem violações → CSP enforced.
- Segredos por env/manager; nenhuma credencial no repositório.

## 8) Próximos Passos (ação)
- [ ] Gateway Apollo esqueleto + schema conforme rascunho.
- [ ] Medusa: definir provedores de pagamento alvo e webhooks.
- [ ] Prisma: migrar entidades para banco inicial; índices principais.
- [ ] NGINX/Edge: aplicar CORS e headers; mapear domínios definitivos.
- [ ] Testes de contrato (GraphQL/REST) e smoke E2E (checkout básico).
