import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Admin page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('loads admin page and shows codelist sections', async ({ page }) => {
    await page.goto('/admin')

    // Admin stránka by měla zobrazit číselníky
    await expect(page.locator('text=/[Čč]íselní|[Cc]odelist|[Aa]dmin/').first()).toBeVisible({ timeout: 10000 })

    // Měl by být minimálně jeden collapsible/expandable section
    const sections = page.locator('h2, h3, [data-section]')
    const count = await sections.count()
    expect(count).toBeGreaterThan(0)
  })
})
