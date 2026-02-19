'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { GraduationCap, FileText, Plus, Search, ChevronUp, ChevronDown, ArrowUpDown, Download, Check, X } from 'lucide-react'
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
}

export default function TuitionPage() {
  const [charges, setCharges] = useState<Charge[]>([])
  const [summary, setSummary] = useState({ totalCharged: 0, totalPaid: 0, totalRemaining: 0 })
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [userRole, setUserRole] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [search, setSearch] = useState('')

  // Generate form
  const [showGenerate, setShowGenerate] = useState(false)
  const [genPeriod, setGenPeriod] = useState(new Date().getFullYear().toString())
  const [generating, setGenerating] = useState(false)

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

  // Generate charges
  async function handleGenerate() {
    if (!genPeriod.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/tuition-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: genPeriod.trim() }),
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
    return name.toLowerCase().includes(q) || (c.student.className || '').toLowerCase().includes(q) || (c.notes || '').toLowerCase().includes(q)
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
    const headers = [t('student.studentNo'), t('student.lastName'), t('student.firstName'), t('tuition.class'), t('tuition.amount'), t('tuition.paidAmount'), t('tuition.remainingAmount'), t('tuition.status'), t('tuition.notes')]
    const rows = sorted.map(c => [
      c.student.studentNo,
      c.student.lastName,
      c.student.firstName,
      c.student.className || '',
      fmtCurrency(c.amount, c.currency),
      fmtCurrency(c.paidAmount, c.currency),
      fmtCurrency(c.remainingAmount, c.currency),
      c.status,
      c.notes || '',
    ])
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
              <button onClick={() => setShowGenerate(!showGenerate)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
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

      {/* Generate form */}
      {showGenerate && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('tuition.generateDesc')}</h3>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-400">{t('tuition.period')}:</label>
            <select
              value={genPeriod}
              onChange={(e) => setGenPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {generating ? t('app.loading') : t('tuition.generate')}
            </button>
            <button
              onClick={() => setShowGenerate(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('app.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalCharged')}</div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmtCurrency(summary.totalCharged, 'CZK')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalPaid')}</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{fmtCurrency(summary.totalPaid, 'CZK')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalRemaining')}</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">{fmtCurrency(summary.totalRemaining, 'CZK')}</div>
        </div>
      </div>

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
              <th className="py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('tuition.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
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
                <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{c.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
