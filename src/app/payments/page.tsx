'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CreditCard, Ticket, Plus, Pencil, Trash2, Check, X, Upload, ChevronUp, ChevronDown, ArrowUpDown, Search, Download } from 'lucide-react'
import { formatNumber, formatDate, formatDateForInput } from '@/lib/format'
import { downloadCSV } from '@/lib/csv'

import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, getLocaleName, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }
const CURRENCIES = ['CZK', 'EUR', 'USD', 'KES']

function fmtCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}

export default function PaymentsPage() {
  const [sponsorPayments, setSponsorPayments] = useState<any[]>([])
  const [voucherPurchases, setVoucherPurchases] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [activeTab, setActiveTab] = useState<'sponsor' | 'voucher'>('sponsor')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Students & sponsors for dropdowns
  const [students, setStudents] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [paymentTypes, setPaymentTypes] = useState<any[]>([])
  const [userRole, setUserRole] = useState('')

  // Add forms
  const [showAddSponsor, setShowAddSponsor] = useState(false)
  const [newSP, setNewSP] = useState({ studentId: '', sponsorId: '', paymentDate: '', amount: '', currency: 'CZK', paymentType: '', notes: '' })
  const [showAddVoucher, setShowAddVoucher] = useState(false)
  const [newVP, setNewVP] = useState({ studentId: '', purchaseDate: '', amount: '', currency: 'CZK', count: '', sponsorId: '', notes: '' })
  const [voucherRates, setVoucherRates] = useState<{ currency: string; rate: number }[]>([])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

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
      setStats(data.stats)
      setStudents(data.students || [])
      setSponsors(data.sponsors || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const canEdit = userRole && ['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(userRole)

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

  // Sorting
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const stickyRef = useRef<HTMLDivElement>(null)
  const [theadTop, setTheadTop] = useState(0)

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va: any, vb: any
      if (col === '_studentName') {
        va = a.student ? `${a.student.lastName} ${a.student.firstName}` : ''
        vb = b.student ? `${b.student.lastName} ${b.student.firstName}` : ''
      } else if (col === '_sponsorName') {
        va = a.sponsor ? `${a.sponsor.lastName} ${a.sponsor.firstName}` : (a.donorName || '')
        vb = b.sponsor ? `${b.sponsor.lastName} ${b.sponsor.firstName}` : (b.donorName || '')
      } else {
        va = a[col]; vb = b[col]
      }
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  // ===== SPONSOR PAYMENT CRUD =====
  async function addSponsorPayment() {
    if (!newSP.studentId || !newSP.paymentDate || !newSP.amount || !newSP.paymentType) {
      showMsg('error', t('payments.fillRequired'))
      return
    }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sponsor', ...newSP }),
      })
      if (res.ok) {
        setNewSP({ studentId: '', sponsorId: '', paymentDate: '', amount: '', currency: 'CZK', paymentType: '', notes: '' })
        setShowAddSponsor(false)
        await fetchData()
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error || t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function saveSponsorEdit(id: string) {
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sponsor', id, ...editData }),
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

  async function deleteSponsorPayment(id: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try {
      const res = await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sponsor', id }),
      })
      if (res.ok) {
        await fetchData()
        showMsg('success', t('app.deleteSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  // ===== VOUCHER PURCHASE CRUD =====
  async function addVoucherPurchase() {
    if (!newVP.studentId || !newVP.purchaseDate || !newVP.amount || !newVP.count) {
      showMsg('error', t('payments.fillRequired'))
      return
    }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'voucher', ...newVP }),
      })
      if (res.ok) {
        setNewVP({ studentId: '', purchaseDate: '', amount: '', currency: 'CZK', count: '', sponsorId: '', notes: '' })
        setShowAddVoucher(false)
        await fetchData()
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error || t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function saveVoucherEdit(id: string) {
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'voucher', id, ...editData }),
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

  async function deleteVoucherPurchase(id: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try {
      const res = await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'voucher', id }),
      })
      if (res.ok) {
        await fetchData()
        showMsg('success', t('app.deleteSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  function startEdit(item: any, type: 'sponsor' | 'voucher') {
    setEditingId(item.id)
    if (type === 'sponsor') {
      setEditData({
        studentId: item.studentId || item.student?.id || '',
        sponsorId: item.sponsorId || item.sponsor?.id || '',
        paymentDate: formatDateForInput(item.paymentDate),
        amount: item.amount.toString(),
        currency: item.currency || 'KES',
        paymentType: item.paymentType || '',
        notes: item.notes || '',
      })
    } else {
      setEditData({
        studentId: item.studentId || item.student?.id || '',
        purchaseDate: formatDateForInput(item.purchaseDate),
        amount: item.amount.toString(),
        currency: item.currency || 'KES',
        count: item.count.toString(),
        sponsorId: item.sponsorId || item.sponsor?.id || '',
        notes: item.notes || '',
      })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  const spByCur = stats?.sponsorPaymentsByCurrency || {}

  const q = search.toLowerCase()
  const filteredSP = q ? sponsorPayments.filter((p: any) => {
    const studentName = p.student ? `${p.student.firstName} ${p.student.lastName}` : ''
    const sponsorName = p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : ''
    const pt = paymentTypes.find((t: any) => t.name === p.paymentType)
    const ptName = pt ? getLocaleName(pt, locale) : (p.paymentType || '')
    return studentName.toLowerCase().includes(q) || sponsorName.toLowerCase().includes(q) || ptName.toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q) || String(p.amount).includes(q) || (p.currency || '').toLowerCase().includes(q)
  }) : sponsorPayments
  const filteredVP = q ? voucherPurchases.filter((v: any) => {
    const studentName = v.student ? `${v.student.firstName} ${v.student.lastName}` : ''
    const sponsorName = v.sponsor ? `${v.sponsor.firstName} ${v.sponsor.lastName}` : (v.donorName || '')
    return studentName.toLowerCase().includes(q) || sponsorName.toLowerCase().includes(q) || (v.notes || '').toLowerCase().includes(q) || String(v.amount).includes(q) || String(v.count).includes(q) || (v.currency || '').toLowerCase().includes(q)
  }) : voucherPurchases
  const sortedSP = sortData(filteredSP, activeTab === 'sponsor' ? sortCol : '')
  const sortedVP = sortData(filteredVP, activeTab === 'voucher' ? sortCol : '')

  function exportPayments() {
    if (activeTab === 'sponsor') {
      const headers = [t('payments.paymentDate'), t('sponsorPayments.paymentType'), t('payments.amount'), t('nav.students'), t('sponsors.title'), t('payments.notes')]
      const rows = sortedSP.map((p: any) => {
        const pt = paymentTypes.find((t: any) => t.name === p.paymentType)
        return [
          formatDate(p.paymentDate, locale),
          pt ? getLocaleName(pt, locale) : p.paymentType,
          `${formatNumber(p.amount)} ${p.currency}`,
          p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
          p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : '',
          p.notes || '',
        ]
      })
      downloadCSV('sponsor-payments.csv', headers, rows)
    } else {
      const headers = [t('vouchers.purchaseDate'), t('vouchers.amount'), t('vouchers.count'), t('nav.students'), t('sponsors.title'), t('payments.notes')]
      const rows = sortedVP.map((v: any) => [
        formatDate(v.purchaseDate, locale),
        `${formatNumber(v.amount)} ${v.currency || 'KES'}`,
        v.count,
        v.student ? `${v.student.firstName} ${v.student.lastName}` : '',
        v.sponsor ? `${v.sponsor.firstName} ${v.sponsor.lastName}` : (v.donorName || ''),
        v.notes || '',
      ])
      downloadCSV('voucher-purchases.csv', headers, rows)
    }
  }

  return (
    <div>
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Sticky header + tabs */}
      <div ref={stickyRef} className="sticky top-16 lg:top-0 z-30 bg-[#fafaf8] pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 pt-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={exportPayments} className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> {t('app.exportCSV')}
            </button>
            {canEdit && (
              <Link href="/payments/import" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                <Upload className="w-4 h-4" /> {t('payments.importPayments')}
              </Link>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button onClick={() => { setActiveTab('sponsor'); setSortCol(''); setSortDir('asc') }} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sponsor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <CreditCard className="w-4 h-4" /> {t('sponsorPayments.title')} ({filteredSP.length}{q && filteredSP.length !== sponsorPayments.length ? `/${sponsorPayments.length}` : ''})
          </button>
          <button onClick={() => { setActiveTab('voucher'); setSortCol(''); setSortDir('asc') }} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'voucher' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Ticket className="w-4 h-4" /> {t('vouchers.purchases')} ({filteredVP.length}{q && filteredVP.length !== voucherPurchases.length ? `/${voucherPurchases.length}` : ''})
          </button>
        </div>
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('app.search')} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* ===== SPONSOR PAYMENTS ===== */}
        {activeTab === 'sponsor' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              {Object.keys(spByCur).sort().map(cur => (
                <div key={cur} className="bg-blue-50 rounded-xl px-5 py-3">
                  <p className="text-xs text-blue-600 font-medium">{cur}</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(spByCur[cur])}</p>
                </div>
              ))}
              {Object.keys(spByCur).length === 0 && <p className="text-gray-400 text-sm">{t('app.noData')}</p>}
            </div>

            {/* Add button */}
            {canEdit && (
              <div className="mb-4">
                <button onClick={() => setShowAddSponsor(!showAddSponsor)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
                  <Plus className="w-4 h-4" /> {t('payments.addPayment')}
                </button>
              </div>
            )}

            {/* Add form */}
            {showAddSponsor && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <select value={newSP.studentId} onChange={(e) => setNewSP({ ...newSP, studentId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">{t('nav.students')} *</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.studentNo})</option>)}
                  </select>
                  <select value={newSP.sponsorId} onChange={(e) => setNewSP({ ...newSP, sponsorId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">{t('sponsors.title')}</option>
                    {sponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                  </select>
                  <input type="date" value={newSP.paymentDate} onChange={(e) => setNewSP({ ...newSP, paymentDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="number" value={newSP.amount} onChange={(e) => setNewSP({ ...newSP, amount: e.target.value })} placeholder={t('payments.amount') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <select value={newSP.currency} onChange={(e) => setNewSP({ ...newSP, currency: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newSP.paymentType} onChange={(e) => setNewSP({ ...newSP, paymentType: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
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
                  <input type="text" value={newSP.notes} onChange={(e) => setNewSP({ ...newSP, notes: e.target.value })} placeholder={t('payments.notes')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm sm:col-span-2 lg:col-span-3" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addSponsorPayment} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                  <button onClick={() => setShowAddSponsor(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button>
                </div>
              </div>
            )}

            {/* Table */}
            <table className="w-full"><thead><tr className="border-b border-gray-200 bg-white sticky z-20" style={{ top: theadTop }}>
              <SH col="paymentDate" className="text-left">{t('payments.paymentDate')}</SH>
              <SH col="paymentType" className="text-left">{t('sponsorPayments.paymentType')}</SH>
              <SH col="amount" className="text-left">{t('payments.amount')}</SH>
              <SH col="_studentName" className="text-left">{t('nav.students')}</SH>
              <SH col="_sponsorName" className="text-left">{t('sponsors.title')}</SH>
              <SH col="notes" className="text-left">{t('payments.notes')}</SH>
              {canEdit && <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('app.actions')}</th>}
            </tr></thead><tbody>
              {sortedSP.map((p: any) => (
                editingId === p.id ? (
                  <tr key={p.id} className="border-b border-gray-50 bg-primary-50">
                    <td className="py-2 px-3"><input type="date" value={editData.paymentDate || ''} onChange={(e) => setEditData({ ...editData, paymentDate: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full" /></td>
                    <td className="py-2 px-3">
                      <select value={editData.paymentType || ''} onChange={(e) => setEditData({ ...editData, paymentType: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full">
                        {paymentTypes.length > 0
                          ? paymentTypes.map((pt: any) => <option key={pt.id} value={pt.name}>{getLocaleName(pt, locale)}</option>)
                          : <>
                              <option value="tuition">{t('sponsorPayments.tuition')}</option>
                              <option value="medical">{t('sponsorPayments.medical')}</option>
                              <option value="other">{t('sponsorPayments.other')}</option>
                            </>
                        }
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <input type="number" value={editData.amount || ''} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-20" />
                        <select value={editData.currency || 'KES'} onChange={(e) => setEditData({ ...editData, currency: e.target.value })} className="px-1 py-1 rounded border border-gray-300 text-sm w-16">
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <select value={editData.studentId || ''} onChange={(e) => setEditData({ ...editData, studentId: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full">
                        <option value="">—</option>
                        {students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select value={editData.sponsorId || ''} onChange={(e) => setEditData({ ...editData, sponsorId: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full">
                        <option value="">—</option>
                        {sponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3"><input type="text" value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full" /></td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveSponsorEdit(p.id)} className="p-1.5 text-primary-600 hover:text-primary-800"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                    <td className="py-3 px-3 text-sm text-gray-900">{formatDate(p.paymentDate, locale)}</td>
                    <td className="py-3 px-3 text-sm"><span className={`badge ${p.paymentType === 'tuition' ? 'badge-green' : p.paymentType === 'medical' ? 'badge-yellow' : 'badge-red'}`}>{(() => { const pt = paymentTypes.find((t: any) => t.name === p.paymentType); return pt ? getLocaleName(pt, locale) : p.paymentType })()}</span></td>
                    <td className="py-3 px-3 text-sm text-gray-900 font-medium">{fmtCurrency(p.amount, p.currency)}</td>
                    <td className="py-3 px-3 text-sm">{p.student ? <Link href={`/students/${p.student.id}?from=/payments`} className="text-primary-600 hover:underline">{p.student.firstName} {p.student.lastName}</Link> : '-'}</td>
                    <td className="py-3 px-3 text-sm">{p.sponsor ? <Link href={`/sponsors?search=${encodeURIComponent(p.sponsor.lastName)}&from=/payments`} className="text-primary-600 hover:underline">{p.sponsor.firstName} {p.sponsor.lastName}</Link> : '-'}</td>
                    <td className="py-3 px-3 text-sm text-gray-500">{p.notes || '-'}</td>
                    {canEdit && (
                      <td className="py-3 px-3 text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(p, 'sponsor')} className="p-1.5 text-gray-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteSponsorPayment(p.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              ))}
              {sortedSP.length === 0 && <tr><td colSpan={canEdit ? 7 : 6} className="py-8 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
            </tbody></table>
          </div>
        )}

        {/* ===== VOUCHER PURCHASES ===== */}
        {activeTab === 'voucher' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              {(() => {
                const vpByCur: Record<string, number> = {}
                voucherPurchases.forEach((v: any) => { const c = v.currency || 'KES'; vpByCur[c] = (vpByCur[c] || 0) + v.amount })
                return Object.keys(vpByCur).sort().map(cur => (
                  <div key={cur} className="bg-blue-50 rounded-xl px-5 py-3">
                    <p className="text-xs text-blue-600 font-medium">{cur}</p>
                    <p className="text-xl font-bold text-blue-900">{formatNumber(vpByCur[cur])}</p>
                  </div>
                ))
              })()}
              {voucherPurchases.length === 0 && <div className="bg-blue-50 rounded-xl px-5 py-3"><p className="text-xs text-blue-600 font-medium">{t('vouchers.totalAmount')}</p><p className="text-xl font-bold text-blue-900">0</p></div>}
              <div className="bg-primary-50 rounded-xl px-5 py-3">
                <p className="text-xs text-primary-600 font-medium">{t('vouchers.totalPurchased')}</p>
                <p className="text-xl font-bold text-primary-900">{formatNumber(voucherPurchases.reduce((s: number, v: any) => s + v.count, 0))}</p>
              </div>
            </div>

            {/* Add button */}
            {canEdit && (
              <div className="mb-4">
                <button onClick={() => setShowAddVoucher(!showAddVoucher)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
                  <Plus className="w-4 h-4" /> {t('vouchers.addPurchase')}
                </button>
              </div>
            )}

            {/* Add form */}
            {showAddVoucher && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <select value={newVP.studentId} onChange={(e) => setNewVP({ ...newVP, studentId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">{t('nav.students')} *</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.studentNo})</option>)}
                  </select>
                  <input type="date" value={newVP.purchaseDate} onChange={(e) => setNewVP({ ...newVP, purchaseDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <div className="flex gap-2">
                    <input type="number" value={newVP.amount} onChange={(e) => { const amt = e.target.value; setNewVP(prev => ({ ...prev, amount: amt, count: autoVoucherCount(amt, prev.currency) })) }} placeholder={t('vouchers.amount') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 text-sm flex-1" />
                    <select value={newVP.currency} onChange={(e) => { const cur = e.target.value; setNewVP(prev => ({ ...prev, currency: cur, count: autoVoucherCount(prev.amount, cur) })) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-24">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input type="number" value={newVP.count} onChange={(e) => setNewVP({ ...newVP, count: e.target.value })} placeholder={(() => { const rate = getVoucherRate(newVP.currency); return rate ? `${t('vouchers.count')} (1 = ${formatNumber(rate)} ${newVP.currency})` : t('vouchers.count') + ' *' })()} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <select value={newVP.sponsorId} onChange={(e) => setNewVP({ ...newVP, sponsorId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">{t('sponsors.title')}</option>
                    {sponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                  </select>
                  <input type="text" value={newVP.notes} onChange={(e) => setNewVP({ ...newVP, notes: e.target.value })} placeholder={t('payments.notes')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addVoucherPurchase} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                  <button onClick={() => setShowAddVoucher(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button>
                </div>
              </div>
            )}

            {/* Table */}
            <table className="w-full"><thead><tr className="border-b border-gray-200 bg-white sticky z-20" style={{ top: theadTop }}>
              <SH col="purchaseDate" className="text-left">{t('vouchers.purchaseDate')}</SH>
              <SH col="amount" className="text-left">{t('vouchers.amount')}</SH>
              <SH col="count" className="text-left">{t('vouchers.count')}</SH>
              <SH col="_studentName" className="text-left">{t('nav.students')}</SH>
              <SH col="_sponsorName" className="text-left">{t('sponsors.title')}</SH>
              <SH col="notes" className="text-left">{t('payments.notes')}</SH>
              {canEdit && <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('app.actions')}</th>}
            </tr></thead><tbody>
              {sortedVP.map((v: any) => (
                editingId === v.id ? (
                  <tr key={v.id} className="border-b border-gray-50 bg-primary-50">
                    <td className="py-2 px-3"><input type="date" value={editData.purchaseDate || ''} onChange={(e) => setEditData({ ...editData, purchaseDate: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full" /></td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <input type="number" value={editData.amount || ''} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-20" />
                        <select value={editData.currency || 'KES'} onChange={(e) => setEditData({ ...editData, currency: e.target.value })} className="px-1 py-1 rounded border border-gray-300 text-sm w-16">
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3"><input type="number" value={editData.count || ''} onChange={(e) => setEditData({ ...editData, count: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-16" /></td>
                    <td className="py-2 px-3">
                      <select value={editData.studentId || ''} onChange={(e) => setEditData({ ...editData, studentId: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full">
                        <option value="">—</option>
                        {students.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select value={editData.sponsorId || ''} onChange={(e) => setEditData({ ...editData, sponsorId: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full">
                        <option value="">—</option>
                        {sponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3"><input type="text" value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="px-2 py-1 rounded border border-gray-300 text-sm w-full" /></td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveVoucherEdit(v.id)} className="p-1.5 text-primary-600 hover:text-primary-800"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                    <td className="py-3 px-3 text-sm text-gray-900">{formatDate(v.purchaseDate, locale)}</td>
                    <td className="py-3 px-3 text-sm text-gray-900 font-medium">{fmtCurrency(v.amount, v.currency || 'KES')}</td>
                    <td className="py-3 px-3 text-sm text-gray-900">{formatNumber(v.count)}</td>
                    <td className="py-3 px-3 text-sm">{v.student ? <Link href={`/students/${v.student.id}?from=/payments`} className="text-primary-600 hover:underline">{v.student.firstName} {v.student.lastName}</Link> : '-'}</td>
                    <td className="py-3 px-3 text-sm">{v.sponsor ? <Link href={`/sponsors?search=${encodeURIComponent(v.sponsor.lastName)}&from=/payments`} className="text-primary-600 hover:underline">{v.sponsor.firstName} {v.sponsor.lastName}</Link> : (v.donorName || '-')}</td>
                    <td className="py-3 px-3 text-sm text-gray-500">{v.notes || '-'}</td>
                    {canEdit && (
                      <td className="py-3 px-3 text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(v, 'voucher')} className="p-1.5 text-gray-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteVoucherPurchase(v.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              ))}
              {sortedVP.length === 0 && <tr><td colSpan={canEdit ? 7 : 6} className="py-8 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  )
}
