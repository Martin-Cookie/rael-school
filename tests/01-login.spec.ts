import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Login flow', () => {
  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@rael.school')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    // Měl by zůstat na login stránce s chybovou hláškou
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('text=Invalid credentials').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 })
  })

  test('logs in with correct credentials and redirects to dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/\/dashboard/)
    // Dashboard by měl zobrazit nadpis nebo obsah
    await expect(page.locator('h1, h2, [data-testid="dashboard"]').first()).toBeVisible({ timeout: 5000 })
  })
})
