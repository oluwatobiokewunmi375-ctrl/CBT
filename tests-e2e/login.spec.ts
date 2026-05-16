import { test, expect } from '@playwright/test'

test('Login page UI and redirect flows', async ({ page }) => {
  // Visit login page
  await page.goto('/login')
  await expect(page.getByText('Dashboard Access')).toBeVisible()
  await expect(page.getByText('Student Exam')).toBeVisible()

  // Simulate an admin session and verify dashboard access
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ role: 'SCHOOL_ADMIN', fullName: 'E2E Admin', id: 'admin1', school_id: 's1' }))
  })
  await page.goto('/admin/dashboard')
  await expect(page.getByText('School Admin Dashboard')).toBeVisible()

  // Simulate a student session and verify exam-list access
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ role: 'STUDENT', fullName: 'E2E Student', id: 'stu1' }))
  })
  await page.goto('/exam-list')
  await expect(page.getByText('Available Exams')).toBeVisible()
})
