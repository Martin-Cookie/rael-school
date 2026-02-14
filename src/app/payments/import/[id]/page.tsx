'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Info } from 'lucide-react'
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
    setTimeout(() => setMessage(null), 3000)
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
        showMsg('success', t('app.savedSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch {
      showMsg('error', t('app.error'))
    }
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

  const filteredRows = importData.rows.filter(
    (r) => filter === 'ALL' || r.status === filter
  )

  const canEdit = (row: ImportRow) => !['APPROVED', 'REJECTED', 'DUPLICATE', 'SPLIT'].includes(row.status)

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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.status')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.date')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.sender')}</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.amount')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.variableSymbol')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.message')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.sponsor')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.student')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">{t('paymentImport.paymentType')}</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const rowStyle = ROW_STATUS_STYLES[row.status] || ROW_STATUS_STYLES.NEW
                const confStyle = CONFIDENCE_STYLES[row.matchConfidence] || CONFIDENCE_STYLES.NONE
                const editable = canEdit(row)

                return (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 group relative">
                    {/* Status */}
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${rowStyle.bg} ${rowStyle.text}`}>
                        {statusLabel(row.status)}
                      </span>
                      {row.matchConfidence !== 'NONE' && (
                        <span className={`inline-block ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${confStyle.bg} ${confStyle.text}`}>
                          {confidenceLabel(row.matchConfidence)}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(row.transactionDate, locale)}
                    </td>

                    {/* Sender */}
                    <td className="py-2.5 px-3 text-sm text-gray-700 max-w-[150px] truncate" title={row.senderName || ''}>
                      {row.senderName || '-'}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-sm text-gray-900 font-medium text-right whitespace-nowrap">
                      {formatNumber(row.amount)} {row.currency}
                    </td>

                    {/* VS */}
                    <td className="py-2.5 px-3 text-sm text-gray-500">
                      {row.variableSymbol || '-'}
                    </td>

                    {/* Message */}
                    <td className="py-2.5 px-3 text-sm text-gray-500 max-w-[180px] truncate" title={row.message || ''}>
                      {row.message || '-'}
                    </td>

                    {/* Sponsor dropdown */}
                    <td className="py-1.5 px-2">
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
                        <span className="text-sm text-gray-700">
                          {row.sponsor ? `${row.sponsor.lastName} ${row.sponsor.firstName}` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Student dropdown */}
                    <td className="py-1.5 px-2">
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
                        <span className="text-sm text-gray-700">
                          {row.student ? `${row.student.lastName} ${row.student.firstName}` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Payment type dropdown */}
                    <td className="py-1.5 px-2">
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
                        <span className="text-sm text-gray-700">
                          {paymentTypes.find((pt: any) => pt.id === row.paymentTypeId)?.name || '-'}
                        </span>
                      )}
                    </td>

                    {/* Info tooltip */}
                    <td className="py-2.5 px-2 relative">
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
                    </td>
                  </tr>
                )
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500 text-sm">
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
    </div>
  )
}
