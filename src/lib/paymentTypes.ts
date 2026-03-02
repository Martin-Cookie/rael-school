interface PaymentTypeRecord {
  id: string
  name: string
  nameEn?: string | null
  nameSw?: string | null
}

/** Detekce typu stravenky podle názvu */
export function isVoucherPaymentType(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('stravenk') || lower.includes('voucher')
}

/** Vrátí ID všech typů plateb, které jsou stravenky */
export function getVoucherTypeIds(types: PaymentTypeRecord[]): string[] {
  return types.filter(pt => isVoucherPaymentType(pt.name)).map(pt => pt.id)
}

/** Detekce typu školného podle názvu (cs/en/sw) */
export function isTuitionPaymentType(pt: PaymentTypeRecord): boolean {
  const text = (pt.name + (pt.nameEn || '') + (pt.nameSw || '')).toLowerCase()
  return /školné|tuition|karo/.test(text)
}

/** Vrátí ID všech typů plateb, které jsou školné */
export function getTuitionTypeIds(types: PaymentTypeRecord[]): string[] {
  return types.filter(isTuitionPaymentType).map(pt => pt.id)
}
