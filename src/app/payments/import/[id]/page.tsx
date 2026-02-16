'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Info, CheckCircle2, XCircle, Scissors, X, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

interface ImportRow {
  id: string
  transactionDate: string
  amount: number
  currency: string
  variableSymbol: string | null
  senderName: string | null
  senderAccount: string | null
  message: string | null
  status: string
  sponsorId: string | null
  studentId: string | null
  paymentTypeId: string | null
  matchConfidence: string
  matchNotes: string | null
  duplicateOfId: string | null
  parentRowId: string | null
  sponsor: { id: string; firstName: string; lastName: string } | null
  student: { id: string; firstName: string; lastName: string; studentNo: string } | null
}

interface ImportDetail {
  id: string
  fileName: string
  fileType: string
  totalRows: number
  matchedRows: number
  status: string
  createdAt: string
  importedBy: { firstName: string; lastName: string }
  rows: ImportRow[]
}

interface Stats {
  total: number
  matched: number
  partial: number
  new: number
  duplicate: number
  approved: number
  rejected: number
  split: number
}

interface SplitPart {
  amount: string
  studentId: string
  paymentTypeId: string
  count: string
}

const ROW_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'bg-gray-100', text: 'text-gray-600' },
  MATCHED: { bg: 'bg-green-100', text: 'text-green-700' },
  PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  DUPLICATE: { bg: 'bg-orange-100', text: 'text-orange-700' },
  SPLIT: { bg: 'bg-purple-100', text: 'text-purple-700' },
}

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: 'bg-green-100', text: 'text-green-700' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  LOW: { bg: 'bg-orange-100', text: 'text-orange-700' },
  NONE: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

type StatusFilter = 'ALL' | 'NEW' | 'MATCHED' | 'PARTIAL' | 'DUPLICATE' | 'APPROVED' | 'REJECTED' | 'SPLIT'

