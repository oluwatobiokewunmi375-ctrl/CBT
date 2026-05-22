import { test, expect } from '@playwright/test'

const baseUrl = 'http://127.0.0.1:3000'

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies()
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

async function loginDashboard(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
  await page.getByTestId('dashboard-access-button').click()
  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('password-input').fill(password)
  await Promise.all([
    page.waitForURL(/\/super-admin\/dashboard|\/admin\/dashboard|\/dashboard/, { timeout: 20000 }),
    page.getByTestId('login-submit-btn').click(),
  ])
}

async function loginExam(page, studentNo) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
  await page.getByTestId('student-exam-button').click()
  await page.getByTestId('student-id-input').fill(studentNo)
  await page.getByTestId('password-input').fill('stud123')
  await Promise.all([
    page.waitForURL(/\/exam-list/, { timeout: 20000 }),
    page.getByTestId('login-submit-btn').click(),
  ])
}

test.describe('CBT enterprise flow', () => {
  test('public routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'load' })
    await page.waitForURL(/\/login/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/login/)

    await page.goto(`${baseUrl}/student/dashboard`, { waitUntil: 'load' })
    await page.waitForURL(/\/login/, { timeout: 20000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('super admin login and dashboard access', async ({ page }) => {
    await loginDashboard(page, 'superadmin@test.com', 'admin123')
    await expect(page.locator('text=Super Admin Dashboard')).toBeVisible({ timeout: 20000 })
  })

  test('school admin login and admin dashboard', async ({ page }) => {
    await loginDashboard(page, 'admin@test.com', 'admin123')
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    await expect(page.locator('h1')).toContainText(/Dashboard/)
  })

  test('teacher login and admin dashboard', async ({ page }) => {
    await loginDashboard(page, 'teacher@test.com', 'teacher123')
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    await expect(page.locator('h1')).toContainText(/Dashboard/)
  })

  test('student exam login and full exam flow', async ({ page }) => {
    await loginExam(page, 'STU001')
    await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await expect(startButton).toBeVisible({ timeout: 30000 })
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await expect(page.locator('text=Time remaining')).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Next' }).first()).toBeVisible({ timeout: 20000 })

    const optionButtons = page.locator('button', { hasText: /A|B|C|D|True|False/i })
    if (await optionButtons.count()) {
      await optionButtons.first().click()
    } else {
      await page.getByRole('button').first().click()
    }

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Submit Exam' }).click()

    await expect(page.locator('text=Exam Submitted Successfully')).toBeVisible({ timeout: 30000 })
  })

  test('admin resets student password successfully', async ({ page }) => {
    // Admin logs in
    await loginDashboard(page, 'admin@test.com', 'admin123')
    await expect(page).toHaveURL(/\/admin\/dashboard/)

    // Navigate to students page
    await page.goto(`${baseUrl}/admin/students`, { waitUntil: 'load' })
    await expect(page.locator('text=Students Management')).toBeVisible({ timeout: 20000 })

    // Find and click reset password button for STU001
    const studentRow = page.locator('tr', { has: page.locator('text=STU001') })
    const resetButton = studentRow.locator('button', { hasText: /Reset Password/i })
    await expect(resetButton).toBeVisible({ timeout: 10000 })
    await resetButton.click()

    // Wait for success message
    await expect(page.locator('text=/Password reset successfully/i')).toBeVisible({ timeout: 10000 })

    // Logout admin
    await page.goto(`${baseUrl}/api/auth/logout`, { waitUntil: 'load' })

    // Login as student with new password (stud123)
    await loginExam(page, 'STU001')
    await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })

    // Verify student can see exams
    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await expect(startButton).toBeVisible({ timeout: 30000 })
  })
})
