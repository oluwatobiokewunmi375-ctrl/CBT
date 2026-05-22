const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED', request.url(), request.failure()?.errorText));

  const baseUrl = 'http://127.0.0.1:3001';
  console.log('goto login');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load', timeout: 60000 });
  await page.fill('input[name="studentNo"]', 'STURESIL001');
  await page.locator('button:has-text("Enter Exam")').click();
  await page.waitForURL(/\/exam-list/, { timeout: 30000 });
  console.log('at exam list', page.url());
  const startButton = await page.locator('button:has-text("Start Exam")').first();
  console.log('start button exists', !!startButton);
  await Promise.all([page.waitForURL(/\/exam\//, { timeout: 30000 }), startButton.click()]);
  console.log('after click', page.url());
  try {
    await page.waitForSelector('text=Time remaining', { timeout: 20000 });
    console.log('FOUND TIME REMAINING');
  } catch (err) {
    console.log('TIME REMAINING MISSING', err.message);
    console.log('PAGE HTML START');
    console.log(await page.content());
    console.log('PAGE HTML END');
  }
  await browser.close();
})().catch(err => { console.error('SCRIPT ERROR', err); process.exit(1); });
