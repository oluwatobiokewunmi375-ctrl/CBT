# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Exam list page is accessible
- Location: tests-e2e\auth-flow.spec.ts:30:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3000/exam-list", waiting until "networkidle"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('Seed database and verify test accounts', async ({ request }) => {
  4  |   // Seed the database
  5  |   const seedResponse = await request.post('http://127.0.0.1:3000/api/seed', {
  6  |     data: { key: 'CBT_SEED_2024' }
  7  |   })
  8  | 
  9  |   expect(seedResponse.ok()).toBeTruthy()
  10 |   const seedData = await seedResponse.json()
  11 |   expect(seedData.success).toBe(true)
  12 |   console.log('✅ Database seeded with test accounts')
  13 | })
  14 | 
  15 | test('Login page loads and displays UI elements', async ({ page }) => {
  16 |   // Navigate to login with absolute URL
  17 |   const response = await page.goto('http://127.0.0.1:3000/login', {
  18 |     waitUntil: 'networkidle',
  19 |     timeout: 60000
  20 |   })
  21 | 
  22 |   console.log('Login page response:', response?.status())
  23 | 
  24 |   // Verify login page elements
  25 |   const dashboardButton = page.locator('button', { hasText: 'Dashboard Access' })
  26 |   await expect(dashboardButton).toBeVisible({ timeout: 30000 })
  27 |   console.log('✅ Login page loaded')
  28 | })
  29 | 
  30 | test('Exam list page is accessible', async ({ page }) => {
  31 |   // Navigate to exam list
> 32 |   const response = await page.goto('http://127.0.0.1:3000/exam-list', {
     |                               ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  33 |     waitUntil: 'networkidle',
  34 |     timeout: 60000
  35 |   })
  36 | 
  37 |   console.log('Exam list response:', response?.status())
  38 | 
  39 |   // Should either show content or redirect to login
  40 |   const url = page.url()
  41 |   expect(url).toBeTruthy()
  42 |   console.log('✅ Exam list page accessible, URL:', url)
  43 | })
  44 | 
  45 | test('Navigation between routes works', async ({ page }) => {
  46 |   // Start at login
  47 |   await page.goto('http://127.0.0.1:3000/login', {
  48 |     waitUntil: 'networkidle',
  49 |     timeout: 60000
  50 |   })
  51 | 
  52 |   let currentUrl = page.url()
  53 |   console.log('Started at:', currentUrl)
  54 | 
  55 |   // Try to navigate to homepage
  56 |   await page.goto('http://127.0.0.1:3000/', {
  57 |     waitUntil: 'networkidle',
  58 |     timeout: 60000
  59 |   })
  60 | 
  61 |   currentUrl = page.url()
  62 |   console.log('Navigated to:', currentUrl)
  63 |   expect(currentUrl).toContain('3000')
  64 | })
  65 | 
```