export default function ImportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [importData, setImportData] = useState<ImportDetail | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Reference data for dropdowns
  const [sponsors, setSponsors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [paymentTypes, setPaymentTypes] = useState<any[]>([])

  // Tooltip
  const [tooltipRow, setTooltipRow] = useState<string | null>(null)

  // Selection for bulk actions
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Split modal
  const [splitRow, setSplitRow] = useState<ImportRow | null>(null)
  const [splitParts, setSplitParts] = useState<SplitPart[]>([])

  // Action loading
  const [actionLoading, setActionLoading] = useState(false)

  // Sorting
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetchImportDetail()
    fetchReferenceData()
  }, [id])

  async function fetchImportDetail() {
    try {
      const res = await fetch(`/api/payment-imports/${id}`)
      if (res.ok) {
        const data = await res.json()
        setImportData(data.import)
        setStats(data.stats)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  async function fetchReferenceData() {
    try {
      const [dashRes, ptRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/admin/payment-types'),
      ])
      if (dashRes.ok) {
        const d = await dashRes.json()
        setSponsors(d.sponsors || [])
        setStudents(d.students || [])
      }
      if (ptRes.ok) {
        const d = await ptRes.json()
        setPaymentTypes(d.paymentTypes || [])
      }
    } catch {
      // ignore
    }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  async function updateRow(rowId: string, field: string, value: string) {
    try {
      const res = await fetch(`/api/payment-imports/${id}/rows/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null }),
      })
      if (res.ok) {
        await fetchImportDetail()
      } else {
        showMsg('error', t('app.error'))
      }
    } catch {
      showMsg('error', t('app.error'))
    }
  }

  // === Bulk actions ===

  function toggleRow(rowId: string) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  function selectAllMatched() {
    if (!importData) return
    const matchedIds = importData.rows
      .filter(r => r.status === 'MATCHED')
      .map(r => r.id)
    setSelectedRows(new Set(matchedIds))
  }

  function toggleSelectAll() {
    if (!importData) return
    const selectable = filteredRows.filter(r => canSelect(r))
    if (selectedRows.size > 0 && selectable.every(r => selectedRows.has(r.id))) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(selectable.map(r => r.id)))
    }
  }

  async function approveSelected() {
    if (selectedRows.size === 0) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/payment-imports/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIds: Array.from(selectedRows) }),
      })
      if (res.ok) {
        const data = await res.json()
        showMsg('success', `${t('paymentImport.approveSuccess')} (${data.approved})`)
        setSelectedRows(new Set())
        await fetchImportDetail()
      } else {
        const err = await res.json()
        showMsg('error', err.error || t('app.error'))
      }
    } catch {
      showMsg('error', t('app.error'))
    }
    setActionLoading(false)
  }

  async function rejectSelected() {
    if (selectedRows.size === 0) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/payment-imports/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIds: Array.from(selectedRows) }),
      })
      if (res.ok) {
        const data = await res.json()
        showMsg('success', `${t('paymentImport.rejectSuccess')} (${data.rejected})`)
        setSelectedRows(new Set())
        await fetchImportDetail()
      } else {
        showMsg('error', t('app.error'))
      }
    } catch {
      showMsg('error', t('app.error'))
    }
    setActionLoading(false)
  }

  // === Split ===

  function openSplitModal(row: ImportRow) {
    setSplitRow(row)
    const half = Math.round(row.amount / 2 * 100) / 100
    setSplitParts([
      { amount: half.toString(), studentId: row.studentId || '', paymentTypeId: row.paymentTypeId || '', count: '' },
      { amount: (row.amount - half).toString(), studentId: row.studentId || '', paymentTypeId: row.paymentTypeId || '', count: '' },
    ])
  }

  const VOUCHER_PRICE = 80 // KES per voucher

  function isVoucherType(paymentTypeId: string): boolean {
    const pt = paymentTypes.find((p: any) => p.id === paymentTypeId)
    if (!pt) return false
    const name = pt.name.toLowerCase()
    return name.includes('stravenk') || name.includes('voucher')
  }

  function calcVoucherCount(amount: string): string {
    const num = parseFloat(amount)
    if (!num || num <= 0) return ''
    return Math.floor(num / VOUCHER_PRICE).toString()
  }

  function updateSplitPart(index: number, field: keyof SplitPart, value: string) {
    setSplitParts(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      // Auto-calculate count when switching to voucher type or changing amount
      if (field === 'paymentTypeId' && isVoucherType(value)) {
        next[index].count = calcVoucherCount(next[index].amount)
      } else if (field === 'amount' && isVoucherType(next[index].paymentTypeId)) {
        next[index].count = calcVoucherCount(value)
      }
      return next
    })
  }

  function addSplitPart() {
    if (splitParts.length >= 5) return
    setSplitParts(prev => [...prev, { amount: '0', studentId: splitRow?.studentId || '', paymentTypeId: splitRow?.paymentTypeId || '', count: '' }])
  }

  function removeSplitPart(index: number) {
    if (splitParts.length <= 2) return
    setSplitParts(prev => prev.filter((_, i) => i !== index))
  }

  async function submitSplit() {
    if (!splitRow) return
    setActionLoading(true)
    try {
      const parts = splitParts.map(p => ({
        amount: parseFloat(p.amount) || 0,
        studentId: p.studentId || undefined,
        paymentTypeId: p.paymentTypeId || undefined,
        count: p.count ? parseInt(p.count) : undefined,
      }))

      const res = await fetch(`/api/payment-imports/${id}/rows/${splitRow.id}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts }),
      })

      if (res.ok) {
        showMsg('success', t('paymentImport.splitSuccess'))
        setSplitRow(null)
        await fetchImportDetail()
      } else {
        const err = await res.json()
        showMsg('error', err.error || t('app.error'))
      }
    } catch {
      showMsg('error', t('app.error'))
    }
    setActionLoading(false)
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      NEW: t('paymentImport.statusNew'),
      MATCHED: t('paymentImport.statusMatched'),
      PARTIAL: t('paymentImport.statusPartial'),
      APPROVED: t('paymentImport.statusApproved'),
      REJECTED: t('paymentImport.statusRejected'),
      DUPLICATE: t('paymentImport.statusDuplicate'),
      SPLIT: t('paymentImport.statusSplit'),
    }
    return map[status] || status
  }

  function confidenceLabel(conf: string): string {
    const map: Record<string, string> = {
      HIGH: t('paymentImport.confidenceHigh'),
      MEDIUM: t('paymentImport.confidenceMedium'),
      LOW: t('paymentImport.confidenceLow'),
      NONE: t('paymentImport.confidenceNone'),
    }
    return map[conf] || conf
  }

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData(data: ImportRow[]): ImportRow[] {
    if (!sortCol) return data
    return [...data].sort((a: any, b: any) => {
      let va = a[sortCol]
      let vb = b[sortCol]
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return (
      <th className={`py-2.5 px-1.5 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none whitespace-nowrap ${className}`} onClick={() => handleSort(col)}>
        <div className="flex items-center gap-1">
          {children}
          {isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
        </div>
      </th>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!importData) {
    return (
      <div className="text-center py-16 text-gray-500">
        Import not found
      </div>
    )
  }

  const filteredRows = sortData(importData.rows.filter(
    (r) => filter === 'ALL' || r.status === filter
  ))

  const canEdit = (row: ImportRow) => !['APPROVED', 'REJECTED', 'DUPLICATE', 'SPLIT'].includes(row.status)
  const canSelect = (row: ImportRow) => !['APPROVED', 'REJECTED', 'SPLIT'].includes(row.status)

  // Filter buttons with counts
  const filterButtons: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: 'ALL', label: t('paymentImport.filterAll'), count: stats?.total || 0, color: 'bg-gray-100 text-gray-700' },
    { key: 'MATCHED', label: t('paymentImport.statusMatched'), count: stats?.matched || 0, color: 'bg-green-100 text-green-700' },
    { key: 'PARTIAL', label: t('paymentImport.statusPartial'), count: stats?.partial || 0, color: 'bg-yellow-100 text-yellow-700' },
    { key: 'NEW', label: t('paymentImport.statusNew'), count: stats?.new || 0, color: 'bg-gray-100 text-gray-600' },
    { key: 'DUPLICATE', label: t('paymentImport.statusDuplicate'), count: stats?.duplicate || 0, color: 'bg-orange-100 text-orange-700' },
    { key: 'APPROVED', label: t('paymentImport.statusApproved'), count: stats?.approved || 0, color: 'bg-blue-100 text-blue-700' },
    { key: 'REJECTED', label: t('paymentImport.statusRejected'), count: stats?.rejected || 0, color: 'bg-red-100 text-red-700' },
  ]

  // Split modal calculations
  const splitSum = splitParts.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const splitValid = splitRow ? Math.abs(splitSum - splitRow.amount) < 0.01 && splitParts.every(p => parseFloat(p.amount) > 0) : false

  return (
    <div>
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/payments/import" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('paymentImport.title')}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {importData.fileName}</span>
            <span>{formatDate(importData.createdAt, locale)}</span>
            <span>{importData.importedBy.firstName} {importData.importedBy.lastName}</span>
          </div>
        </div>
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {filterButtons.map((fb) => (
          <button
            key={fb.key}
            onClick={() => setFilter(fb.key)}
            className={`rounded-xl px-4 py-3 text-center transition-all border-2 ${
              filter === fb.key
                ? 'border-primary-500 shadow-sm'
                : 'border-transparent hover:border-gray-200'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{formatNumber(fb.count)}</p>
            <p className={`text-xs font-medium mt-0.5 ${fb.color.split(' ')[1]}`}>{fb.label}</p>
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={selectAllMatched}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {t('paymentImport.selectAllMatched')}
        </button>

        {selectedRows.size > 0 && (
          <>
            <span className="text-sm text-gray-500">
              {selectedRows.size} {t('paymentImport.selected')}
            </span>
            <button
              onClick={approveSelected}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('paymentImport.approveSelected')}
            </button>
            <button
              onClick={rejectSelected}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              {t('paymentImport.rejectSelected')}
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {t('app.cancel')}
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-2.5 px-1 w-8">
                  <input
                    type="checkbox"
                    checked={filteredRows.filter(r => canSelect(r)).length > 0 && filteredRows.filter(r => canSelect(r)).every(r => selectedRows.has(r.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <SH col="status" className="text-left">{t('paymentImport.status')}</SH>
                <SH col="transactionDate" className="text-left">{t('paymentImport.date')}</SH>
                <SH col="senderName" className="text-left">{t('paymentImport.sender')}</SH>
                <SH col="amount" className="text-right">{t('paymentImport.amount')}</SH>
                <SH col="variableSymbol" className="text-left">{t('paymentImport.variableSymbol')}</SH>
                <SH col="message" className="text-left">{t('paymentImport.message')}</SH>
                <th className="text-left py-2.5 px-1.5 text-xs font-medium text-gray-500 uppercase min-w-[160px]">{t('paymentImport.sponsor')}</th>
                <th className="text-left py-2.5 px-1.5 text-xs font-medium text-gray-500 uppercase min-w-[170px]">{t('paymentImport.student')}</th>
                <th className="text-left py-2.5 px-1.5 text-xs font-medium text-gray-500 uppercase min-w-[140px]">{t('paymentImport.paymentType')}</th>
                <th className="text-left py-2.5 px-1.5 text-xs font-medium text-gray-500 uppercase w-16">{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const rowStyle = ROW_STATUS_STYLES[row.status] || ROW_STATUS_STYLES.NEW
                const confStyle = CONFIDENCE_STYLES[row.matchConfidence] || CONFIDENCE_STYLES.NONE
                const editable = canEdit(row)
                const selectable = canSelect(row)

                return (
                  <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50/50 group ${selectedRows.has(row.id) ? 'bg-primary-50/50' : ''}`}>
                    {/* Checkbox */}
                    <td className="py-2.5 px-1">
                      {selectable && (
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${rowStyle.bg} ${rowStyle.text}`}>
                        {statusLabel(row.status)}
                      </span>
                      {row.matchConfidence !== 'NONE' && (
                        <div className="mt-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${confStyle.bg} ${confStyle.text}`}>
                            {confidenceLabel(row.matchConfidence)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-1.5 text-xs text-gray-900 whitespace-nowrap">
                      {formatDate(row.transactionDate, locale)}
                    </td>

                    {/* Sender */}
                    <td className="py-2 px-1.5 text-xs text-gray-700 max-w-[140px] truncate" title={row.senderName || ''}>
                      {row.senderName || '-'}
                    </td>

                    {/* Amount */}
                    <td className="py-2 px-1.5 text-xs text-gray-900 font-medium text-right whitespace-nowrap">
                      {formatNumber(row.amount)} {row.currency}
                    </td>

                    {/* VS */}
                    <td className="py-2 px-1.5 text-xs text-gray-500 whitespace-nowrap">
                      {row.variableSymbol || '-'}
                    </td>

                    {/* Message */}
                    <td className="py-2 px-1.5 text-xs text-gray-500" title={row.message || ''}>
                      <div className="line-clamp-2">{row.message || '-'}</div>
                    </td>

                    {/* Sponsor dropdown */}
                    <td className="py-1.5 px-1.5 min-w-[160px]">
                      {editable ? (
                        <select
                          value={row.sponsorId || ''}
                          onChange={(e) => updateRow(row.id, 'sponsorId', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 text-sm bg-white hover:border-gray-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
                        >
                          <option value="">{t('paymentImport.selectSponsor')}</option>
                          {sponsors.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700 whitespace-nowrap">
                          {row.sponsor ? `${row.sponsor.lastName} ${row.sponsor.firstName}` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Student dropdown */}
                    <td className="py-1.5 px-1.5 min-w-[170px]">
                      {editable ? (
                        <select
                          value={row.studentId || ''}
                          onChange={(e) => updateRow(row.id, 'studentId', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 text-sm bg-white hover:border-gray-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
                        >
                          <option value="">{t('paymentImport.selectStudent')}</option>
                          {students.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.studentNo})</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700 whitespace-nowrap">
                          {row.student ? `${row.student.lastName} ${row.student.firstName}` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Payment type dropdown */}
                    <td className="py-1.5 px-1.5 min-w-[140px]">
                      {editable ? (
                        <select
                          value={row.paymentTypeId || ''}
                          onChange={(e) => updateRow(row.id, 'paymentTypeId', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-200 text-sm bg-white hover:border-gray-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
                        >
                          <option value="">{t('paymentImport.selectPaymentType')}</option>
                          {paymentTypes.map((pt: any) => (
                            <option key={pt.id} value={pt.id}>{pt.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700 whitespace-nowrap">
                          {paymentTypes.find((pt: any) => pt.id === row.paymentTypeId)?.name || '-'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-1.5">
                      <div className="flex items-center gap-1">
                        {editable && (
                          <button
                            onClick={() => openSplitModal(row)}
                            className="p-1 text-gray-400 hover:text-purple-600 rounded"
                            title={t('paymentImport.split')}
                          >
                            <Scissors className="w-4 h-4" />
                          </button>
                        )}
                        {row.matchNotes && (
                          <div className="relative">
                            <button
                              onClick={() => setTooltipRow(tooltipRow === row.id ? null : row.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {tooltipRow === row.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setTooltipRow(null)} />
                                <div className="absolute right-0 top-8 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl w-72 whitespace-pre-wrap">
                                  {row.matchNotes}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500 text-sm">
                    {t('paymentImport.noRows')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Row count footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          {t('pagination.showing')} {formatNumber(filteredRows.length)} {t('pagination.of')} {formatNumber(importData.rows.length)}
        </div>
      </div>

      {/* Split modal */}
      {splitRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSplitRow(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{t('paymentImport.splitPayment')}</h3>
              <button onClick={() => setSplitRow(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original amount */}
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{t('paymentImport.splitOriginalAmount')}</span>
              <span className="text-lg font-bold text-gray-900">{formatNumber(splitRow.amount)} {splitRow.currency}</span>
            </div>

            {/* Parts */}
            <div className="space-y-3 mb-4">
              {splitParts.map((part, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-6">{i + 1}.</span>
                    <input
                      type="number"
                      value={part.amount}
                      onChange={(e) => updateSplitPart(i, 'amount', e.target.value)}
                      placeholder={t('paymentImport.amount')}
                      className="w-28 px-2 py-1.5 rounded border border-gray-300 text-sm"
                      step="0.01"
                    />
                    <span className="text-sm text-gray-400">{splitRow?.currency}</span>
                    <div className="flex-1" />
                    {splitParts.length > 2 && (
                      <button onClick={() => removeSplitPart(i)} className="p-1 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <select
                      value={part.studentId}
                      onChange={(e) => updateSplitPart(i, 'studentId', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm"
                    >
                      <option value="">{t('paymentImport.selectStudent')}</option>
                      {students.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>
                      ))}
                    </select>
                    <select
                      value={part.paymentTypeId}
                      onChange={(e) => updateSplitPart(i, 'paymentTypeId', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm"
                    >
                      <option value="">{t('paymentImport.selectPaymentType')}</option>
                      {paymentTypes.map((pt: any) => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                    {isVoucherType(part.paymentTypeId) && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={part.count}
                          onChange={(e) => updateSplitPart(i, 'count', e.target.value)}
                          placeholder={t('vouchers.count')}
                          className="w-20 px-2 py-1.5 rounded border border-gray-300 text-sm"
                          min="1"
                        />
                        <span className="text-xs text-gray-400">ks</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add part button */}
            {splitParts.length < 5 && (
              <button
                onClick={addSplitPart}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4"
              >
                + {t('app.add')}
              </button>
            )}

            {/* Sum validation */}
            <div className={`flex justify-between items-center p-3 rounded-lg mb-5 ${splitValid ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="text-sm text-gray-600">{t('paymentImport.splitRemaining')}</span>
              <span className={`text-sm font-bold ${splitValid ? 'text-green-700' : 'text-red-700'}`}>
                {formatNumber(Math.round((splitRow.amount - splitSum) * 100) / 100)} {splitRow.currency}
              </span>
            </div>

            {!splitValid && (
              <p className="text-xs text-red-600 mb-4">{t('paymentImport.splitSum')}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSplitRow(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={submitSplit}
                disabled={!splitValid || actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {t('paymentImport.split')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
