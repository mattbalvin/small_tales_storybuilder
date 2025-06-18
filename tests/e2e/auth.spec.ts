import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign up for new account', async ({ page }) => {
    await page.goto('/auth')
    
    // Switch to signup form
    await page.click('text=Sign up')
    
    // Fill out signup form
    await page.fill('input[type="text"]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[type="password"]:nth-of-type(2)', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL('/')
  })

  test('user can sign in with existing account', async ({ page }) => {
    await page.goto('/auth')
    
    // Fill out login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
  })

  test('user can sign out', async ({ page }) => {
    // Assuming user is already logged in
    await page.goto('/')
    
    // Click sign out button
    await page.click('text=Sign Out')
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth')
  })
})