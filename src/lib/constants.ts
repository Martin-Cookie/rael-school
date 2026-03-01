export const CURRENCIES = ['CZK', 'EUR', 'USD', 'KES'] as const
export type Currency = (typeof CURRENCIES)[number]
