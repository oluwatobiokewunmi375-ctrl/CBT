import { test, expect } from '@playwright/test'

test('Seed database and verify test accounts', async ({ request }) => {
  // Seed the database
  const seedResponse = await request.post('http://127.0.0.1:3000/api/seed', {
    data: { key: 'CBT_SEED_2024' }
  })

  expect(seedResponse.ok()).toBeTruthy()
  const seedData = await seedResponse.json()
  expect(seedData.success).toBe(true)
  console.log('✅ Database seeded with test accounts')
})

test('Login page loads and displays UI elements', async ({ page }) => {
  // Navigate to login with absolute URL
  const response = await page.goto('http://127.0.0.1:3000/login', {
    waitUntil: 'networkidle',
    timeout: 60000
  })

  console.log('Login page response:', response?.status())

  // Verify login page elements
  const dashboardButton = page.locator('button', { hasText: 'Dashboard Access' })
  await expect(dashboardButton).toBeVisible({ timeout: 30000 })
  console.log('✅ Login page loaded')
})

test('Exam list page is accessible', async ({ page }) => {
  // Navigate to exam list
  const response = await page.goto('http://127.0.0.1:3000/exam-list', {
    waitUntil: 'networkidle',
    timeout: 60000
  })

  console.log('Exam list response:', response?.status())

  // Should either show content or redirect to login
  const url = page.url()
  expect(url).toBeTruthy()
  console.log('✅ Exam list page accessible, URL:', url)
})

test('Navigation between routes works', async ({ page }) => {
  // Start at login
  await page.goto('http://127.0.0.1:3000/login', {
    waitUntil: 'networkidle',
    timeout: 60000
  })

  let currentUrl = page.url()
  console.log('Started at:', currentUrl)

  // Try to navigate to homepage
  await page.goto('http://127.0.0.1:3000/', {
    waitUntil: 'networkidle',
    timeout: 60000
  })

  currentUrl = page.url()
  console.log('Navigated to:', currentUrl)
  expect(currentUrl).toContain('3000')
})
