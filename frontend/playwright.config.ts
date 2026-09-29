import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        executablePath: '/usr/bin/chromium',
      },
    },
  ],
  webServer: {
    command: 'pnpm preview --port 5173',
    port: 5173,
    reuseExistingServer: true,
  },
});
