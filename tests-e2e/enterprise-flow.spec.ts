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
  await page.getByRole('button', { name: 'Dashboard Access' }).click()
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await Promise.all([
    page.waitForURL(/\/super-admin\/dashboard|\/admin\/dashboard|\/dashboard/, { timeout: 20000 }),
    page.getByRole('button', { name: 'Go to Dashboard' }).click(),
  ])
}

async function loginExam(page, studentNo) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
  await page.getByRole('button', { name: 'Student Exam' }).click()
  await page.getByPlaceholder('e.g., 0001').fill(studentNo)
  await Promise.all([
    page.waitForURL(/\/exam-list/, { timeout: 20000 }),
    page.getByRole('button', { name: 'Enter Exam' }).click(),
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

  test('forgot password and reset password flow', async ({ page }) => {
    await page.goto(`${baseUrl}/forgot-password`, { waitUntil: 'load' })
    await page.getByPlaceholder('Enter your email').fill('student1@test.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()

    const resetLink = await page.locator('a[href*="/reset-password?token="]').first()
    await expect(resetLink).toBeVisible({ timeout: 20000 })
    const href = await resetLink.getAttribute('href')
    expect(href).toContain('/reset-password?token=')

    await Promise.all([
      page.waitForURL(/\/reset-password\?token=/, { timeout: 20000 }),
      page.goto(href!, { waitUntil: 'load' }),
    ])

    await expect(page.locator('input[placeholder="Enter new password"]').first()).toBeVisible({ timeout: 20000 })
    await page.getByPlaceholder('Enter new password').fill('newstudent123')
    await page.getByPlaceholder('Confirm new password').fill('newstudent123')
    await page.getByRole('button', { name: 'Reset Password' }).click()

    await expect(page.locator('text=Your password has been updated successfully.')).toBeVisible({ timeout: 30000 })

    await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })
    await page.getByRole('button', { name: 'Dashboard Access' }).click()
    await page.getByPlaceholder('you@example.com').fill('student1@test.com')
    await page.getByPlaceholder('••••••••').fill('newstudent123')
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 20000 }),
      page.getByRole('button', { name: 'Go to Dashboard' }).click(),
    ])
  })
})
