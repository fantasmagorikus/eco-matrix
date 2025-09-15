# Eco‑Matrix – Foundation (Monorepo)

This complements the Architecture Canvas with the shared foundation now added to the repo.

## Shared Packages
- `@eco-matrix/common-config` – Env loader with Zod (NODE_ENV, LOG_LEVEL, SERVICE_NAME, CORS_ORIGINS, REQUEST_TIMEOUT_MS…)
- `@eco-matrix/common-logger` – JSON logger with base fields `{ service, env, requestId }` and error serialization
- `@eco-matrix/common-http` – Fetch wrapper with timeout, exponential backoff retry, and x-request-id propagation
- `@eco-matrix/security` – `createCors(whitelist)`, JSON body size/content-type guards, and simple IP+path rate‑limit

Whitelist origins (tight):
- http://localhost:3000
- https://eco-matrix-staging.vercel.app
- https://lokomemo.com
- https://admin.lokomemo.com

## CI/CD
- Lint/Type-check/Test/Build across all workspaces using `pnpm -r`
- Artifacts: coverage (web) and web build output

## Observability
- x-request-id: issued at the edge (middleware) and propagated on outbound calls via common-http
- Log shape: `{ time, level, service, env, requestId, msg, ... }`

## Next Steps
- BFF (Apollo+Fastify) using the shared packages and CORS
- Matrix bridge (private, text-only, no federation), GraphQL chat resolvers in BFF

