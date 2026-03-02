import { describe, it, expect } from 'vitest'
import { normalizeName, findStudentInMessage } from '@/lib/paymentMatcher'

describe('normalizeName', () => {
  it('removes diacritics', () => {
    expect(normalizeName('Příšerně žluťoučký')).toBe('priserne zlutoucky')
  })

  it('lowercases text', () => {
    expect(normalizeName('Jan NOVÁK')).toBe('jan novak')
  })

  it('removes academic titles', () => {
    expect(normalizeName('Ing. Jan Novák')).toBe('jan novak')
    expect(normalizeName('MUDr. Eva Svobodová')).toBe('eva svobodova')
    expect(normalizeName('Bc. Pavel Dvořák')).toBe('pavel dvorak')
    expect(normalizeName('Doc. PhDr. Karel Procházka')).toBe('karel prochazka')
  })

  it('removes dots and commas', () => {
    expect(normalizeName('Novák, Jan.')).toBe('novak jan')
  })

  it('normalizes whitespace', () => {
    expect(normalizeName('  Jan   Novák  ')).toBe('jan novak')
  })

  it('handles empty string', () => {
    expect(normalizeName('')).toBe('')
  })

  it('handles name with pan/pani prefix', () => {
    expect(normalizeName('pan Jan Novák')).toBe('jan novak')
    expect(normalizeName('paní Eva Nováková')).toBe('eva novakova')
  })
})

describe('findStudentInMessage', () => {
  const students = [
    { id: '1', firstName: 'Amina', lastName: 'Mwangi' },
    { id: '2', firstName: 'Brian', lastName: 'Ochieng' },
    { id: '3', firstName: 'Faith', lastName: 'Wanjiku' },
  ]

  it('finds student by full name in message', () => {
    const result = findStudentInMessage('Platba za Amina Mwangi', students)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('1')
  })

  it('finds student with different case', () => {
    const result = findStudentInMessage('platba za AMINA MWANGI', students)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('1')
  })

  it('finds student with names in any order', () => {
    const result = findStudentInMessage('Mwangi Amina skolne', students)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('1')
  })

  it('returns null when no student matches', () => {
    const result = findStudentInMessage('Platba za obědy', students)
    expect(result).toBeNull()
  })

  it('returns null for empty message', () => {
    const result = findStudentInMessage('', students)
    expect(result).toBeNull()
  })

  it('handles diacritics in message', () => {
    const studentsWithDiacritics = [
      { id: '4', firstName: 'Jiří', lastName: 'Dvořák' },
    ]
    const result = findStudentInMessage('Platba za Jiri Dvorak', studentsWithDiacritics)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('4')
  })

  it('matches short names via full phrase (>= 5 chars combined)', () => {
    const shortNameStudents = [
      { id: '5', firstName: 'Li', lastName: 'Wu' },
    ]
    // "li wu" = 5 chars, matches via phrase path
    const result = findStudentInMessage('Li Wu platba', shortNameStudents)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('5')
  })

  it('does not match very short full phrase (< 5 chars)', () => {
    const shortNameStudents = [
      { id: '6', firstName: 'Li', lastName: 'X' },
    ]
    // "li x" = 4 chars, too short for phrase match; individual names < 3 chars
    const result = findStudentInMessage('Li X platba', shortNameStudents)
    expect(result).toBeNull()
  })
})
