import { POST } from './route'

describe('csp-report route (error path)', () => {
  it('returns 400 when body reading fails', async () => {
    const reqLike = {
      headers: new Map([
        ['content-type', 'application/csp-report'],
      ]) as any,
      text: async () => {
        throw new Error('read failure')
      },
    } as unknown as Request

    const res = await POST(reqLike)
    expect(res.status).toBe(400)
  })
})

