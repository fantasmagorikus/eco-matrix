import { buildCsp } from './security'

describe('buildCsp', () => {
  it('returns a restrictive CSP in production', () => {
    const csp = buildCsp(false)
    expect(csp).toMatch(/default-src 'self'/)
    expect(csp).toMatch(/script-src 'self'(;|$)/)
    expect(csp).toMatch(/frame-ancestors 'none'/)
    expect(csp).toMatch(/object-src 'none'/)
    expect(csp).toMatch(/frame-src 'none'/)
    expect(csp).toMatch(/worker-src 'self' blob:/)
  })

  it('allows eval/inline in dev for Next HMR', () => {
    const csp = buildCsp(true)
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline' 'unsafe-eval'/)
    expect(csp).toMatch(/connect-src 'self' ws:/)
  })
})
