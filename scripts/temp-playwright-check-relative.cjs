const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const response = await page.goto('/login', { timeout: 30000, waitUntil: 'load', baseURL: 'http://127.0.0.1:3000' });
    console.log('STATUS', response && response.status());
    console.log('URL', page.url());
  } catch (err) {
    console.error('ERROR', err.message);
  }
  await browser.close();
})();
