import { createCors, preflightHeaders, readJsonBody, createRateLimiter, DEFAULT_CORS_WHITELIST } from '../src'

describe('security helpers', () => {
  it('CORS allow/deny from whitelist', () => {
    const cors = createCors({ whitelist: DEFAULT_CORS_WHITELIST })
    const allowed = cors('https://lokomemo.tv')
    expect(allowed['access-control-allow-origin']).toBe('https://lokomemo.tv')
    const denied = cors('https://evil.test')
    expect(Object.keys(denied)).toHaveLength(0)
  })

  it('preflight adds expected headers', () => {
    const h = preflightHeaders('https://lokomemo.com', 'content-type')
    expect(h['access-control-allow-origin']).toBe('https://lokomemo.com')
    expect(h['access-control-allow-methods']).toMatch(/GET/)
  })

  it('readJsonBody enforces content-type and size', async () => {
    const ok = await readJsonBody(new Request('http://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 1 }) }))
    expect(ok).toEqual({ a: 1 })
    await expect(readJsonBody(new Request('http://x', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' }))).rejects.toThrow(/Unsupported/)
    const big = 'x'.repeat(300_000)
    await expect(readJsonBody(new Request('http://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ big }) }), 1024)).rejects.toThrow(/too large/i)
  })

  it('rate limit blocks after N within window', () => {
    const allow = createRateLimiter({ windowMs: 1000, max: 2 })
    expect(allow('1.1.1.1', '/a')).toBe(true)
    expect(allow('1.1.1.1', '/a')).toBe(true)
    expect(allow('1.1.1.1', '/a')).toBe(false)
  })
})

