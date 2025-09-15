import { createLogger } from '../src'

describe('common-logger', () => {
  it('emits JSON with required fields', () => {
    const logs: any[] = []
    const spy = jest.spyOn(console, 'info').mockImplementation((arg: any) => logs.push(arg))
    const logger = createLogger({ service: 'test', env: 'test', requestId: 'rid-1' })
    logger.info('hello', { foo: 1 })
    spy.mockRestore()
    expect(logs.length).toBe(1)
    const parsed = JSON.parse(logs[0])
    expect(parsed).toMatchObject({ service: 'test', env: 'test', requestId: 'rid-1', level: 'info', msg: 'hello', foo: 1 })
    expect(typeof parsed.time).toBe('string')
  })

  it('child logger overrides requestId', () => {
    const logs: any[] = []
    const spy = jest.spyOn(console, 'log').mockImplementation((arg: any) => logs.push(arg))
    const base = createLogger({ service: 'svc', env: 'test', requestId: 'a' })
    const child = base.child({ requestId: 'b' })
    child.debug('msg')
    spy.mockRestore()
    const parsed = JSON.parse(logs[0])
    expect(parsed.requestId).toBe('b')
  })
})

