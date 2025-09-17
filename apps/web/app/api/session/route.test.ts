describe('session route', () => {
  it('sets a secure, HttpOnly, SameSite=Lax cookie', async () => {
    jest.resetModules()
    const setMock = jest.fn()
    jest.doMock('next/headers', () => ({
      cookies: () => ({ set: setMock }),
    }))

    const { POST } = await import('./route')

    const res = await POST()
    expect(res.status).toBe(200)

    expect(setMock).toHaveBeenCalled()
    const arg = setMock.mock.calls[0][0]
    expect(arg.name).toBe('session')
    expect(arg.httpOnly).toBe(true)
    expect(arg.secure).toBe(true)
    expect(String(arg.sameSite).toLowerCase()).toBe('lax')
    expect(arg.path).toBe('/')
    expect(typeof arg.maxAge).toBe('number')
    expect(String(arg.value)).toMatch(/^demo\./)
  })
})
