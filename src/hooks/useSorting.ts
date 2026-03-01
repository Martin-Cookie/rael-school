'use client'

import { useState, useCallback } from 'react'

type SortDir = 'asc' | 'desc'
type ValueExtractor = (item: any, col: string) => any

const defaultExtractor: ValueExtractor = (item, col) => {
  if (col.startsWith('_count.')) return item._count?.[col.replace('_count.', '')] ?? 0
  if (col.includes('.')) return col.split('.').reduce((o: any, k: string) => o?.[k], item)
  return item[col]
}

export function useSorting(valueExtractor?: ValueExtractor) {
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = useCallback((col: string) => {
    setSortCol(prev => {
      if (prev === col) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortDir('asc')
      return col
    })
  }, [])

  const sortData = useCallback(<T,>(data: T[], col?: string): T[] => {
    const c = col ?? sortCol
    if (!c) return data
    const extract = valueExtractor || defaultExtractor
    return [...data].sort((a: any, b: any) => {
      let va = extract(a, c)
      let vb = extract(b, c)
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc'
        ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase())
        : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }, [sortCol, sortDir, valueExtractor])

  return { sortCol, sortDir, handleSort, sortData, setSortCol }
}
