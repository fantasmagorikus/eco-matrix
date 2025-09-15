import crypto from 'crypto'
import { POST } from './route'

describe('payments webhook (psp)', () => {
  const OLD = process.env.PSP_SECRET
  beforeAll(() => { process.env.PSP_SECRET = 's3cr3t' })
  afterAll(() => { process.env.PSP_SECRET = OLD })

  function sign(body: string, secret = process.env.PSP_SECRET!) {
    return crypto.createHmac('sha256', secret).update(body).digest('hex')
  }

  it('accepts valid signature and is idempotent by eventId', async () => {
    const payload = { type: 'payment.succeeded', data: { amount: 1000 } }
    const body = JSON.stringify(payload)
    const signature = sign(body)
    const eventId = 'evt_1'

    const req1 = new Request('http://localhost/api/payments/psp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-psp-signature': signature,
        'x-psp-event-id': eventId,
      },
      body,
    })
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)
    const j1 = await res1.json()
    expect(j1).toEqual({ ok: true, idempotent: false })

    // Reentrega duplicada do mesmo evento
    const req2 = new Request('http://localhost/api/payments/psp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-psp-signature': signature,
        'x-psp-event-id': eventId,
      },
      body,
    })
    const res2 = await POST(req2)
    expect(res2.status).toBe(200)
    const j2 = await res2.json()
    expect(j2).toEqual({ ok: true, idempotent: true })
  })

  it('rejects invalid signature', async () => {
    const body = JSON.stringify({ a: 1 })
    const req = new Request('http://localhost/api/payments/psp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-psp-signature': 'bad',
        'x-psp-event-id': 'evt_2',
      },
      body,
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when event id is missing', async () => {
    const payload = { type: 'payment.succeeded', data: { amount: 1000 } }
    const body = JSON.stringify(payload)
    const signature = sign(body)
    const req = new Request('http://localhost/api/payments/psp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-psp-signature': signature,
      },
      body,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when secret is missing', async () => {
    const prev = process.env.PSP_SECRET
    delete process.env.PSP_SECRET
    const body = JSON.stringify({ a: 1 })
    const req = new Request('http://localhost/api/payments/psp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-psp-signature': 'any',
        'x-psp-event-id': 'evt_3',
      },
      body,
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    process.env.PSP_SECRET = prev
  })
})
