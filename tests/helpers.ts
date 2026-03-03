import { Page } from '@playwright/test'

/** Přihlásí uživatele přes login formulář. */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  // Počkat na přesměrování na dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 })
}

/** Přihlásí admina. */
export async function loginAsAdmin(page: Page) {
  await login(page, 'admin@rael.school', 'admin123')
}
