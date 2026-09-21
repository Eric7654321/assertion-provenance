import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  // 受測 app 自己也有 *.test.js（vitest 的），不要被 playwright 收進來
  testIgnore: ['conduit-probe/**', 'node_modules/**', 'runs/**', 'test-results/**'],
  // 單一 case 的硬上限；失敗斷言不應連續等 45 秒才退回 agent。
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  use: {
    trace: 'off', video: 'off', screenshot: 'off',
    actionTimeout: 8_000, navigationTimeout: 12_000,
  },   // 磁碟只剩 2.8G，artifact 全關
});
