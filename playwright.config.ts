import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * E2E runs against the real static export (./out) served with Cloudflare-like
 * behaviour and headers — run `pnpm build` first (docs/spec/08-TESTING.md §5).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    {
      name: 'mobile-small',
      use: { ...devices['Galaxy S8'], browserName: 'chromium', viewport: { width: 360, height: 640 } },
    },
  ],
  webServer: {
    command: `node scripts/serve-out.ts --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
