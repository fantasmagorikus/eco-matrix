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
  })
})
