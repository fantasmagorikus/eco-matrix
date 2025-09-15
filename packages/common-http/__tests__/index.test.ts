import { httpFetch } from '../src'

function mockFetchSequence(statuses: number[]) {
  let call = 0
  // @ts-ignore
  global.fetch = jest.fn(async (_input: any, _init: any) => {
    const s = statuses[Math.min(call, statuses.length - 1)]
    call++
    return new Response('', { status: s })
  })
}

describe('common-http', () => {
  afterEach(() => {
    // @ts-ignore
    global.fetch = undefined
  })

  it('propagates x-request-id header', async () => {
    const spy = jest.fn(async () => new Response('{}', { status: 200 }))
    // @ts-ignore
    global.fetch = spy
    await httpFetch('http://example.com', { requestId: 'rid-123' })
    const init = spy.mock.calls[0][1] as RequestInit
    const h = new Headers(init.headers)
    expect(h.get('x-request-id')).toBe('rid-123')
  })

  it('retries on 500 and succeeds', async () => {
    mockFetchSequence([500, 200])
    const res = await httpFetch('http://example.com', { retry: { retries: 2, minTimeoutMs: 1, maxTimeoutMs: 2 } })
    expect(res.status).toBe(200)
  })

  it('times out and aborts', async () => {
    // @ts-ignore
    global.fetch = jest.fn((_input: any, init: any) => new Promise((_resolve, reject) => {
      // respect abort
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
    }))
    await expect(httpFetch('http://example.com', { timeoutMs: 10, retry: { retries: 0 } })).rejects.toBeTruthy()
  })
})

