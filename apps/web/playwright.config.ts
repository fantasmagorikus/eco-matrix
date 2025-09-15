import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start -p 3000',
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
}

export default config

