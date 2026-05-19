const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const url of ['http://127.0.0.1:3000/login', 'http://localhost:3000/login', 'http://192.168.100.22:3000/login']) {
    try {
      const response = await page.goto(url, { timeout: 30000, waitUntil: 'load' });
      console.log('URL', url, 'STATUS', response && response.status());
    } catch (err) {
      console.error('URL', url, 'ERROR', err.message);
    }
  }
  await browser.close();
})();
