import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  // Exclude the application's Vitest files from Playwright discovery.
  testIgnore: ['conduit-probe/**', 'node_modules/**', 'runs/**', 'test-results/**'],
  // Bound the runtime of each generated test.
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  use: {
    trace: 'off', video: 'off', screenshot: 'off',
    actionTimeout: 8_000, navigationTimeout: 12_000,
  },
});
