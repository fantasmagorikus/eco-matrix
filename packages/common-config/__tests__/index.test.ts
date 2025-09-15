import { loadConfig } from '../src'

describe('common-config loadConfig', () => {
  it('loads valid env with defaults and parses CORS_ORIGINS', () => {
    const cfg = loadConfig({ SERVICE_NAME: 'bff', CORS_ORIGINS: 'https://a.com, https://b.com' })
    expect(cfg.SERVICE_NAME).toBe('bff')
    expect(cfg.NODE_ENV).toMatch(/^(development|test|production)$/)
    expect(cfg.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com'])
    expect(cfg.REQUEST_TIMEOUT_MS).toBeGreaterThan(0)
  })

  it('fails on invalid LOG_LEVEL', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'nope' as any })).toThrow(/Invalid environment/)
  })
})

