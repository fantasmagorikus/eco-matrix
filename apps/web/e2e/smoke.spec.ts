import { test, expect, request } from '@playwright/test'

test('home has security headers and request-id', async ({ page }) => {
  const resp = await page.goto('/')
  expect(resp?.status()).toBe(200)
  const headers = resp!.headers()
  expect(headers['x-request-id']).toBeTruthy()
  expect(headers['content-security-policy']).toBeTruthy()
  expect(headers['strict-transport-security']).toBeTruthy()
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('no-referrer')
})

test('POST /api/session sets cookie', async () => {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' })
  const resp = await ctx.post('/api/session')
  expect(resp.status()).toBe(200)
  const setCookie = resp.headers()['set-cookie'] || ''
  expect(setCookie).toContain('session=')
  expect(setCookie.toLowerCase()).toContain('httponly')
  expect(setCookie.toLowerCase()).toContain('secure')
  expect(setCookie.toLowerCase()).toContain('samesite=lax')
})

