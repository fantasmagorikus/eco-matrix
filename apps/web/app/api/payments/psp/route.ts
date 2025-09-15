import crypto from 'crypto'

const memoryStore = globalThis as unknown as { __events?: Set<string> }
if (!memoryStore.__events) memoryStore.__events = new Set<string>()

function verifySignature(secret: string, rawBody: string, signature: string): boolean {
  const h = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // Support hex signature (common) or prefixed formats "sha256=..."
  const sig = (signature || '').replace(/^sha256=/, '')
  const a = Buffer.from(h, 'hex')
  const b = Buffer.from(sig, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  try {
    const secret = process.env.PSP_SECRET || ''
    if (!secret) return new Response('Missing secret', { status: 500 })

    const signature = request.headers.get('x-psp-signature') || ''
    const eventId = request.headers.get('x-psp-event-id') || ''
    if (!eventId) return new Response('Missing event id', { status: 400 })

    const raw = await request.text()
    if (!verifySignature(secret, raw, signature)) {
      return new Response('Invalid signature', { status: 401 })
    }

    // Idempotência forte por eventId (store em memória aqui; em prod: DB)
    if (memoryStore.__events!.has(eventId)) {
      return Response.json({ ok: true, idempotent: true })
    }
    memoryStore.__events!.add(eventId)

    // TODO: persist PaymentWebhook(eventId, provider, payload), processar negócio
    // Evitar logs sensíveis
    console.log(JSON.stringify({ level: 'info', msg: 'psp_webhook', eventId }))

    return Response.json({ ok: true, idempotent: false })
  } catch (err) {
    return new Response('Server error', { status: 500 })
  }
}
