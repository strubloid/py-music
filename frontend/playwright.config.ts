import { defineConfig } from '@playwright/test'

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
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'rm -f /tmp/py-music-playwright.db && node scripts/run-python.js backend/project/api/app.py',
      cwd: '..',
      url: 'http://127.0.0.1:5000/api/health',
      reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true',
      timeout: 120_000,
      env: {
        ...process.env,
        DATABASE_URL: 'sqlite:////tmp/py-music-playwright.db',
        RATELIMIT_ENABLED: 'false',
        SEED_CHALLENGES_ON_START: 'true',
        E2E_EXPOSE_ANSWERS: '1',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 3000 --strictPort',
      cwd: '.',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true',
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_OPEN: '0',
      },
    },
  ],
})
