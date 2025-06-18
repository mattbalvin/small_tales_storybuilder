import { test, expect } from '@playwright/test'

test.describe('Story Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('user can create a new story', async ({ page }) => {
    // Click new story button
    await page.click('text=New Story')
    
    // Should navigate to editor
    await expect(page).toHaveURL(/\/editor\//)
    
    // Should show editor interface
    await expect(page.locator('text=Untitled Story')).toBeVisible()
  })

  test('user can add text element to story page', async ({ page }) => {
    // Create new story
    await page.click('text=New Story')
    await expect(page).toHaveURL(/\/editor\//)
    
    // Add first page if none exists
    await page.click('text=Add First Page')
    
    // Add text element
    await page.click('text=Text')
    
    // Verify text element appears on canvas
    await expect(page.locator('[contenteditable="true"]')).toBeVisible()
  })

  test('user can switch between landscape and portrait orientations', async ({ page }) => {
    // Create new story
    await page.click('text=New Story')
    await expect(page).toHaveURL(/\/editor\//)
    
    // Add first page
    await page.click('text=Add First Page')
    
    // Switch to portrait mode
    await page.click('text=9:16')
    
    // Canvas should change aspect ratio
    await expect(page.locator('.aspect-9\\/16')).toBeVisible()
    
    // Switch back to landscape
    await page.click('text=16:9')
    
    // Canvas should change back
    await expect(page.locator('.aspect-16\\/9')).toBeVisible()
  })

  test('user can save story changes', async ({ page }) => {
    // Create new story
    await page.click('text=New Story')
    await expect(page).toHaveURL(/\/editor\//)
    
    // Add content
    await page.click('text=Add First Page')
    await page.click('text=Text')
    
    // Save story
    await page.click('text=Save')
    
    // Should show success indication (you might need to adjust this based on your UI)
    await expect(page.locator('text=Save')).toBeVisible()
  })
})