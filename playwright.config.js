const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev', port: 4173, reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'Desktop Chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'Desktop Firefox', use: { browserName: 'firefox', viewport: { width: 1440, height: 1000 } } },
    { name: 'Desktop WebKit', use: { browserName: 'webkit', viewport: { width: 1440, height: 1000 } } },
    { name: 'Android Chrome', use: { browserName: 'chromium', viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
    { name: 'iPhone WebKit', use: { browserName: 'webkit', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } },
    { name: 'Tablet WebKit', use: { browserName: 'webkit', viewport: { width: 768, height: 1024 }, hasTouch: true } }
  ]
});
