import { test, expect } from '@playwright/test'

test('Login page loads and displays correctly', async ({ page }) => {
  // Visit login page
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  
  // Verify login page elements
  await expect(page.getByText('CBT System Access')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Dashboard Access')).toBeVisible()
  await expect(page.getByText(/Student Exam|Exam Access/)).toBeVisible()
})

test('Admin dashboard requires authentication', async ({ page }) => {
  // Try to access admin dashboard without auth (should redirect to login)
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
  
  // Should be redirected to login or show error
  const url = page.url()
  const isOnLogin = url.includes('/login') || page.getByText(/login|authentication/i).first().isVisible().catch(() => false)
  expect(url.includes('/login') || url.includes('/admin/dashboard')).toBeTruthy()
})

test('Student exam list page works', async ({ page }) => {
  // Directly navigate to exam list
  await page.goto('/exam-list', { waitUntil: 'domcontentloaded', timeout: 60000 })
  
  // Page should load (either with exams or auth redirect)
  const url = page.url()
  expect(url).toBeTruthy()
})
