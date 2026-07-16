import { defineConfig } from '@playwright/test'

const apiPort = process.env.PLAYWRIGHT_API_PORT || '5000'
const webPort = process.env.PLAYWRIGHT_WEB_PORT || '3000'
const apiOrigin = `http://127.0.0.1:${apiPort}`
const webOrigin = `http://127.0.0.1:${webPort}`

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: webOrigin,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'rm -f /tmp/py-music-playwright.db && node scripts/run-python.js backend/project/api/app.py',
      cwd: '..',
      url: `${apiOrigin}/api/health`,
      reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true',
      timeout: 120_000,
      env: {
        ...process.env,
        DATABASE_URL: 'sqlite:////tmp/py-music-playwright.db',
        RATELIMIT_ENABLED: 'false',
        SEED_CHALLENGES_ON_START: 'true',
        E2E_EXPOSE_ANSWERS: '1',
        PORT: apiPort,
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${webPort} --strictPort`,
      cwd: '.',
      url: webOrigin,
      reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true',
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_OPEN: '0',
        VITE_API_TARGET: apiOrigin,
      },
    },
  ],
})
