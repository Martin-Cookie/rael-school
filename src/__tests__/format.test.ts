import { describe, it, expect } from 'vitest'
import { formatNumber, formatCurrency, fmtCurrency, formatDate, formatDateForInput, calculateAge } from '@/lib/format'

describe('formatNumber', () => {
  it('formats thousands with space separator', () => {
    const result = formatNumber(1000)
    // cs-CZ uses non-breaking space (U+00A0) as thousands separator
    expect(result.replace(/\s/g, ' ')).toBe('1 000')
  })

  it('formats large numbers', () => {
    const result = formatNumber(1234567)
    expect(result.replace(/\s/g, ' ')).toBe('1 234 567')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats negative numbers', () => {
    const result = formatNumber(-500)
    expect(result.replace(/[−\-]/g, '-').replace(/\s/g, ' ')).toContain('-500')
  })
})

describe('formatCurrency', () => {
  it('appends KES to formatted number', () => {
    const result = formatCurrency(1500)
    expect(result.replace(/\s/g, ' ')).toBe('1 500 KES')
  })
})

describe('fmtCurrency', () => {
  it('formats with CZK', () => {
    const result = fmtCurrency(1500, 'CZK')
    expect(result.replace(/\s/g, ' ')).toBe('1 500 CZK')
  })

  it('formats with EUR', () => {
    const result = fmtCurrency(250, 'EUR')
    expect(result).toBe('250 EUR')
  })

  it('formats with KES', () => {
    const result = fmtCurrency(80000, 'KES')
    expect(result.replace(/\s/g, ' ')).toBe('80 000 KES')
  })
})

describe('formatDate', () => {
  it('formats date in cs locale', () => {
    const result = formatDate('2024-03-15', 'cs')
    expect(result).toBe('15. 03. 2024')
  })

  it('formats date in en locale', () => {
    const result = formatDate('2024-03-15', 'en')
    expect(result).toBe('15/03/2024')
  })

  it('returns - for null', () => {
    expect(formatDate(null)).toBe('-')
  })

  it('returns - for undefined', () => {
    expect(formatDate(undefined)).toBe('-')
  })

  it('returns - for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('-')
  })
})

describe('formatDateForInput', () => {
  it('formats to YYYY-MM-DD', () => {
    expect(formatDateForInput('2024-03-15T12:00:00Z')).toBe('2024-03-15')
  })

  it('returns empty string for null', () => {
    expect(formatDateForInput(null)).toBe('')
  })

  it('returns empty string for invalid', () => {
    expect(formatDateForInput('invalid')).toBe('')
  })
})

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
    tenYearsAgo.setMonth(0, 1) // Jan 1st to avoid boundary issues
    expect(calculateAge(tenYearsAgo.toISOString())).toBe(10)
  })

  it('returns null for null input', () => {
    expect(calculateAge(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(calculateAge(undefined)).toBeNull()
  })

  it('returns null for invalid date', () => {
    expect(calculateAge('not-a-date')).toBeNull()
  })

  it('handles birthday not yet passed this year', () => {
    const futureMonth = new Date()
    futureMonth.setFullYear(futureMonth.getFullYear() - 5)
    futureMonth.setMonth(11, 31) // Dec 31st
    const age = calculateAge(futureMonth.toISOString())
    // If today is before Dec 31, age should be 4; if Dec 31, age is 5
    expect(age).toBeGreaterThanOrEqual(4)
    expect(age).toBeLessThanOrEqual(5)
  })
})
