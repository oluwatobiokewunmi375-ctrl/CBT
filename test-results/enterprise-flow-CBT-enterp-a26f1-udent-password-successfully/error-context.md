# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enterprise-flow.spec.ts >> CBT enterprise flow >> admin resets student password successfully
- Location: tests-e2e\enterprise-flow.spec.ts:92:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Students Management')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=Students Management')

```

```yaml
- alert
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
  15  |   await page.getByTestId('dashboard-access-button').click()
  16  |   await page.getByTestId('email-input').fill(email)
  17  |   await page.getByTestId('password-input').fill(password)
  18  |   await Promise.all([
  19  |     page.waitForURL(/\/super-admin\/dashboard|\/admin\/dashboard|\/dashboard/, { timeout: 20000 }),
  20  |     page.getByTestId('login-submit-btn').click(),
  21  |   ])
  22  | }
  23  | 
  24  | async function loginExam(page, studentNo) {
  25  |   await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
  26  |   await page.getByTestId('student-exam-button').click()
  27  |   await page.getByTestId('student-id-input').fill(studentNo)
  28  |   await page.getByTestId('password-input').fill('stud123')
  29  |   await Promise.all([
  30  |     page.waitForURL(/\/exam-list/, { timeout: 20000 }),
  31  |     page.getByTestId('login-submit-btn').click(),
  32  |   ])
  33  | }
  34  | 
  35  | test.describe('CBT enterprise flow', () => {
  36  |   test('public routes redirect to login when unauthenticated', async ({ page }) => {
  37  |     await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'load' })
  38  |     await page.waitForURL(/\/login/, { timeout: 20000 })
  39  |     await expect(page).toHaveURL(/\/login/)
  40  | 
  41  |     await page.goto(`${baseUrl}/student/dashboard`, { waitUntil: 'load' })
  42  |     await page.waitForURL(/\/login/, { timeout: 20000 })
  43  |     await expect(page).toHaveURL(/\/login/)
  44  |   })
  45  | 
  46  |   test('super admin login and dashboard access', async ({ page }) => {
  47  |     await loginDashboard(page, 'superadmin@test.com', 'admin123')
  48  |     await expect(page.locator('text=Super Admin Dashboard')).toBeVisible({ timeout: 20000 })
  49  |   })
  50  | 
  51  |   test('school admin login and admin dashboard', async ({ page }) => {
  52  |     await loginDashboard(page, 'admin@test.com', 'admin123')
  53  |     await expect(page).toHaveURL(/\/admin\/dashboard/)
  54  |     await expect(page.locator('h1')).toContainText(/Dashboard/)
  55  |   })
  56  | 
  57  |   test('teacher login and admin dashboard', async ({ page }) => {
  58  |     await loginDashboard(page, 'teacher@test.com', 'teacher123')
  59  |     await expect(page).toHaveURL(/\/admin\/dashboard/)
  60  |     await expect(page.locator('h1')).toContainText(/Dashboard/)
  61  |   })
  62  | 
  63  |   test('student exam login and full exam flow', async ({ page }) => {
  64  |     await loginExam(page, 'STU001')
  65  |     await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })
  66  | 
  67  |     const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
  68  |     await expect(startButton).toBeVisible({ timeout: 30000 })
  69  |     await Promise.all([
  70  |       page.waitForURL(/\/exam\//, { timeout: 20000 }),
  71  |       startButton.click(),
  72  |     ])
  73  | 
  74  |     await expect(page.locator('text=Time remaining')).toBeVisible({ timeout: 20000 })
  75  |     await expect(page.getByRole('button', { name: 'Next' }).first()).toBeVisible({ timeout: 20000 })
  76  | 
  77  |     const optionButtons = page.locator('button', { hasText: /A|B|C|D|True|False/i })
  78  |     if (await optionButtons.count()) {
  79  |       await optionButtons.first().click()
  80  |     } else {
  81  |       await page.getByRole('button').first().click()
  82  |     }
  83  | 
  84  |     await page.getByRole('button', { name: 'Next' }).click()
  85  |     await page.getByRole('button', { name: 'Next' }).click()
  86  |     await page.getByRole('button', { name: 'Next' }).click()
  87  |     await page.getByRole('button', { name: 'Submit Exam' }).click()
  88  | 
  89  |     await expect(page.locator('text=Exam Submitted Successfully')).toBeVisible({ timeout: 30000 })
  90  |   })
  91  | 
  92  |   test('admin resets student password successfully', async ({ page }) => {
  93  |     // Admin logs in
  94  |     await loginDashboard(page, 'admin@test.com', 'admin123')
  95  |     await expect(page).toHaveURL(/\/admin\/dashboard/)
  96  | 
  97  |     // Navigate to students page
  98  |     await page.goto(`${baseUrl}/admin/students`, { waitUntil: 'load' })
> 99  |     await expect(page.locator('text=Students Management')).toBeVisible({ timeout: 20000 })
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  100 | 
  101 |     // Find and click reset password button for STU001
  102 |     const studentRow = page.locator('tr', { has: page.locator('text=STU001') })
  103 |     const resetButton = studentRow.locator('button', { hasText: /Reset Password/i })
  104 |     await expect(resetButton).toBeVisible({ timeout: 10000 })
  105 |     await resetButton.click()
  106 | 
  107 |     // Wait for success message
  108 |     await expect(page.locator('text=/Password reset successfully/i')).toBeVisible({ timeout: 10000 })
  109 | 
  110 |     // Logout admin
  111 |     await page.goto(`${baseUrl}/api/auth/logout`, { waitUntil: 'load' })
  112 | 
  113 |     // Login as student with new password (stud123)
  114 |     await loginExam(page, 'STU001')
  115 |     await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })
  116 | 
  117 |     // Verify student can see exams
  118 |     const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
  119 |     await expect(startButton).toBeVisible({ timeout: 30000 })
  120 |   })
  121 | })
  122 | 
```