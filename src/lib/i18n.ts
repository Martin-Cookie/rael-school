/**
 * Translation system for Czech, English, Swahili.
 *
 * To add a new language:
 * 1. Add locale code to `Locale` type and `locales` array
 * 2. Add display name to `localeNames`
 * 3. Create `src/messages/<code>.json` with all translation keys
 * 4. Add `name<Code>` field to codelist models in schema.prisma
 * 5. Update `getLocaleName()` to handle the new locale
 */

export type Locale = 'cs' | 'en' | 'sw'

export const locales: Locale[] = ['cs', 'en', 'sw']

export const localeNames: Record<Locale, string> = {
  cs: 'Čeština',
  en: 'English',
  sw: 'Kiswahili',
}

/** Get nested value from object by dot-notation path (e.g. 'student.name'). */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) || path
}

/** Get localized name from a codelist item. Falls back to Czech (name) if translation missing. */
export function getLocaleName(item: { name: string; nameEn?: string | null; nameSw?: string | null }, locale: Locale): string {
  if (locale === 'en' && item.nameEn) return item.nameEn
  if (locale === 'sw' && item.nameSw) return item.nameSw
  return item.name
}

/**
 * Create a translator function `t(key, params?)` for the given translations.
 * Supports dot-notation keys and `{param}` interpolation.
 * @example const t = createTranslator(csTranslations); t('student.name') // → "Jméno"
 */
export function createTranslator(translations: Record<string, any>) {
  return function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(translations, key)
    if (typeof value !== 'string') return key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v))
      })
    }
    return value
  }
}
