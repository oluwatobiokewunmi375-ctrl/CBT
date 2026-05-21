import { chromium } from '@playwright/test'

async function run() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err))

  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'load', timeout: 60000 })
  console.log('at login page', page.url())

  await page.click('button:has-text("Student Exam")')
  await page.fill('input[name="studentNo"]', 'STU001')
  await Promise.all([
    page.waitForURL(/\/exam-list/, { timeout: 30000 }),
    page.click('button:has-text("Enter Exam")'),
  ])

  console.log('after login nav', page.url())
  await page.waitForTimeout(5000)
  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
