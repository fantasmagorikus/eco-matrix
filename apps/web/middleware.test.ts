jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }))
import { middleware } from './middleware'

describe('middleware security + request-id', () => {
  const OLD_ENV = process.env.NODE_ENV
  beforeAll(() => {
    // Simulate production to assert strict CSP
    ;(process as any).env.NODE_ENV = 'production'
  })
  afterAll(() => {
    ;(process as any).env.NODE_ENV = OLD_ENV
  })

  it('adds x-request-id and CSP headers', () => {
    const req = {
      headers: new Headers(),
      nextUrl: { pathname: '/' },
      method: 'GET',
    } as any
    const res = middleware(req)
    const rid = res.headers.get('x-request-id')
    expect(rid).toBeTruthy()
    const csp = res.headers.get('content-security-policy') || ''
    expect(csp).toMatch(/default-src 'self'/)
    expect(csp).toMatch(/script-src 'self'(;|$)/)
    // Security headers
    expect(res.headers.get('strict-transport-security')).toMatch(/max-age=/)
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin')
    expect(res.headers.get('cross-origin-resource-policy')).toBe('same-origin')
  })
})
