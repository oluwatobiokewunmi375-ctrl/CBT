import { test, expect } from '@playwright/test'

const baseUrl = 'http://127.0.0.1:3000'

async function loginDashboard(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Dashboard Access' }).click()
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Go to Dashboard' }).click()
  await expect(page).toHaveURL(/\/super-admin\/dashboard|\/admin\/dashboard|\/dashboard/)
}

async function loginExam(page, studentNo) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Student Exam' }).click()
  await page.getByPlaceholder('e.g., 0001').fill(studentNo)
  await page.getByRole('button', { name: 'Enter Exam' }).click()
  await expect(page).toHaveURL(/\/exam-list/)
}

test.describe('CBT enterprise flow', () => {
  test('public routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/login/) 
    await page.goto(`${baseUrl}/student/dashboard`, { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/login/)
  })

  test('super admin login and dashboard access', async ({ page }) => {
    await loginDashboard(page, 'superadmin@test.com', 'admin123')
    await expect(page.locator('text=Super Admin Dashboard')).toBeVisible({ timeout: 20000 })
  })

  test('school admin login and admin dashboard', async ({ page }) => {
    await loginDashboard(page, 'admin@test.com', 'admin123')
    await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 20000 })
  })

  test('teacher login and admin dashboard', async ({ page }) => {
    await loginDashboard(page, 'teacher@test.com', 'teacher123')
    await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 20000 })
  })

  test('student exam login and full exam flow', async ({ page }) => {
    await loginExam(page, 'STU001')
    await expect(page.locator('text=Available Exams')).toBeVisible({ timeout: 20000 })

    const startButtons = page.getByRole('button', { name: 'Start Exam' })
    await expect(startButtons.first()).toBeVisible({ timeout: 20000 })
    await startButtons.first().click()

    await expect(page.locator('text=Time remaining')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('button', { hasText: 'Next' }).first()).toBeVisible({ timeout: 20000 })

    const optionButtons = page.locator('button', { hasText: /A|B|C|D|True|False/ })
    if (await optionButtons.count()) {
      await optionButtons.first().click()
    } else {
      await page.locator('button').first().click()
    }

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Submit Exam' }).click()

    await expect(page.locator('text=Exam Submitted Successfully')).toBeVisible({ timeout: 20000 })
  })

  test('forgot password and reset password flow', async ({ page }) => {
    await page.goto(`${baseUrl}/forgot-password`, { waitUntil: 'networkidle' })
    await page.getByPlaceholder('Enter your email').fill('student1@test.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()

    const resetLink = await page.locator('a[href*="/reset-password?token="]').first()
    await expect(resetLink).toBeVisible({ timeout: 20000 })
    const href = await resetLink.getAttribute('href')
    expect(href).toContain('/reset-password?token=')

    await page.goto(href!, { waitUntil: 'networkidle' })
    await page.getByPlaceholder('Enter new password').fill('newstudent123')
    await page.getByPlaceholder('Confirm new password').fill('newstudent123')
    await page.getByRole('button', { name: 'Reset Password' }).click()

    await expect(page.locator('text=Your password has been updated successfully.')).toBeVisible({ timeout: 20000 })

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Dashboard Access' }).click()
    await page.getByPlaceholder('you@example.com').fill('student1@test.com')
    await page.getByPlaceholder('••••••••').fill('newstudent123')
    await page.getByRole('button', { name: 'Go to Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
