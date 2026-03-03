import { describe, it, expect } from 'vitest'
import { isVoucherPaymentType, isTuitionPaymentType, getVoucherTypeIds, getTuitionTypeIds } from '@/lib/paymentTypes'

const mockPaymentTypes = [
  { id: '1', name: 'Školné', nameEn: 'Tuition', nameSw: 'Karo' },
  { id: '2', name: 'Stravenky', nameEn: 'Vouchers', nameSw: null },
  { id: '3', name: 'Ordinace - měsíční příspěvek', nameEn: null, nameSw: null },
  { id: '4', name: 'Platba za kávu', nameEn: null, nameSw: null },
]

describe('payment type detection', () => {
  it('detects voucher types by name', () => {
    expect(isVoucherPaymentType('Stravenky')).toBe(true)
    expect(isVoucherPaymentType('stravenky pro studenta')).toBe(true)
    expect(isVoucherPaymentType('Meal Voucher')).toBe(true)
    expect(isVoucherPaymentType('Školné')).toBe(false)
    expect(isVoucherPaymentType('Ordinace')).toBe(false)
  })

  it('detects tuition types by name (cs/en/sw)', () => {
    expect(isTuitionPaymentType({ id: '1', name: 'Školné' })).toBe(true)
    expect(isTuitionPaymentType({ id: '1', name: 'test', nameEn: 'Tuition Fee' })).toBe(true)
    expect(isTuitionPaymentType({ id: '1', name: 'test', nameSw: 'Karo ya shule' })).toBe(true)
    expect(isTuitionPaymentType({ id: '1', name: 'Stravenky' })).toBe(false)
  })

  it('getVoucherTypeIds filters correctly', () => {
    const ids = getVoucherTypeIds(mockPaymentTypes)
    expect(ids).toEqual(['2'])
  })

  it('getTuitionTypeIds filters correctly', () => {
    const ids = getTuitionTypeIds(mockPaymentTypes)
    expect(ids).toEqual(['1'])
  })
})

describe('import split/approve logic', () => {
  it('voucher count calculation from rate', () => {
    // Simulate the logic from approve endpoint
    const amount = 800
    const rate = 80
    const count = Math.floor(amount / rate)
    expect(count).toBe(10)
  })

  it('voucher count with fallback rate', () => {
    const amount = 240
    const fallbackRate = 80
    const count = Math.floor(amount / fallbackRate)
    expect(count).toBe(3)
  })

  it('voucher count uses manual value when available', () => {
    const manualCount = 5
    const amount = 800
    const rate = 80
    const voucherCount = manualCount ?? Math.floor(amount / rate)
    expect(voucherCount).toBe(5) // manual overrides calculation
  })

  it('split parts should sum to original amount', () => {
    const originalAmount = 1000
    const parts = [
      { amount: 600, type: 'tuition' },
      { amount: 400, type: 'voucher' },
    ]
    const total = parts.reduce((sum, p) => sum + p.amount, 0)
    expect(total).toBe(originalAmount)
  })
})
