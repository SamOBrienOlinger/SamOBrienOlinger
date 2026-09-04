const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    port: 4173,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: 'Android Chrome 360',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'Android Chrome 412',
      use: {
        browserName: 'chromium',
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'iOS WebKit 375',
      use: {
        browserName: 'webkit',
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'iOS WebKit 393',
      use: {
        browserName: 'webkit',
        viewport: { width: 393, height: 852 },
        isMobile: true,
        hasTouch: true
      }
    }
  ]
});
