import { POST } from './route'

describe('session route', () => {
  it('sets a secure, HttpOnly, SameSite=Lax cookie', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toMatch(/session=/)
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/Secure/i)
    expect(setCookie).toMatch(/SameSite=Lax/i)
  })
})

