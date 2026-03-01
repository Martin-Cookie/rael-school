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
  const [sort, setSort] = useState<{ col: string; dir: SortDir }>({ col: '', dir: 'asc' })

  const handleSort = useCallback((col: string) => {
    setSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const sortData = useCallback(<T,>(data: T[], col?: string): T[] => {
    const c = col ?? sort.col
    if (!c) return data
    const extract = valueExtractor || defaultExtractor
    return [...data].sort((a: any, b: any) => {
      let va = extract(a, c)
      let vb = extract(b, c)
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va
      return sort.dir === 'asc'
        ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase())
        : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }, [sort.col, sort.dir, valueExtractor])

  const setSortCol = useCallback((col: string) => {
    setSort(prev => ({ ...prev, col }))
  }, [])

  return { sortCol: sort.col, sortDir: sort.dir, handleSort, sortData, setSortCol }
}
