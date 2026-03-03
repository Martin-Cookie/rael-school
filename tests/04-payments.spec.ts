import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Payments page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('loads payments and shows tables', async ({ page }) => {
    await page.goto('/payments')

    // Počkat na načtení dat
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10000 })

    // Měly by být viditelné záložky (Sponzorské platby / Stravenky)
    const tabs = page.locator('button').filter({ hasText: /[Ss]ponzor|[Vv]oucher|[Ss]traven/ })
    await expect(tabs.first()).toBeVisible({ timeout: 5000 })
  })

  test('can switch between payment tabs', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 })

    // Najít záložku stravenek a kliknout
    const voucherTab = page.locator('button').filter({ hasText: /[Ss]traven|[Vv]oucher/ }).first()
    if (await voucherTab.isVisible()) {
      await voucherTab.click()
      await page.waitForTimeout(500)
      // Po přepnutí by měla být vidět tabulka
      await expect(page.locator('table').first()).toBeVisible()
    }
  })
})
