# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Admin dashboard requires authentication
- Location: tests-e2e\login.spec.ts:13:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3000/admin/dashboard", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('Login page loads and displays correctly', async ({ page }) => {
  4  |   // Visit login page
  5  |   await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  6  |   
  7  |   // Verify login page elements
  8  |   await expect(page.getByText('CBT System Access')).toBeVisible({ timeout: 10000 })
  9  |   await expect(page.getByText('Dashboard Access')).toBeVisible()
  10 |   await expect(page.getByText(/Student Exam|Exam Access/)).toBeVisible()
  11 | })
  12 | 
  13 | test('Admin dashboard requires authentication', async ({ page }) => {
  14 |   // Try to access admin dashboard without auth (should redirect to login)
> 15 |   await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  16 |   
  17 |   // Should be redirected to login or show error
  18 |   const url = page.url()
  19 |   const isOnLogin = url.includes('/login') || page.getByText(/login|authentication/i).first().isVisible().catch(() => false)
  20 |   expect(url.includes('/login') || url.includes('/admin/dashboard')).toBeTruthy()
  21 | })
  22 | 
  23 | test('Student exam list page works', async ({ page }) => {
  24 |   // Directly navigate to exam list
  25 |   await page.goto('/exam-list', { waitUntil: 'domcontentloaded', timeout: 60000 })
  26 |   
  27 |   // Page should load (either with exams or auth redirect)
  28 |   const url = page.url()
  29 |   expect(url).toBeTruthy()
  30 | })
  31 | 
```