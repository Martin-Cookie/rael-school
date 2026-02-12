'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronDown, ChevronUp, ArrowUpDown, UtensilsCrossed, Search, CreditCard } from 'lucide-react'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type SortDir = 'asc' | 'desc'

interface VoucherStat {
  id: string
  studentNo: string
  firstName: string
  lastName: string
  className: string | null
  purchased: number
  used: number
}

interface PaymentType {
  id: string
  name: string
}

interface SponsorPaymentStat {
  id: string
  studentNo: string
  firstName: string
  lastName: string
  className: string | null
  payments: Record<string, { total: number; currency: string }>
}

export default function ReportsPage() {
  const [locale, setLocale] = useState<Locale>('cs')
  const [loading, setLoading] = useState(true)
  const [voucherStats, setVoucherStats] = useState<VoucherStat[]>([])
  const [sponsorPaymentStats, setSponsorPaymentStats] = useState<SponsorPaymentStat[]>([])
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [openSection, setOpenSection] = useState<string | null>(null)

  // Voucher sort state
  const [vSortCol, setVSortCol] = useState<string>('lastName')
  const [vSortDir, setVSortDir] = useState<SortDir>('asc')
  const [vSearch, setVSearch] = useState('')

  // Sponsor payment sort state
  const [spSortCol, setSpSortCol] = useState<string>('lastName')
  const [spSortDir, setSpSortDir] = useState<SortDir>('asc')
  const [spSearch, setSpSearch] = useState('')
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('')

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetch('/api/statistics')
      .then(r => r.json())
      .then(data => {
        setVoucherStats(data.voucherStats || [])
        setSponsorPaymentStats(data.sponsorPaymentStats || [])
        setPaymentTypes(data.paymentTypes || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Generic sortable header
  function SortHeader({ col, sortCol, sortDir, onSort, children, className = '' }: {
    col: string; sortCol: string; sortDir: SortDir; onSort: (col: string) => void; children: React.ReactNode; className?: string
  }) {
    const isA = sortCol === col
    return (
      <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => onSort(col)}>
        <div className="flex items-center gap-1">
          {children}
          {isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
        </div>
      </th>
    )
  }

  function handleVSort(col: string) {
    if (vSortCol === col) setVSortDir(vSortDir === 'asc' ? 'desc' : 'asc')
    else { setVSortCol(col); setVSortDir('asc') }
  }

  function handleSpSort(col: string) {
    if (spSortCol === col) setSpSortDir(spSortDir === 'asc' ? 'desc' : 'asc')
    else { setSpSortCol(col); setSpSortDir('asc') }
  }

  // === Voucher data ===
  const vq = vSearch.toLowerCase()
  const vFiltered = voucherStats.filter(s =>
    !vSearch
    || s.firstName.toLowerCase().includes(vq)
    || s.lastName.toLowerCase().includes(vq)
    || (s.studentNo && s.studentNo.toLowerCase().includes(vq))
    || (s.className && s.className.toLowerCase().includes(vq))
  )

  const vSorted = [...vFiltered].sort((a: any, b: any) => {
    let va = a[vSortCol]
    let vb = b[vSortCol]
    if (vSortCol === 'available') { va = a.purchased - a.used; vb = b.purchased - b.used }
    if (va == null) va = ''
    if (vb == null) vb = ''
    if (typeof va === 'number' && typeof vb === 'number') return vSortDir === 'asc' ? va - vb : vb - va
    return vSortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
  })

  const totalPurchased = voucherStats.reduce((s, v) => s + v.purchased, 0)
  const totalUsed = voucherStats.reduce((s, v) => s + v.used, 0)

  // === Sponsor payment data ===
  // Collect all unique payment types from the data
  const allPaymentTypesInData = new Set<string>()
  sponsorPaymentStats.forEach(s => Object.keys(s.payments).forEach(pt => allPaymentTypesInData.add(pt)))

  // Filter types to show based on selection
  const typesToShow = selectedPaymentType ? [selectedPaymentType] : Array.from(allPaymentTypesInData)

  const spq = spSearch.toLowerCase()
  const spFiltered = sponsorPaymentStats.filter(s =>
    !spSearch
    || s.firstName.toLowerCase().includes(spq)
    || s.lastName.toLowerCase().includes(spq)
    || (s.studentNo && s.studentNo.toLowerCase().includes(spq))
    || (s.className && s.className.toLowerCase().includes(spq))
  )

  // Add computed fields for sorting
  const spWithComputed = spFiltered.map(s => {
    const hasPayment = typesToShow.some(pt => s.payments[pt]?.total > 0)
    const totalAmount = typesToShow.reduce((sum, pt) => sum + (s.payments[pt]?.total || 0), 0)
    return { ...s, hasPayment, totalAmount }
  })

  const spSorted = [...spWithComputed].sort((a: any, b: any) => {
    let va = a[spSortCol]
    let vb = b[spSortCol]
    if (spSortCol === 'hasPayment') { va = a.hasPayment ? 1 : 0; vb = b.hasPayment ? 1 : 0 }
    if (spSortCol === 'totalAmount') { va = a.totalAmount; vb = b.totalAmount }
    if (va == null) va = ''
    if (vb == null) vb = ''
    if (typeof va === 'number' && typeof vb === 'number') return spSortDir === 'asc' ? va - vb : vb - va
    return spSortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
  })

  const withPaymentCount = spWithComputed.filter(s => s.hasPayment).length
  const withoutPaymentCount = spWithComputed.filter(s => !s.hasPayment).length
  const grandTotal = spWithComputed.reduce((sum, s) => sum + s.totalAmount, 0)

  // Map payment type name to translated label
  function paymentTypeLabel(name: string): string {
    const key = `sponsorPayments.${name}` as string
    const translated = t(key)
    // If translation returns the key itself, use the raw name
    return translated === key ? name : translated
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('statistics.title')}</h1>
      </div>

      {/* Section: Vouchers per student */}
      <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden mb-4">
        <button
          onClick={() => setOpenSection(openSection === 'vouchers' ? null : 'vouchers')}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">{t('statistics.voucherPerStudent')}</h2>
            <p className="text-sm text-gray-500">{t('statistics.total')}: {totalPurchased} {t('statistics.purchased').toLowerCase()}, {totalUsed} {t('statistics.used').toLowerCase()}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'vouchers' ? 'rotate-180' : ''}`} />
        </button>

        {openSection === 'vouchers' && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={vSearch}
                onChange={(e) => setVSearch(e.target.value)}
                placeholder={t('app.search')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <SortHeader col="lastName" sortCol={vSortCol} sortDir={vSortDir} onSort={handleVSort} className="text-left">{t('student.lastName')}</SortHeader>
                    <SortHeader col="firstName" sortCol={vSortCol} sortDir={vSortDir} onSort={handleVSort} className="text-left">{t('student.firstName')}</SortHeader>
                    <SortHeader col="className" sortCol={vSortCol} sortDir={vSortDir} onSort={handleVSort} className="text-left">{t('student.className')}</SortHeader>
                    <SortHeader col="purchased" sortCol={vSortCol} sortDir={vSortDir} onSort={handleVSort} className="text-right">{t('statistics.purchased')}</SortHeader>
                    <SortHeader col="used" sortCol={vSortCol} sortDir={vSortDir} onSort={handleVSort} className="text-right">{t('statistics.used')}</SortHeader>
                    <SortHeader col="available" sortCol={vSortCol} sortDir={vSortDir} onSort={handleVSort} className="text-right">{t('statistics.available')}</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {vSorted.map(s => {
                    const available = s.purchased - s.used
                    return (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 text-sm font-medium">
                          <Link href={`/students/${s.id}`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                        <td className="py-3 px-3 text-sm text-gray-500">{s.className || '-'}</td>
                        <td className="py-3 px-3 text-sm text-right">
                          {s.purchased > 0 ? <span className="font-medium text-gray-900">{s.purchased}</span> : <span className="text-gray-400">0</span>}
                        </td>
                        <td className="py-3 px-3 text-sm text-right">
                          {s.used > 0 ? <span className="font-medium text-gray-900">{s.used}</span> : <span className="text-gray-400">0</span>}
                        </td>
                        <td className="py-3 px-3 text-sm text-right">
                          {available > 0
                            ? <span className="badge badge-green">{available}</span>
                            : available < 0
                              ? <span className="badge badge-red">{available}</span>
                              : <span className="text-gray-400">0</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="py-3 px-3 text-sm" colSpan={3}>{t('statistics.total')}</td>
                    <td className="py-3 px-3 text-sm text-right">{totalPurchased}</td>
                    <td className="py-3 px-3 text-sm text-right">{totalUsed}</td>
                    <td className="py-3 px-3 text-sm text-right">{totalPurchased - totalUsed}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {vFiltered.length === 0 && (
              <p className="text-center py-8 text-gray-500 text-sm">{t('app.noData')}</p>
            )}
          </div>
        )}
      </div>

      {/* Section: Sponsor payments per student */}
      <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden mb-4">
        <button
          onClick={() => setOpenSection(openSection === 'sponsorPayments' ? null : 'sponsorPayments')}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">{t('statistics.sponsorPayments')}</h2>
            <p className="text-sm text-gray-500">{withPaymentCount} {t('statistics.studentsWithPayment')}, {withoutPaymentCount} {t('statistics.studentsWithoutPayment')}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'sponsorPayments' ? 'rotate-180' : ''}`} />
        </button>

        {openSection === 'sponsorPayments' && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={spSearch}
                  onChange={(e) => setSpSearch(e.target.value)}
                  placeholder={t('app.search')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
              </div>
              <select
                value={selectedPaymentType}
                onChange={(e) => setSelectedPaymentType(e.target.value)}
                className="py-2.5 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
              >
                <option value="">{t('statistics.allTypes')}</option>
                {paymentTypes.map(pt => (
                  <option key={pt.id} value={pt.name}>{paymentTypeLabel(pt.name)}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <SortHeader col="lastName" sortCol={spSortCol} sortDir={spSortDir} onSort={handleSpSort} className="text-left">{t('student.lastName')}</SortHeader>
                    <SortHeader col="firstName" sortCol={spSortCol} sortDir={spSortDir} onSort={handleSpSort} className="text-left">{t('student.firstName')}</SortHeader>
                    <SortHeader col="className" sortCol={spSortCol} sortDir={spSortDir} onSort={handleSpSort} className="text-left">{t('student.className')}</SortHeader>
                    <SortHeader col="hasPayment" sortCol={spSortCol} sortDir={spSortDir} onSort={handleSpSort} className="text-center">{t('statistics.recorded')}</SortHeader>
                    <SortHeader col="totalAmount" sortCol={spSortCol} sortDir={spSortDir} onSort={handleSpSort} className="text-right">{t('statistics.amount')}</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {spSorted.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm font-medium">
                        <Link href={`/students/${s.id}`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                      <td className="py-3 px-3 text-sm text-gray-500">{s.className || '-'}</td>
                      <td className="py-3 px-3 text-sm text-center">
                        {s.hasPayment
                          ? <span className="badge badge-green">{t('statistics.hasPayment')}</span>
                          : <span className="badge badge-red">{t('statistics.noPayment')}</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-sm text-right">
                        {s.totalAmount > 0
                          ? <span className="font-medium text-gray-900">{s.totalAmount.toLocaleString()} KES</span>
                          : <span className="text-gray-400">-</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="py-3 px-3 text-sm" colSpan={3}>{t('statistics.total')}</td>
                    <td className="py-3 px-3 text-sm text-center">{withPaymentCount} / {spWithComputed.length}</td>
                    <td className="py-3 px-3 text-sm text-right">{grandTotal.toLocaleString()} KES</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {spFiltered.length === 0 && (
              <p className="text-center py-8 text-gray-500 text-sm">{t('app.noData')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
