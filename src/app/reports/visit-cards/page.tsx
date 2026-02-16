'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Upload, Printer, CheckSquare, Square, AlertCircle, ChevronUp, ChevronDown, ArrowUpDown, Search, X } from 'lucide-react'
import Pagination from '@/components/Pagination'
import { formatNumber } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type SortDir = 'asc' | 'desc'

export default function VisitCardsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [classFilter, setClassFilter] = useState<string>('')
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [csvNotFound, setCsvNotFound] = useState<string[]>([])
  const [csvMatchCount, setCsvMatchCount] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const PAGE_SIZE = 12

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetch('/api/reports/visit-cards')
      .then(r => r.json())
      .then(data => {
        setStudents(data.students || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setCurrentPage(1)
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va = a[col], vb = b[col]
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  const classNames = [...new Set(students.map((s: any) => s.className).filter(Boolean))].sort() as string[]
  const classFiltered = classFilter ? students.filter(s => s.className === classFilter) : students
  const filtered = search.trim()
    ? classFiltered.filter(s => {
        const q = search.trim().toLowerCase()
        return (s.lastName?.toLowerCase().includes(q) || s.firstName?.toLowerCase().includes(q) || String(s.studentNo || '').includes(q))
      })
    : classFiltered
  const sorted = sortData(filtered, sortCol)
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const paginationLabels = { showing: t('pagination.showing'), of: t('pagination.of'), prev: t('pagination.prev'), next: t('pagination.next') }

  function toggleStudent(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(prev => {
      const next = new Set(prev)
      filtered.forEach(s => next.add(s.id))
      return next
    })
  }

  function deselectAll() {
    setSelected(new Set())
    setCsvNotFound([])
    setCsvMatchCount(null)
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) return

      const lines = text.split(/\r?\n/).filter(l => l.trim())
      const notFound: string[] = []
      const newSelected = new Set(selected)
      let matchCount = 0

      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const headerWords = ['prijmeni', 'prijmení', 'jmeno', 'jméno', 'lastname', 'last name', 'firstname', 'first name', 'name', 'student']

      for (const line of lines) {
        // Parse CSV line — handle "lastName,firstName" / "lastName;firstName" / "firstName lastName" in one cell
        const csvParts = line.split(/[,;]/).map(p => p.trim().replace(/^"|"$/g, ''))

        let nameParts: string[]
        if (csvParts.length >= 2 && csvParts[1].trim()) {
          // Two+ columns: lastName, firstName
          nameParts = [csvParts[0].trim(), csvParts[1].trim()]
        } else {
          // Single column: split by space(s)
          const words = csvParts[0].trim().split(/\s+/)
          if (words.length < 2) continue
          nameParts = words
        }

        // Skip header row
        if (nameParts.some(p => headerWords.includes(norm(p)))) continue

        // Build all possible (firstName, lastName) splits from nameParts
        // e.g. ["John","Michael","Doe"] → [("John","Michael Doe"), ("John Michael","Doe"), ("Michael Doe","John"), ("Doe","John Michael"), ...]
        const splits: [string, string][] = []
        const np = nameParts
        for (let i = 1; i < np.length; i++) {
          const a = np.slice(0, i).join(' ')
          const b = np.slice(i).join(' ')
          splits.push([a, b]) // a=first, b=last
          splits.push([b, a]) // b=first, a=last
        }

        const match = students.find(s => {
          const sLast = norm(s.lastName)
          const sFirst = norm(s.firstName)
          return splits.some(([f, l]) => norm(f) === sFirst && norm(l) === sLast)
        })

        if (match) {
          newSelected.add(match.id)
          matchCount++
        } else {
          notFound.push(nameParts.join(' '))
        }
      }

      setSelected(newSelected)
      setCsvNotFound(notFound)
      setCsvMatchCount(matchCount)
    }
    reader.readAsText(file)
    // Reset file input
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleGenerate() {
    if (selected.size === 0) return
    // Store selected IDs in sessionStorage for the print page (Etapa 3)
    sessionStorage.setItem('visitCardIds', JSON.stringify([...selected]))
    window.open('/reports/visit-cards/print', '_blank')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-sm text-primary-600 hover:text-primary-700 font-medium">← {t('nav.reports')}</Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('visitCards.title')}</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Class filter */}
        <select
          value={classFilter}
          onChange={e => { setClassFilter(e.target.value); setCurrentPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">{t('visitCards.allClasses')}</option>
          {classNames.map(cn => (
            <option key={cn} value={cn}>{cn}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            placeholder={t('app.search')}
            className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white w-48 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
          />
          {search && (
            <button onClick={() => { setSearch(''); setCurrentPage(1); searchRef.current?.focus() }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Select all / deselect */}
        <button onClick={selectAll} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          {t('visitCards.selectAll')}
        </button>
        <button onClick={deselectAll} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          {t('visitCards.deselectAll')}
        </button>

        {/* CSV upload */}
        <label className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {t('visitCards.uploadCsv')}
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
        </label>

        <div className="flex-1" />

        {/* Selected count */}
        <span className="text-sm text-gray-500">
          {t('visitCards.selectedCount')}: <span className="font-bold text-primary-600">{formatNumber(selected.size)}</span> / {formatNumber(filtered.length)}
        </span>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={selected.size === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          {t('visitCards.generateCards')} ({formatNumber(selected.size)})
        </button>
      </div>

      {/* CSV match result */}
      {csvMatchCount !== null && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            {t('visitCards.csvMatched')}: <span className="font-bold">{csvMatchCount}</span>
            {csvNotFound.length > 0 && <> | {t('visitCards.csvNotFound')}: <span className="font-bold text-red-600">{csvNotFound.length}</span></>}
          </p>
          {csvNotFound.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t('visitCards.csvNotFoundList')}:</p>
              <div className="flex flex-wrap gap-1">
                {csvNotFound.map((name, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(s => selected.has(s.id))}
                    onChange={e => e.target.checked ? selectAll() : deselectAll()}
                    className="rounded border-gray-300"
                  />
                </th>
                <SH col="studentNo" className="text-left">{t('student.studentNo')}</SH>
                <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
                <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
                <SH col="className" className="text-left">{t('student.className')}</SH>
                <SH col="school" className="text-left">{t('equipment.type')}</SH>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('needs.title')}</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.title')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s: any) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${selected.has(s.id) ? 'bg-primary-50' : ''}`}
                  onClick={() => toggleStudent(s.id)}
                >
                  <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-sm text-gray-500">{s.studentNo}</td>
                  <td className="py-2.5 px-3 text-sm font-medium text-gray-900">{s.lastName}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900">{s.firstName}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900">{s.className || '-'}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-600">{s.school || '-'}</td>
                  <td className="py-2.5 px-3 text-sm text-right">
                    {s.needs?.length > 0 ? <span className="badge badge-red">{s.needs.length}</span> : <span className="text-gray-400">0</span>}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-right">
                    {s.equipment?.length > 0 ? <span className="badge badge-green">{s.equipment.length}</span> : <span className="text-gray-400">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} labels={paginationLabels} />
    </div>
  )
}
