'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Check, X, Upload, Search, Download } from 'lucide-react'
import { formatNumber, formatDate, formatDateForInput, fmtCurrency } from '@/lib/format'
import { downloadCSV } from '@/lib/csv'
import { useLocale } from '@/hooks/useLocale'
import { useSorting } from '@/hooks/useSorting'
import { useStickyTop } from '@/hooks/useStickyTop'
import { useToast } from '@/hooks/useToast'
import { SortHeader } from '@/components/SortHeader'
import { Toast } from '@/components/Toast'
import { getLocaleName } from '@/lib/i18n'
import { CURRENCIES } from '@/lib/constants'

type UnifiedPayment = {
  id: string
  _type: 'sponsor' | 'voucher'
  _date: string
  amount: number
  currency: string
  paymentType: string
  count?: number
  student?: any
  studentId?: string
  sponsor?: any
  sponsorId?: string
  donorName?: string
  notes?: string
  [key: string]: any
}

export default function PaymentsPage() {
  const [sponsorPayments, setSponsorPayments] = useState<any[]>([])
  const [voucherPurchases, setVoucherPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Students & sponsors for dropdowns
  const [students, setStudents] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [paymentTypes, setPaymentTypes] = useState<any[]>([])
  const [userRole, setUserRole] = useState('')

  // Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPayment, setNewPayment] = useState({ studentId: '', sponsorId: '', date: '', amount: '', currency: 'CZK', paymentType: '', count: '', notes: '' })
  const [voucherRates, setVoucherRates] = useState<{ currency: string; rate: number }[]>([])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<'sponsor' | 'voucher'>('sponsor')
  const [editData, setEditData] = useState<any>({})

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterSponsor, setFilterSponsor] = useState('')

  const { locale, t } = useLocale()
  const { message, showMsg } = useToast()
  const { sortCol, sortDir, handleSort, sortData } = useSorting((item: any, col: string) => {
    if (col === '_studentName') return item.student ? `${item.student.lastName} ${item.student.firstName}` : ''
    if (col === '_sponsorName') return item.sponsor ? `${item.sponsor.lastName} ${item.sponsor.firstName}` : (item.donorName || '')
    if (col === '_type') return item._type
    return item[col]
  })
  const { stickyRef, theadTop } = useStickyTop([loading])

  useEffect(() => {
    fetchData()
    fetch('/api/auth/me').then(r => r.json()).then(d => setUserRole(d.user?.role || '')).catch(() => {})
    fetch('/api/admin/payment-types').then(r => r.json()).then(d => setPaymentTypes(d.paymentTypes || [])).catch(() => {})
    fetch('/api/voucher-rates').then(r => r.json()).then(d => setVoucherRates(d.voucherRates || [])).catch(() => {})
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setSponsorPayments(data.sponsorPayments || [])
      setVoucherPurchases(data.voucherPurchases || [])
      setStudents(data.students || [])
      setSponsors(data.sponsors || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  const canEdit = userRole && ['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(userRole)

  function getStudentSponsors(studentId: string) {
    if (!studentId) return sponsors
    return sponsors.filter((sp: any) =>
      sp.sponsorships?.some((s: any) => s.student?.id === studentId)
    )
  }

  function getVoucherRate(currency: string): number | null {
    const vr = voucherRates.find(r => r.currency === currency)
    return vr ? vr.rate : null
  }

  function autoVoucherCount(amount: string, currency: string): string {
    const rate = getVoucherRate(currency)
    if (!rate || !amount) return ''
    const num = parseFloat(amount)
    return num > 0 ? String(Math.floor(num / rate)) : ''
  }

  // Is the selected payment type a voucher type?
  function isVoucherType(typeName: string): boolean {
    return /stravenk|voucher/i.test(typeName)
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    return <SortHeader col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className={className}>{children}</SortHeader>
  }

  // ===== UNIFIED CRUD =====
  async function addPayment() {
    const isVoucher = isVoucherType(newPayment.paymentType)
    if (!newPayment.studentId || !newPayment.date || !newPayment.amount || !newPayment.paymentType) {
      showMsg('error', t('payments.fillRequired'))
      return
    }
    if (isVoucher && !newPayment.count) {
      showMsg('error', t('payments.fillRequired'))
      return
    }
    try {
      let res
      if (isVoucher) {
        res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'voucher',
            studentId: newPayment.studentId,
            sponsorId: newPayment.sponsorId,
            purchaseDate: newPayment.date,
            amount: newPayment.amount,
            currency: newPayment.currency,
            count: newPayment.count,
            notes: newPayment.notes,
          }),
        })
      } else {
        res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sponsor',
            studentId: newPayment.studentId,
            sponsorId: newPayment.sponsorId,
            paymentDate: newPayment.date,
            amount: newPayment.amount,
            currency: newPayment.currency,
            paymentType: newPayment.paymentType,
            notes: newPayment.notes,
          }),
        })
      }
      if (res.ok) {
        setNewPayment({ studentId: '', sponsorId: '', date: '', amount: '', currency: 'CZK', paymentType: '', count: '', notes: '' })
        setShowAddForm(false)
        await fetchData()
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error || t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function saveEdit(id: string) {
    try {
      let body: any
      if (editType === 'voucher') {
        body = { type: 'voucher', id, studentId: editData.studentId, sponsorId: editData.sponsorId, purchaseDate: editData.date, amount: editData.amount, currency: editData.currency, count: editData.count, notes: editData.notes }
      } else {
        body = { type: 'sponsor', id, studentId: editData.studentId, sponsorId: editData.sponsorId, paymentDate: editData.date, amount: editData.amount, currency: editData.currency, paymentType: editData.paymentType, notes: editData.notes }
      }
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setEditingId(null)
        await fetchData()
        showMsg('success', t('app.savedSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function deletePayment(id: string, type: 'sponsor' | 'voucher') {
    if (!confirm(t('app.confirmDelete'))) return
    try {
      const res = await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })
      if (res.ok) {
        await fetchData()
        showMsg('success', t('app.deleteSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  function startEdit(item: UnifiedPayment) {
    setEditingId(item.id)
    setEditType(item._type)
    if (item._type === 'sponsor') {
      setEditData({
        studentId: item.studentId || item.student?.id || '',
        sponsorId: item.sponsorId || item.sponsor?.id || '',
        date: formatDateForInput(item._date),
        amount: item.amount.toString(),
        currency: item.currency || 'KES',
        paymentType: item.paymentType || '',
        notes: item.notes || '',
      })
    } else {
      setEditData({
        studentId: item.studentId || item.student?.id || '',
        sponsorId: item.sponsorId || item.sponsor?.id || '',
        date: formatDateForInput(item._date),
        amount: item.amount.toString(),
        currency: item.currency || 'KES',
        count: (item.count || 0).toString(),
        notes: item.notes || '',
      })
    }
  }

  // ===== MERGE DATA =====
  const allPayments: UnifiedPayment[] = useMemo(() => {
    const sp = sponsorPayments.map((p: any) => ({
      ...p,
      _type: 'sponsor' as const,
      _date: p.paymentDate,
    }))
    const vp = voucherPurchases.map((v: any) => ({
      ...v,
      _type: 'voucher' as const,
      _date: v.purchaseDate,
      paymentType: '__voucher',
    }))
    return [...sp, ...vp]
  }, [sponsorPayments, voucherPurchases])

  // Unique sponsors for filter dropdown
  const uniqueSponsors = useMemo(() => {
    const map = new Map<string, string>()
    allPayments.forEach(p => {
      if (p.sponsor) {
        map.set(p.sponsor.id, `${p.sponsor.lastName} ${p.sponsor.firstName}`)
      } else if (p.donorName) {
        map.set(`_donor_${p.donorName}`, p.donorName)
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [allPayments])

  // Unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    const set = new Set<string>()
    allPayments.forEach(p => { if (p.paymentType) set.add(p.paymentType) })
    return Array.from(set).sort()
  }, [allPayments])

  function getTypeName(typeName: string): string {
    if (typeName === '__voucher') return t('vouchers.title')
    const pt = paymentTypes.find((t: any) => t.name === typeName)
    return pt ? getLocaleName(pt, locale) : typeName
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  // ===== FILTER + SEARCH =====
  const q = search.toLowerCase()
  const filtered = allPayments.filter((p) => {
    // Type filter
    if (filterType && p.paymentType !== filterType) return false
    // Sponsor filter
    if (filterSponsor) {
      const sponsorKey = p.sponsor ? p.sponsor.id : (p.donorName ? `_donor_${p.donorName}` : '')
      if (sponsorKey !== filterSponsor) return false
    }
    // Text search
    if (q) {
      const studentName = p.student ? `${p.student.firstName} ${p.student.lastName}` : ''
      const sponsorName = p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : (p.donorName || '')
      const typeName = getTypeName(p.paymentType)
      return studentName.toLowerCase().includes(q) || sponsorName.toLowerCase().includes(q) || typeName.toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q) || String(p.amount).includes(q) || (p.currency || '').toLowerCase().includes(q)
    }
    return true
  })
  const sorted = sortData(filtered, sortCol)
  const hasActiveFilters = !!filterType || !!filterSponsor || !!q

  function exportPayments() {
    const headers = [t('payments.paymentDate'), t('sponsorPayments.paymentType'), t('payments.amount'), t('vouchers.count'), t('nav.students'), t('sponsors.title'), t('payments.notes')]
    const rows = sorted.map((p) => [
      formatDate(p._date, locale),
      getTypeName(p.paymentType),
      `${formatNumber(p.amount)} ${p.currency || 'KES'}`,
      p._type === 'voucher' ? String(p.count || 0) : '',
      p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
      p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : (p.donorName || ''),
      p.notes || '',
    ])
    downloadCSV('payments.csv', headers, rows)
  }

  return (
    <div>
      <Toast message={message} />

      {/* Sticky header */}
      <div ref={stickyRef} className="sticky top-16 lg:top-0 z-30 bg-[#fafaf8] dark:bg-gray-900 pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 pt-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('payments.title')} <span className="text-base font-normal text-gray-500 dark:text-gray-400">({filtered.length}{hasActiveFilters && filtered.length !== allPayments.length ? `/${allPayments.length}` : ''})</span></h1>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                <Plus className="w-4 h-4" /> {t('payments.addPayment')}
              </button>
            )}
            <button onClick={exportPayments} className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> {t('app.exportCSV')}
            </button>
            {canEdit && (
              <Link href="/payments/import" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                <Upload className="w-4 h-4" /> {t('payments.importPayments')}
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('app.search')} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <select value={newPayment.studentId} onChange={(e) => {
              const sid = e.target.value
              const matched = getStudentSponsors(sid)
              setNewPayment(prev => ({ ...prev, studentId: sid, sponsorId: matched.length === 1 ? matched[0].id : '' }))
            }} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm">
              <option value="">{t('nav.students')} *</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.studentNo})</option>)}
            </select>
            <select value={newPayment.sponsorId} onChange={(e) => setNewPayment(prev => ({ ...prev, sponsorId: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm">
              <option value="">{t('sponsors.title')}</option>
              {(newPayment.studentId ? getStudentSponsors(newPayment.studentId) : sponsors).map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
            </select>
            <input type="date" value={newPayment.date} onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm" />
            <div className="flex gap-2">
              <input type="number" value={newPayment.amount} onChange={(e) => {
                const amt = e.target.value
                setNewPayment(prev => ({ ...prev, amount: amt, count: isVoucherType(prev.paymentType) ? autoVoucherCount(amt, prev.currency) : '' }))
              }} placeholder={t('payments.amount') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm flex-1" />
              <select value={newPayment.currency} onChange={(e) => {
                const cur = e.target.value
                setNewPayment(prev => ({ ...prev, currency: cur, count: isVoucherType(prev.paymentType) ? autoVoucherCount(prev.amount, cur) : '' }))
              }} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-24">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <select value={newPayment.paymentType} onChange={(e) => {
              const pt = e.target.value
              setNewPayment(prev => ({
                ...prev,
                paymentType: pt,
                count: isVoucherType(pt) ? autoVoucherCount(prev.amount, prev.currency) : '',
              }))
            }} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm">
              <option value="">{t('sponsorPayments.selectType')} *</option>
              {paymentTypes.length > 0
                ? paymentTypes.map((pt: any) => <option key={pt.id} value={pt.name}>{getLocaleName(pt, locale)}</option>)
                : <>
                    <option value="tuition">{t('sponsorPayments.tuition')}</option>
                    <option value="medical">{t('sponsorPayments.medical')}</option>
                    <option value="other">{t('sponsorPayments.other')}</option>
                  </>
              }
            </select>
            {/* Voucher count - visible only when voucher type selected */}
            {isVoucherType(newPayment.paymentType) && (
              <input type="number" value={newPayment.count} onChange={(e) => setNewPayment(prev => ({ ...prev, count: e.target.value }))} placeholder={(() => { const rate = getVoucherRate(newPayment.currency); return rate ? `${t('vouchers.count')} (1 = ${formatNumber(rate)} ${newPayment.currency})` : t('vouchers.count') + ' *' })()} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm" />
            )}
            <input type="text" value={newPayment.notes} onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))} placeholder={t('payments.notes')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm sm:col-span-2 lg:col-span-3" />
          </div>
          <div className="flex gap-2">
            <button onClick={addPayment} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
            <button onClick={() => { setShowAddForm(false); setNewPayment({ studentId: '', sponsorId: '', date: '', amount: '', currency: 'CZK', paymentType: '', count: '', notes: '' }) }} className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">{t('app.cancel')}</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <table className="w-full"><thead>
          {/* Sort headers */}
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
            <SH col="_date" className="text-left">{t('payments.paymentDate')}</SH>
            <SH col="paymentType" className="text-left">{t('sponsorPayments.paymentType')}</SH>
            <SH col="amount" className="text-left">{t('payments.amount')}</SH>
            <SH col="count" className="text-left">{t('vouchers.count')}</SH>
            <SH col="_studentName" className="text-left">{t('nav.students')}</SH>
            <SH col="_sponsorName" className="text-left">{t('sponsors.title')}</SH>
            <SH col="notes" className="text-left">{t('payments.notes')}</SH>
            {canEdit && <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('app.actions')}</th>}
          </tr>
          {/* Filter row */}
          <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xs">
                <option value="">{t('paymentImport.filterAll')}</option>
                {uniqueTypes.map(typeName => (
                  <option key={typeName} value={typeName}>{getTypeName(typeName)}</option>
                ))}
              </select>
            </td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3">
              <select value={filterSponsor} onChange={(e) => setFilterSponsor(e.target.value)} className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xs">
                <option value="">{t('paymentImport.filterAll')}</option>
                {uniqueSponsors.map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </td>
            <td className="py-1.5 px-3"></td>
            {canEdit && <td className="py-1.5 px-3">
              {(filterType || filterSponsor) && (
                <button onClick={() => { setFilterType(''); setFilterSponsor('') }} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </td>}
          </tr>
        </thead><tbody>
          {sorted.map((p) => (
            editingId === p.id ? (
              <tr key={`${p._type}-${p.id}`} className="border-b border-gray-50 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/20">
                <td className="py-2 px-3"><input type="date" value={editData.date || ''} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-full" /></td>
                <td className="py-2 px-3">
                  {editType === 'sponsor' ? (
                    <select value={editData.paymentType || ''} onChange={(e) => setEditData({ ...editData, paymentType: e.target.value })} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-full">
                      {paymentTypes.length > 0
                        ? paymentTypes.map((pt: any) => <option key={pt.id} value={pt.name}>{getLocaleName(pt, locale)}</option>)
                        : <>
                            <option value="tuition">{t('sponsorPayments.tuition')}</option>
                            <option value="medical">{t('sponsorPayments.medical')}</option>
                            <option value="other">{t('sponsorPayments.other')}</option>
                          </>
                      }
                    </select>
                  ) : (
                    <span className="badge badge-blue text-xs">{t('vouchers.title')}</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-1">
                    <input type="number" value={editData.amount || ''} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-20" />
                    <select value={editData.currency || 'KES'} onChange={(e) => setEditData({ ...editData, currency: e.target.value })} className="px-1 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-16">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </td>
                <td className="py-2 px-3">
                  {editType === 'voucher' ? (
                    <input type="number" value={editData.count || ''} onChange={(e) => setEditData({ ...editData, count: e.target.value })} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-16" />
                  ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                </td>
                <td className="py-2 px-3">
                  <select value={editData.studentId || ''} onChange={(e) => {
                    const sid = e.target.value
                    const matched = getStudentSponsors(sid)
                    setEditData({ ...editData, studentId: sid, sponsorId: matched.length === 1 ? matched[0].id : '' })
                  }} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-full">
                    <option value="">—</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                  </select>
                </td>
                <td className="py-2 px-3">
                  <select value={editData.sponsorId || ''} onChange={(e) => setEditData({ ...editData, sponsorId: e.target.value })} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-full">
                    <option value="">—</option>
                    {(editData.studentId ? getStudentSponsors(editData.studentId) : sponsors).map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                  </select>
                </td>
                <td className="py-2 px-3"><input type="text" value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm w-full" /></td>
                <td className="py-2 px-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => saveEdit(p.id)} className="p-1.5 text-primary-600 hover:text-primary-800"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={`${p._type}-${p.id}`} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(p._date, locale)}</td>
                <td className="py-3 px-3 text-sm">
                  {p._type === 'voucher' ? (
                    <span className="badge badge-blue">{t('vouchers.title')}</span>
                  ) : (
                    <span className={`badge ${p.paymentType === 'tuition' ? 'badge-green' : p.paymentType === 'medical' ? 'badge-yellow' : 'badge-red'}`}>{getTypeName(p.paymentType)}</span>
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{fmtCurrency(p.amount, p.currency || 'KES')}</td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{p._type === 'voucher' ? formatNumber(p.count || 0) : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                <td className="py-3 px-3 text-sm">{p.student ? <Link href={`/students/${p.student.id}?from=/payments`} className="text-primary-600 hover:underline">{p.student.firstName} {p.student.lastName}</Link> : '-'}</td>
                <td className="py-3 px-3 text-sm">{p.sponsor ? <Link href={`/sponsors?search=${encodeURIComponent(p.sponsor.lastName)}&from=/payments`} className="text-primary-600 hover:underline">{p.sponsor.firstName} {p.sponsor.lastName}</Link> : (p.donorName || '-')}</td>
                <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">{p.notes || '-'}</td>
                {canEdit && (
                  <td className="py-3 px-3 text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deletePayment(p.id, p._type)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            )
          ))}
          {sorted.length === 0 && <tr><td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">{t('app.noData')}</td></tr>}
        </tbody></table>
      </div>
    </div>
  )
}
