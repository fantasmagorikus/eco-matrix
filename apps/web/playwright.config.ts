import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report' }]]
    : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start -p 3000',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
