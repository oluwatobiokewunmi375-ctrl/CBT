# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enterprise-flow.spec.ts >> CBT enterprise flow >> student exam login and full exam flow
- Location: tests-e2e\enterprise-flow.spec.ts:45:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Start Exam' }).first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('button', { name: 'Start Exam' }).first()

```

```yaml
- paragraph: Student Exam Portal
- heading "Available Exams" [level=1]
- paragraph: Choose a published exam to start the CBT session with live timer and auto-save support.
- paragraph: No exams are currently available.
- button "Back to dashboard"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const baseUrl = 'http://127.0.0.1:3000'
  4  | 
  5  | async function loginDashboard(page, email, password) {
  6  |   await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  7  |   await page.getByRole('button', { name: 'Dashboard Access' }).click()
  8  |   await page.getByPlaceholder('you@example.com').fill(email)
  9  |   await page.getByPlaceholder('••••••••').fill(password)
  10 |   await page.getByRole('button', { name: 'Go to Dashboard' }).click()
  11 |   await expect(page).toHaveURL(/\/super-admin\/dashboard|\/admin\/dashboard|\/dashboard/)
  12 | }
  13 | 
  14 | async function loginExam(page, studentNo) {
  15 |   await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  16 |   await page.getByRole('button', { name: 'Student Exam' }).click()
  17 |   await page.getByPlaceholder('e.g., 0001').fill(studentNo)
  18 |   await page.getByRole('button', { name: 'Enter Exam' }).click()
  19 |   await expect(page).toHaveURL(/\/exam-list/)
  20 | }
  21 | 
  22 | test.describe('CBT enterprise flow', () => {
  23 |   test('public routes redirect to login when unauthenticated', async ({ page }) => {
  24 |     await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' })
  25 |     await expect(page).toHaveURL(/\/login/) 
  26 |     await page.goto(`${baseUrl}/student/dashboard`, { waitUntil: 'networkidle' })
  27 |     await expect(page).toHaveURL(/\/login/)
  28 |   })
  29 | 
  30 |   test('super admin login and dashboard access', async ({ page }) => {
  31 |     await loginDashboard(page, 'superadmin@test.com', 'admin123')
  32 |     await expect(page.locator('text=Super Admin Dashboard')).toBeVisible({ timeout: 20000 })
  33 |   })
  34 | 
  35 |   test('school admin login and admin dashboard', async ({ page }) => {
  36 |     await loginDashboard(page, 'admin@test.com', 'admin123')
  37 |     await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 20000 })
  38 |   })
  39 | 
  40 |   test('teacher login and admin dashboard', async ({ page }) => {
  41 |     await loginDashboard(page, 'teacher@test.com', 'teacher123')
  42 |     await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 20000 })
  43 |   })
  44 | 
  45 |   test('student exam login and full exam flow', async ({ page }) => {
  46 |     await loginExam(page, 'STU001')
  47 |     await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })
  48 | 
  49 |     const startButtons = page.getByRole('button', { name: 'Start Exam' })
> 50 |     await expect(startButtons.first()).toBeVisible({ timeout: 20000 })
     |                                        ^ Error: expect(locator).toBeVisible() failed
  51 |     await startButtons.first().click()
  52 | 
  53 |     await expect(page.locator('text=Time remaining')).toBeVisible({ timeout: 20000 })
  54 |     await expect(page.locator('button', { hasText: 'Next' }).first()).toBeVisible({ timeout: 20000 })
  55 | 
  56 |     const optionButtons = page.locator('button', { hasText: /A|B|C|D|True|False/ })
  57 |     if (await optionButtons.count()) {
  58 |       await optionButtons.first().click()
  59 |     } else {
  60 |       await page.locator('button').first().click()
  61 |     }
  62 | 
  63 |     await page.getByRole('button', { name: 'Next' }).click()
  64 |     await page.getByRole('button', { name: 'Next' }).click()
  65 |     await page.getByRole('button', { name: 'Next' }).click()
  66 |     await page.getByRole('button', { name: 'Submit Exam' }).click()
  67 | 
  68 |     await expect(page.locator('text=Exam Submitted Successfully')).toBeVisible({ timeout: 20000 })
  69 |   })
  70 | 
  71 |   test('forgot password and reset password flow', async ({ page }) => {
  72 |     await page.goto(`${baseUrl}/forgot-password`, { waitUntil: 'networkidle' })
  73 |     await page.getByPlaceholder('Enter your email').fill('student1@test.com')
  74 |     await page.getByRole('button', { name: 'Send Reset Link' }).click()
  75 | 
  76 |     const resetLink = await page.locator('a[href*="/reset-password?token="]').first()
  77 |     await expect(resetLink).toBeVisible({ timeout: 20000 })
  78 |     const href = await resetLink.getAttribute('href')
  79 |     expect(href).toContain('/reset-password?token=')
  80 | 
  81 |     await page.goto(href!, { waitUntil: 'networkidle' })
  82 |     await page.getByPlaceholder('Enter new password').fill('newstudent123')
  83 |     await page.getByPlaceholder('Confirm new password').fill('newstudent123')
  84 |     await page.getByRole('button', { name: 'Reset Password' }).click()
  85 | 
  86 |     await expect(page.locator('text=Your password has been updated successfully.')).toBeVisible({ timeout: 20000 })
  87 | 
  88 |     await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  89 |     await page.getByRole('button', { name: 'Dashboard Access' }).click()
  90 |     await page.getByPlaceholder('you@example.com').fill('student1@test.com')
  91 |     await page.getByPlaceholder('••••••••').fill('newstudent123')
  92 |     await page.getByRole('button', { name: 'Go to Dashboard' }).click()
  93 |     await expect(page).toHaveURL(/\/dashboard/)
  94 |   })
  95 | })
  96 | 
```