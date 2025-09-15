import { POST } from './route'

describe('csp-report route', () => {
  it('accepts reports and returns 204', async () => {
    const payload = { 'csp-report': { 'blocked-uri': 'inline', 'violated-directive': 'script-src' } }
    const req = new Request('http://localhost/api/csp-report', {
      method: 'POST',
      headers: { 'content-type': 'application/csp-report' },
      body: JSON.stringify(payload),
    })
    const res = await POST(req)
    expect(res.status).toBe(204)
  })
})

