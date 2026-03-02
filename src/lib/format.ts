/** Formátuje číslo s oddělovačem tisíců (mezera). Např. `1000` → `"1 000"` */
export function formatNumber(num: number): string {
  return num.toLocaleString('cs-CZ')
}

/** Formátuje částku v KES. Např. `1500` → `"1 500 KES"` */
export function formatCurrency(amount: number): string {
  return `${formatNumber(amount)} KES`
}

/** Formátuje částku s libovolnou měnou. Např. `fmtCurrency(1500, 'CZK')` → `"1 500 CZK"` */
export function fmtCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}

/**
 * Formátuje datum do lokalizovaného řetězce (DD.MM.YYYY).
 * @param date - Date objekt, ISO string, nebo null
 * @param locale - `'cs'` | `'en'` | `'sw'` (default `'cs'`)
 * @returns Formátovaný datum nebo `'-'` pro neplatné/null vstupy
 */
export function formatDate(date: Date | string | null | undefined, locale: string = 'cs'): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  
  const localeMap: Record<string, string> = {
    cs: 'cs-CZ',
    en: 'en-GB',
    sw: 'sw-KE',
  }
  
  return d.toLocaleDateString(localeMap[locale] || 'cs-CZ', options)
}

/** Formátuje datum pro HTML `<input type="date">` (YYYY-MM-DD). Vrací `''` pro null. */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

/** Vypočítá věk z data narození. Vrací `null` pro neplatné/null vstupy. */
export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}
