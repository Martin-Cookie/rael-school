// Translation system for Czech, English, Swahili

export type Locale = 'cs' | 'en' | 'sw'

export const locales: Locale[] = ['cs', 'en', 'sw']

export const localeNames: Record<Locale, string> = {
  cs: 'Čeština',
  en: 'English',
  sw: 'Kiswahili',
}

// Get nested value from object by dot notation
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) || path
}

// Get localized name from a codelist item (name=cs, nameEn=en, nameSw=sw)
export function getLocaleName(item: { name: string; nameEn?: string | null; nameSw?: string | null }, locale: Locale): string {
  if (locale === 'en' && item.nameEn) return item.nameEn
  if (locale === 'sw' && item.nameSw) return item.nameSw
  return item.name
}

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
