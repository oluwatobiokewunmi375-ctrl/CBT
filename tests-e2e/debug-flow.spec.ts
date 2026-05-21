import { test, expect } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'

test('debug login and start exam navigation', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE:', msg.type(), msg.text()))
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

  await page.goto(`${baseUrl}/login`, { waitUntil: 'load', timeout: 60000 })
  await page.getByRole('button', { name: 'Student Exam' }).click()
  await page.fill('input[name="studentNo"]', 'STURESIL001')
  await Promise.all([
    page.waitForURL(/\/exam-list/, { timeout: 30000 }),
    page.getByRole('button', { name: 'Enter Exam' }).click(),
  ])
  console.log('after login url', page.url())

  const count = await page.locator('button:has-text("Start Exam")').count()
  console.log('start exam button count', count)
  await expect(count).toBeGreaterThan(0)
  await Promise.all([
    page.waitForURL(/\/exam\//, { timeout: 30000 }),
    page.locator('button:has-text("Start Exam")').first().click(),
  ])
  console.log('after start url', page.url())
})
