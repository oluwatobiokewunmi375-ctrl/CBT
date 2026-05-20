# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enterprise-flow.spec.ts >> CBT enterprise flow >> super admin login and dashboard access
- Location: tests-e2e\enterprise-flow.spec.ts:45:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Dashboard Access' })

```

# Page snapshot

```yaml
- generic [ref=e2]: missing required error components, refreshing...
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const baseUrl = 'http://127.0.0.1:3000'
  4   | 
  5   | test.beforeEach(async ({ page }) => {
  6   |   await page.context().clearCookies()
  7   |   await page.addInitScript(() => {
  8   |     localStorage.clear()
  9   |     sessionStorage.clear()
  10  |   })
  11  | })
  12  | 
  13  | async function loginDashboard(page, email, password) {
  14  |   await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
> 15  |   await page.getByRole('button', { name: 'Dashboard Access' }).click()
      |                                                                ^ Error: locator.click: Test timeout of 30000ms exceeded.
  16  |   await page.getByPlaceholder('you@example.com').fill(email)
  17  |   await page.getByPlaceholder('••••••••').fill(password)
  18  |   await Promise.all([
  19  |     page.waitForURL(/\/super-admin\/dashboard|\/admin\/dashboard|\/dashboard/, { timeout: 20000 }),
  20  |     page.getByRole('button', { name: 'Go to Dashboard' }).click(),
  21  |   ])
  22  | }
  23  | 
  24  | async function loginExam(page, studentNo) {
  25  |   await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
  26  |   await page.getByRole('button', { name: 'Student Exam' }).click()
  27  |   await page.getByPlaceholder('e.g., 0001').fill(studentNo)
  28  |   await Promise.all([
  29  |     page.waitForURL(/\/exam-list/, { timeout: 20000 }),
  30  |     page.getByRole('button', { name: 'Enter Exam' }).click(),
  31  |   ])
  32  | }
  33  | 
  34  | test.describe('CBT enterprise flow', () => {
  35  |   test('public routes redirect to login when unauthenticated', async ({ page }) => {
  36  |     await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'load' })
  37  |     await page.waitForURL(/\/login/, { timeout: 20000 })
  38  |     await expect(page).toHaveURL(/\/login/)
  39  | 
  40  |     await page.goto(`${baseUrl}/student/dashboard`, { waitUntil: 'load' })
  41  |     await page.waitForURL(/\/login/, { timeout: 20000 })
  42  |     await expect(page).toHaveURL(/\/login/)
  43  |   })
  44  | 
  45  |   test('super admin login and dashboard access', async ({ page }) => {
  46  |     await loginDashboard(page, 'superadmin@test.com', 'admin123')
  47  |     await expect(page.locator('text=Super Admin Dashboard')).toBeVisible({ timeout: 20000 })
  48  |   })
  49  | 
  50  |   test('school admin login and admin dashboard', async ({ page }) => {
  51  |     await loginDashboard(page, 'admin@test.com', 'admin123')
  52  |     await expect(page).toHaveURL(/\/admin\/dashboard/)
  53  |     await expect(page.locator('h1')).toContainText(/Dashboard/)
  54  |   })
  55  | 
  56  |   test('teacher login and admin dashboard', async ({ page }) => {
  57  |     await loginDashboard(page, 'teacher@test.com', 'teacher123')
  58  |     await expect(page).toHaveURL(/\/admin\/dashboard/)
  59  |     await expect(page.locator('h1')).toContainText(/Dashboard/)
  60  |   })
  61  | 
  62  |   test('student exam login and full exam flow', async ({ page }) => {
  63  |     await loginExam(page, 'STU001')
  64  |     await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })
  65  | 
  66  |     const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
  67  |     await expect(startButton).toBeVisible({ timeout: 30000 })
  68  |     await Promise.all([
  69  |       page.waitForURL(/\/exam\//, { timeout: 20000 }),
  70  |       startButton.click(),
  71  |     ])
  72  | 
  73  |     await expect(page.locator('text=Time remaining')).toBeVisible({ timeout: 20000 })
  74  |     await expect(page.getByRole('button', { name: 'Next' }).first()).toBeVisible({ timeout: 20000 })
  75  | 
  76  |     const optionButtons = page.locator('button', { hasText: /A|B|C|D|True|False/i })
  77  |     if (await optionButtons.count()) {
  78  |       await optionButtons.first().click()
  79  |     } else {
  80  |       await page.getByRole('button').first().click()
  81  |     }
  82  | 
  83  |     await page.getByRole('button', { name: 'Next' }).click()
  84  |     await page.getByRole('button', { name: 'Next' }).click()
  85  |     await page.getByRole('button', { name: 'Next' }).click()
  86  |     await page.getByRole('button', { name: 'Submit Exam' }).click()
  87  | 
  88  |     await expect(page.locator('text=Exam Submitted Successfully')).toBeVisible({ timeout: 30000 })
  89  |   })
  90  | 
  91  |   test('forgot password and reset password flow', async ({ page }) => {
  92  |     await page.goto(`${baseUrl}/forgot-password`, { waitUntil: 'load' })
  93  |     await page.getByPlaceholder('Enter your email').fill('student1@test.com')
  94  |     await page.getByRole('button', { name: 'Send Reset Link' }).click()
  95  | 
  96  |     const resetLink = await page.locator('a[href*="/reset-password?token="]').first()
  97  |     await expect(resetLink).toBeVisible({ timeout: 20000 })
  98  |     const href = await resetLink.getAttribute('href')
  99  |     expect(href).toContain('/reset-password?token=')
  100 | 
  101 |     await Promise.all([
  102 |       page.waitForURL(/\/reset-password\?token=/, { timeout: 20000 }),
  103 |       page.goto(href!, { waitUntil: 'load' }),
  104 |     ])
  105 | 
  106 |     await expect(page.locator('input[placeholder="Enter new password"]').first()).toBeVisible({ timeout: 20000 })
  107 |     await page.getByPlaceholder('Enter new password').fill('newstudent123')
  108 |     await page.getByPlaceholder('Confirm new password').fill('newstudent123')
  109 |     await page.getByRole('button', { name: 'Reset Password' }).click()
  110 | 
  111 |     await expect(page.locator('text=Your password has been updated successfully.')).toBeVisible({ timeout: 30000 })
  112 | 
  113 |     await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
  114 |     await page.getByRole('button', { name: 'Dashboard Access' }).click()
  115 |     await page.getByPlaceholder('you@example.com').fill('student1@test.com')
```