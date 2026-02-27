// Format number with thousands separator
export function formatNumber(num: number): string {
  return num.toLocaleString('cs-CZ')
}

// Format currency (KES - Kenyan Shillings)
export function formatCurrency(amount: number): string {
  return `${formatNumber(amount)} KES`
}

// Format amount with any currency
export function fmtCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}

// Format date to locale string
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

// Format date for input fields (YYYY-MM-DD)
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

// Calculate age from date of birth
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
