import Papa, { ParseResult } from 'papaparse'

export interface CsvRow {
  [key: string]: string | undefined
  datum: string
  castka: string
  mena: string
  vs?: string
  zprava?: string
  odesilatel?: string
  ucet_odesilatele?: string
}

export interface ParsedRow {
  transactionDate: Date
  amount: number
  currency: string
  variableSymbol: string | null
  senderName: string | null
  senderAccount: string | null
  message: string | null
  rawData: string
}

const REQUIRED_COLUMNS = ['datum', 'castka', 'mena']

export function parseCSV(csvText: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = []

  const result: ParseResult<CsvRow> = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  })

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      errors.push(`Řádek ${err.row !== undefined ? err.row + 2 : '?'}: ${err.message}`)
    }
  }

  // Validate required columns
  const headers = result.meta.fields || []
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push(`Chybí povinný sloupec: "${col}"`)
    }
  }

  if (errors.length > 0 && !result.data.length) {
    return { rows: [], errors }
  }

  const rows: ParsedRow[] = []

  for (let i = 0; i < result.data.length; i++) {
    const raw = result.data[i]
    const lineNum = i + 2 // header is line 1

    // Parse date
    const dateStr = raw.datum?.trim()
    if (!dateStr) {
      errors.push(`Řádek ${lineNum}: chybí datum`)
      continue
    }
    const date = parseDate(dateStr)
    if (!date) {
      errors.push(`Řádek ${lineNum}: neplatné datum "${dateStr}"`)
      continue
    }

    // Parse amount
    const amountStr = raw.castka?.trim()
    if (!amountStr) {
      errors.push(`Řádek ${lineNum}: chybí částka`)
      continue
    }
    const amount = parseAmount(amountStr)
    if (isNaN(amount) || amount === 0) {
      errors.push(`Řádek ${lineNum}: neplatná částka "${amountStr}"`)
      continue
    }

    // Currency
    const currency = (raw.mena?.trim() || 'CZK').toUpperCase()

    rows.push({
      transactionDate: date,
      amount,
      currency,
      variableSymbol: raw.vs?.trim() || null,
      senderName: raw.odesilatel?.trim() || null,
      senderAccount: raw.ucet_odesilatele?.trim() || null,
      message: raw.zprava?.trim() || null,
      rawData: JSON.stringify(raw),
    })
  }

  return { rows, errors }
}

function parseDate(str: string): Date | null {
  // Support: 2026-01-15, 15.1.2026, 15/1/2026
  let match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) {
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
    return isNaN(d.getTime()) ? null : d
  }

  match = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (match) {
    const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

function parseAmount(str: string): number {
  // Remove spaces (thousands separator) and handle Czech decimal comma
  const cleaned = str.replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned)
}
