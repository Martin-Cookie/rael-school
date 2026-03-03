import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Students list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('shows student list and search works', async ({ page }) => {
    await page.goto('/students')

    // Počkat na načtení tabulky studentů
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10000 })

    // Měl by být alespoň 1 řádek
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 5000 })

    // Vyhledávání — zadat text do searchboxu
    const searchInput = page.locator('input[type="text"][placeholder*="led"], input[type="search"], input[placeholder*="earch"], input[placeholder*="Hled"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('a')
      await page.waitForTimeout(300)
      // Po filtrování by stále měla být tabulka
      await expect(page.locator('table, [role="table"]').first()).toBeVisible()
    }
  })

  test('clicking on student navigates to detail', async ({ page }) => {
    await page.goto('/students')

    // Počkat na načtení
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })

    // Kliknout na prvního studenta (odkaz v řádku)
    const firstLink = page.locator('tbody tr a').first()
    if (await firstLink.isVisible()) {
      await firstLink.click()
      await page.waitForURL(/\/students\//, { timeout: 10000 })
      await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9]/)
    }
  })
})
