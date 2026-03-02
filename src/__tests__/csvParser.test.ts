import { describe, it, expect } from 'vitest'
import { parseCSV } from '@/lib/csvParser'

describe('parseCSV', () => {
  it('parses valid CSV with required columns', () => {
    const csv = `datum,castka,mena,vs,odesilatel,zprava
2026-01-15,1500,CZK,12345,Jan Novák,Školné`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(1)
    expect(rows[0].amount).toBe(1500)
    expect(rows[0].currency).toBe('CZK')
    expect(rows[0].variableSymbol).toBe('12345')
    expect(rows[0].senderName).toBe('Jan Novák')
    expect(rows[0].message).toBe('Školné')
  })

  it('handles Czech date format (DD.MM.YYYY)', () => {
    const csv = `datum,castka,mena
15.1.2026,500,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(1)
    expect(rows[0].transactionDate.getFullYear()).toBe(2026)
    expect(rows[0].transactionDate.getMonth()).toBe(0) // January
    expect(rows[0].transactionDate.getDate()).toBe(15)
  })

  it('handles slash date format (DD/MM/YYYY)', () => {
    const csv = `datum,castka,mena
15/1/2026,500,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(1)
    expect(rows[0].transactionDate.getDate()).toBe(15)
  })

  it('handles Czech decimal comma in amount', () => {
    const csv = `datum,castka,mena
2026-01-15,"1 500,50",CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows[0].amount).toBe(1500.50)
  })

  it('handles thousands separator (space) in amount', () => {
    const csv = `datum,castka,mena
2026-01-15,10 000,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows[0].amount).toBe(10000)
  })

  it('reports missing required columns', () => {
    const csv = `datum,castka
2026-01-15,500`
    const { errors } = parseCSV(csv)
    expect(errors.some(e => e.includes('mena'))).toBe(true)
  })

  it('reports invalid date', () => {
    const csv = `datum,castka,mena
not-a-date,500,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('neplatné datum')
    expect(rows).toHaveLength(0)
  })

  it('reports missing amount', () => {
    const csv = `datum,castka,mena
2026-01-15,,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('chybí částka')
    expect(rows).toHaveLength(0)
  })

  it('reports zero amount as invalid', () => {
    const csv = `datum,castka,mena
2026-01-15,0,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('neplatná částka')
  })

  it('handles empty optional fields', () => {
    const csv = `datum,castka,mena,vs,odesilatel,zprava
2026-01-15,500,CZK,,,`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows[0].variableSymbol).toBeNull()
    expect(rows[0].senderName).toBeNull()
    expect(rows[0].message).toBeNull()
  })

  it('parses multiple rows', () => {
    const csv = `datum,castka,mena
2026-01-15,500,CZK
2026-02-20,1000,EUR
2026-03-01,200,USD`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(3)
    expect(rows[0].currency).toBe('CZK')
    expect(rows[1].currency).toBe('EUR')
    expect(rows[2].currency).toBe('USD')
  })

  it('defaults currency to CZK if empty', () => {
    const csv = `datum,castka,mena
2026-01-15,500,`
    const { rows } = parseCSV(csv)
    expect(rows[0].currency).toBe('CZK')
  })

  it('stores rawData as JSON string', () => {
    const csv = `datum,castka,mena
2026-01-15,500,CZK`
    const { rows } = parseCSV(csv)
    const raw = JSON.parse(rows[0].rawData)
    expect(raw.datum).toBe('2026-01-15')
    expect(raw.castka).toBe('500')
  })

  it('handles case-insensitive headers', () => {
    const csv = `Datum,Castka,Mena
2026-01-15,500,CZK`
    const { rows, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(1)
  })
})
