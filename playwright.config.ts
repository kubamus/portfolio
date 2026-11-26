import { defineConfig, devices } from '@playwright/test';

const gpu = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  use: {
    viewport: { width: 1920, height: 1080 },
    launchOptions: { args: gpu },
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: ['**/screenshots.spec.ts', '**/prod.spec.ts'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 }, baseURL: 'http://localhost:5199', launchOptions: { args: gpu } },
    },
    {
      name: 'prod',
      testMatch: '**/prod.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:5198', launchOptions: { args: gpu } },
    },
    {
      name: 'shots',
      testMatch: '**/screenshots.spec.ts',
      timeout: 600_000,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5199', launchOptions: { args: gpu } },
    },
  ],
  webServer: [
    {
      command: 'bunx vite --port 5199 --strictPort',
      port: 5199,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'bun run build && bunx vite preview --port 5198 --strictPort',
      port: 5198,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
