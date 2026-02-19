'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { GraduationCap, FileText, Plus, Search, ChevronUp, ChevronDown, ArrowUpDown, Download, Check, X, CheckSquare, Square, Upload } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/format'
import { downloadCSV } from '@/lib/csv'

import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

function fmtCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}

type ChargePayment = {
  amount: number
  paymentType: string
  paymentDate: string
  sponsorId: string | null
  sponsor: { id: string; firstName: string; lastName: string } | null
}

type Charge = {
  id: string
  studentId: string
  period: string
  amount: number
  currency: string
  status: string
  notes: string | null
  student: { id: string; studentNo: string; firstName: string; lastName: string; className: string | null }
  paidAmount: number
  remainingAmount: number
  payments?: ChargePayment[]
}

export default function TuitionPage() {
  const [charges, setCharges] = useState<Charge[]>([])
  const [summary, setSummary] = useState({ totalCharged: 0, totalPaid: 0, totalRemaining: 0 })
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [userRole, setUserRole] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [search, setSearch] = useState('')

  // Generate form with student selection
  const [showGenerate, setShowGenerate] = useState(false)
  const [genPeriod, setGenPeriod] = useState(new Date().getFullYear().toString())
  const [generating, setGenerating] = useState(false)
  const [genStudents, setGenStudents] = useState<any[]>([])
  const [genSelected, setGenSelected] = useState<Set<string>>(new Set())
  const [genClassFilter, setGenClassFilter] = useState('')
  const [genSearch, setGenSearch] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  // Period filter
  const [filterPeriod, setFilterPeriod] = useState(new Date().getFullYear().toString())

  // Sorting
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const stickyRef = useRef<HTMLDivElement>(null)
  const [theadTop, setTheadTop] = useState(0)

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    const el = stickyRef.current
    if (!el) return
    function update() {
      const offset = window.innerWidth >= 1024 ? 0 : 64
      setTheadTop(offset + el!.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => { ro.disconnect(); window.removeEventListener('resize', update) }
  }, [loading])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUserRole(d.user?.role || '')).catch(() => {})
  }, [])

  useEffect(() => {
    fetchCharges()
  }, [filterPeriod])

  async function fetchCharges() {
    try {
      setLoading(true)
      const res = await fetch(`/api/tuition-charges?period=${filterPeriod}`)
      const data = await res.json()
      setCharges(data.charges || [])
      setSummary(data.summary || { totalCharged: 0, totalPaid: 0, totalRemaining: 0 })
    } catch { /* ignore */ }
    setLoading(false)
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const canEdit = userRole && ['ADMIN', 'MANAGER'].includes(userRole)

  // Open generate panel — fetch students
  async function openGenerate() {
    if (showGenerate) { setShowGenerate(false); return }
    setShowGenerate(true)
    setGenLoading(true)
    setGenSelected(new Set())
    setGenClassFilter('')
    setGenSearch('')
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setGenStudents(data.students || data || [])
    } catch { setGenStudents([]) }
    setGenLoading(false)
  }

  // Generate student list helpers
  const genClassNames = [...new Set(genStudents.map((s: any) => s.className).filter(Boolean))].sort() as string[]
  const genClassFiltered = genClassFilter ? genStudents.filter((s: any) => s.className === genClassFilter) : genStudents
  const genQ = genSearch.trim().toLowerCase()
  const genFiltered = genQ
    ? genClassFiltered.filter((s: any) => {
        return (s.lastName?.toLowerCase().includes(genQ) || s.firstName?.toLowerCase().includes(genQ) || String(s.studentNo || '').includes(genQ))
      })
    : genClassFiltered

  function genToggle(id: string) {
    setGenSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function genSelectAll() {
    setGenSelected(prev => {
      const next = new Set(prev)
      genFiltered.forEach((s: any) => next.add(s.id))
      return next
    })
  }

  function genDeselectAll() {
    setGenSelected(new Set())
  }

  // Generate charges
  async function handleGenerate() {
    if (!genPeriod.trim() || genSelected.size === 0) return
    setGenerating(true)
    try {
      const res = await fetch('/api/tuition-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: genPeriod.trim(), studentIds: [...genSelected] }),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('success', `${t('tuition.generate')}: ${data.created} ${t('tuition.charges').toLowerCase()}`)
        setShowGenerate(false)
        setFilterPeriod(genPeriod.trim())
        await fetchCharges()
      } else {
        showMsg('error', data.error || t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
    setGenerating(false)
  }

  // Sorting
  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData(data: Charge[]): Charge[] {
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      let va: any, vb: any
      if (sortCol === '_studentName') {
        va = `${a.student.lastName} ${a.student.firstName}`
        vb = `${b.student.lastName} ${b.student.firstName}`
      } else if (sortCol === '_className') {
        va = a.student.className || ''
        vb = b.student.className || ''
      } else if (sortCol === 'paidAmount' || sortCol === 'remainingAmount' || sortCol === 'amount') {
        va = (a as any)[sortCol]; vb = (b as any)[sortCol]
      } else {
        va = (a as any)[sortCol]; vb = (b as any)[sortCol]
      }
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  // Search
  const q = search.toLowerCase()
  const filtered = q ? charges.filter(c => {
    const name = `${c.student.firstName} ${c.student.lastName} ${c.student.studentNo}`
    const sponsorNames = c.payments?.map(p => p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : '').join(' ') || ''
    return name.toLowerCase().includes(q) || (c.student.className || '').toLowerCase().includes(q) || (c.notes || '').toLowerCase().includes(q) || sponsorNames.toLowerCase().includes(q)
  }) : charges
  const sorted = sortData(filtered)

  // Status color
  function statusBadge(status: string) {
    switch (status) {
      case 'PAID': return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t('tuition.statusPaid')}</span>
      case 'PARTIAL': return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{t('tuition.statusPartial')}</span>
      default: return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('tuition.statusUnpaid')}</span>
    }
  }

  // CSV export
  function exportCharges() {
    const headers = [t('student.studentNo'), t('student.lastName'), t('student.firstName'), t('tuition.class'), t('tuition.amount'), t('tuition.paidAmount'), t('tuition.remainingAmount'), t('tuition.status'), t('paymentImport.sponsor'), t('paymentImport.paymentType'), t('tuition.notes')]
    const rows = sorted.map(c => {
      const sponsors = c.payments?.reduce((acc: { id: string; firstName: string; lastName: string }[], p) => {
        if (p.sponsor && !acc.some(s => s.id === p.sponsor!.id)) acc.push(p.sponsor)
        return acc
      }, []) || []
      const paymentTypesArr = [...new Set(c.payments?.map(p => p.paymentType).filter(Boolean) || [])]
      return [
        c.student.studentNo,
        c.student.lastName,
        c.student.firstName,
        c.student.className || '',
        fmtCurrency(c.amount, c.currency),
        fmtCurrency(c.paidAmount, c.currency),
        fmtCurrency(c.remainingAmount, c.currency),
        c.status,
        sponsors.map(s => `${s.lastName} ${s.firstName}`).join('; '),
        paymentTypesArr.join('; '),
        c.notes || '',
      ]
    })
    downloadCSV(`tuition-${filterPeriod}.csv`, headers, rows)
  }

  // Year options for dropdown
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Sticky header */}
      <div ref={stickyRef} className="sticky top-16 lg:top-0 z-30 bg-[#fafaf8] dark:bg-gray-900 pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 pt-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('tuition.title')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={exportCharges} className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> {t('app.exportCSV')}
            </button>
            {canEdit && (
              <button onClick={openGenerate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                <Plus className="w-4 h-4" /> {t('tuition.generate')}
              </button>
            )}
          </div>
        </div>

        {/* Period filter + search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('tuition.period')}:</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('app.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Generate panel with student selection */}
      {showGenerate && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('tuition.generateDesc')}</h3>
            <div className="flex flex-wrap items-center gap-3">
              {/* Period */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">{t('tuition.period')}:</label>
                <select
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Class filter */}
              <select
                value={genClassFilter}
                onChange={e => setGenClassFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('visitCards.allClasses')}</option>
                {genClassNames.map(cn => (
                  <option key={cn} value={cn}>{cn}</option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={genSearch}
                  onChange={e => setGenSearch(e.target.value)}
                  placeholder={t('app.search')}
                  className="pl-8 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 w-48 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                />
                {genSearch && (
                  <button onClick={() => setGenSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Select/Deselect */}
              <button onClick={genSelectAll} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                {t('visitCards.selectAll')}
              </button>
              <button onClick={genDeselectAll} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                {t('visitCards.deselectAll')}
              </button>

              <div className="flex-1" />

              {/* Selected count */}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('visitCards.selectedCount')}: <span className="font-bold text-primary-600 dark:text-primary-400">{formatNumber(genSelected.size)}</span> / {formatNumber(genFiltered.length)}
              </span>
            </div>
          </div>

          {/* Student list */}
          <div className="max-h-[400px] overflow-y-auto">
            {genLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <th className="py-2 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={genFiltered.length > 0 && genFiltered.every((s: any) => genSelected.has(s.id))}
                        onChange={e => e.target.checked ? genSelectAll() : genDeselectAll()}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-left">{t('student.studentNo')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-left">{t('student.lastName')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-left">{t('student.firstName')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-left">{t('tuition.class')}</th>
                  </tr>
                </thead>
                <tbody>
                  {genFiltered.map((s: any) => (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${genSelected.has(s.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                      onClick={() => genToggle(s.id)}
                    >
                      <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={genSelected.has(s.id)}
                          onChange={() => genToggle(s.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">{s.studentNo}</td>
                      <td className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-gray-100">{s.lastName}</td>
                      <td className="py-2 px-3 text-sm text-gray-900 dark:text-gray-100">{s.firstName}</td>
                      <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300">{s.className || '-'}</td>
                    </tr>
                  ))}
                  {genFiltered.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-sm">{t('tuition.noStudents')}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Generate + Cancel buttons */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowGenerate(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('app.cancel')}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || genSelected.size === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {generating ? t('app.loading') : `${t('tuition.generate')} (${formatNumber(genSelected.size)})`}
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {(() => {
        const totalCount = charges.length
        const paidCount = charges.filter(c => c.status === 'PAID').length
        const annualCount = charges.filter(c => !c.period.includes('-')).length
        const semiAnnualCount = charges.filter(c => c.period.includes('-')).length
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalCharged')}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmtCurrency(summary.totalCharged, 'CZK')}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatNumber(totalCount)} {t('tuition.chargesCount')}
                {annualCount > 0 && <span> · {formatNumber(annualCount)} {t('tuition.annual')}</span>}
                {semiAnnualCount > 0 && <span> · {formatNumber(semiAnnualCount)} {t('tuition.semiAnnual')}</span>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalPaid')}</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{fmtCurrency(summary.totalPaid, 'CZK')}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatNumber(paidCount)} {t('tuition.paidChargesCount')} / {formatNumber(totalCount)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalRemaining')}</div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{fmtCurrency(summary.totalRemaining, 'CZK')}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatNumber(totalCount - paidCount)} {t('tuition.chargesCount')}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {filtered.length} {t('tuition.charges').toLowerCase()}
        {q && filtered.length !== charges.length && ` / ${charges.length}`}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('tuition.noCharges')}</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
              <SH col="_studentName">{t('tuition.student')}</SH>
              <SH col="_className">{t('tuition.class')}</SH>
              <SH col="amount">{t('tuition.amount')}</SH>
              <SH col="paidAmount">{t('tuition.paidAmount')}</SH>
              <SH col="remainingAmount">{t('tuition.remainingAmount')}</SH>
              <SH col="status">{t('tuition.status')}</SH>
              <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('paymentImport.sponsor')}</th>
              <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('paymentImport.paymentType')}</th>
              <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('tuition.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => {
              // Unique sponsors from payments
              const sponsors = c.payments?.reduce((acc: { id: string; firstName: string; lastName: string }[], p) => {
                if (p.sponsor && !acc.some(s => s.id === p.sponsor!.id)) acc.push(p.sponsor)
                return acc
              }, []) || []
              // Unique payment types
              const paymentTypesArr = [...new Set(c.payments?.map(p => p.paymentType).filter(Boolean) || [])]
              return (
                <tr key={c.id} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 px-3 text-sm">
                    <Link href={`/students/${c.student.id}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                      {c.student.lastName} {c.student.firstName}
                    </Link>
                    <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">#{c.student.studentNo}</span>
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300">{c.student.className || '-'}</td>
                  <td className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-gray-100">{fmtCurrency(c.amount, c.currency)}</td>
                  <td className="py-2 px-3 text-sm text-green-600 dark:text-green-400 font-medium">{fmtCurrency(c.paidAmount, c.currency)}</td>
                  <td className="py-2 px-3 text-sm text-red-600 dark:text-red-400 font-medium">{c.remainingAmount > 0 ? fmtCurrency(c.remainingAmount, c.currency) : '-'}</td>
                  <td className="py-2 px-3">{statusBadge(c.status)}</td>
                  <td className="py-2 px-3 text-sm">
                    {sponsors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {sponsors.map(s => (
                          <Link key={s.id} href={`/sponsors?search=${encodeURIComponent(s.lastName)}`} className="text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap">
                            {s.lastName} {s.firstName}
                          </Link>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300">
                    {paymentTypesArr.length > 0 ? paymentTypesArr.join(', ') : '-'}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{c.notes || ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
