import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // supports both local .venv and CI setup-python
      command:
        'bash -c "if [ -f ../expense_tracker/.venv/bin/python ]; then ../expense_tracker/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000; else python -m uvicorn app.main:app --host 127.0.0.1 --port 8000; fi"',
      url: 'http://127.0.0.1:8000/openapi.json',
      cwd: '../expense_tracker',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { PYTHONPATH: '.' },
    },
  ],
})
