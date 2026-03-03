export const CURRENCIES = ['CZK', 'EUR', 'USD', 'KES'] as const
export type Currency = (typeof CURRENCIES)[number]

// Default měny pro různé typy plateb
export const DEFAULT_VOUCHER_CURRENCY = 'CZK'
export const DEFAULT_SPONSOR_PAYMENT_CURRENCY = 'KES'

// Fallback sazba stravenky (pokud VoucherRate pro danou měnu neexistuje)
export const DEFAULT_VOUCHER_RATE_FALLBACK = 80

// Tolerance pro porovnání částek (floating point)
export const AMOUNT_TOLERANCE = 0.01

// API limity pro dotazy (default take)
export const API_LIMITS = {
  PAYMENTS: 1000,
  DASHBOARD_RECENT: 10,
} as const
