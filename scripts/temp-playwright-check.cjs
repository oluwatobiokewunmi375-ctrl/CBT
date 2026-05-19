const { chromium } = require('@playwright/test');

;(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.goto('http://127.0.0.1:3000/login', { timeout: 30000, waitUntil: 'load' });
  console.log('STATUS', response && response.status());
  console.log('URL', page.url());
  await browser.close();
})();
