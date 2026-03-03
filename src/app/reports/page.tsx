'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronDown, ChevronUp, ArrowUpDown, UtensilsCrossed, Search, CreditCard, Users, Heart, Calendar, TrendingUp, ClipboardList } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { formatNumber, formatCurrency } from '@/lib/format'
import { VoucherStatsTab } from '@/components/reports/VoucherStatsTab'
import type { VoucherStat } from '@/components/reports/VoucherStatsTab'
import { SponsorPaymentStatsTab } from '@/components/reports/SponsorPaymentStatsTab'
import type { PaymentType, SponsorPaymentStat } from '@/components/reports/SponsorPaymentStatsTab'

type SortDir = 'asc' | 'desc'

interface Summary {
  totalStudents: number
  totalSponsors: number
  sponsorPaymentCount: number
  sponsorPaymentsByCurrency: Record<string, number>
  vouchersPurchased: number
  vouchersUsed: number
  vouchersAmount: number
}

interface MonthlyStat {
  year: number
  month: number
  sponsorPaymentsAmount: Record<string, number>
  sponsorPaymentsCount: number
  voucherPurchasesAmount: number
  voucherPurchasesCount: number
  voucherUsagesCount: number
}

interface SponsorStat {
  id: string
  firstName: string
  lastName: string
  email: string
  studentsCount: number
  paymentCount: number
  byCurrency: Record<string, number>
  byType: Record<string, Record<string, number>>
}

export default function ReportsPage() {
  const { t } = useLocale()
  const [loading, setLoading] = useState(true)
  const [voucherStats, setVoucherStats] = useState<VoucherStat[]>([])
  const [sponsorPaymentStats, setSponsorPaymentStats] = useState<SponsorPaymentStat[]>([])
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [years, setYears] = useState<number[]>([])
  const [sponsorStats, setSponsorStats] = useState<SponsorStat[]>([])
  const [openSection, setOpenSection] = useState<string | null>(null)

  // Monthly filter
  const [selectedYear, setSelectedYear] = useState<number | ''>('')

  // Voucher sort state
  const [vSortCol, setVSortCol] = useState<string>('lastName')
  const [vSortDir, setVSortDir] = useState<SortDir>('asc')
  const [vSearch, setVSearch] = useState('')

  // Sponsor payment sort state
  const [spSortCol, setSpSortCol] = useState<string>('lastName')
  const [spSortDir, setSpSortDir] = useState<SortDir>('asc')
  const [spSearch, setSpSearch] = useState('')
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('')

  // Sponsor overview sort state
  const [soSortCol, setSoSortCol] = useState<string>('lastName')
  const [soSortDir, setSoSortDir] = useState<SortDir>('asc')
  const [soSearch, setSoSearch] = useState('')

  const monthNames = [
    t('statistics.january'), t('statistics.february'), t('statistics.march'),
    t('statistics.april'), t('statistics.may'), t('statistics.june'),
    t('statistics.july'), t('statistics.august'), t('statistics.september'),
    t('statistics.october'), t('statistics.november'), t('statistics.december'),
  ]

  useEffect(() => {
    fetch('/api/statistics')
      .then(r => r.json())
      .then(data => {
        setVoucherStats(data.voucherStats || [])
        setSponsorPaymentStats(data.sponsorPaymentStats || [])
        setPaymentTypes(data.paymentTypes || [])
        setSummary(data.summary || null)
        setMonthlyStats(data.monthlyStats || [])
        setYears(data.years || [])
        setSponsorStats(data.sponsorStats || [])
        if (data.years?.length > 0) setSelectedYear(data.years[0])
        setLoading(false)
      })
      .catch((e) => { console.error('Failed to load statistics:', e); setLoading(false) })
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

  function handleSoSort(col: string) {
    if (soSortCol === col) setSoSortDir(soSortDir === 'asc' ? 'desc' : 'asc')
    else { setSoSortCol(col); setSoSortDir('asc') }
  }

  // Format currency amounts from a byCurrency map
  function formatByCurrency(byCurrency: Record<string, number>): string {
    return Object.entries(byCurrency)
      .filter(([, amt]) => amt > 0)
      .map(([cur, amt]) => `${formatNumber(Math.round(amt))} ${cur}`)
      .join(', ') || '-'
  }

  // === Voucher totals (for button subtitle) ===
  const totalPurchased = voucherStats.reduce((s, v) => s + v.purchased, 0)
  const totalUsed = voucherStats.reduce((s, v) => s + v.used, 0)

  // === Sponsor payment totals (for button subtitle) ===
  const allPaymentTypesInData = new Set<string>()
  sponsorPaymentStats.forEach(s => Object.keys(s.payments).forEach(pt => allPaymentTypesInData.add(pt)))
  const typesToShow = selectedPaymentType ? [selectedPaymentType] : Array.from(allPaymentTypesInData)
  const spWithPaymentCount = sponsorPaymentStats.filter(s =>
    typesToShow.some(pt => s.payments[pt]?.total > 0)
  ).length
  const spWithoutPaymentCount = sponsorPaymentStats.length - spWithPaymentCount

  // === Monthly data ===
  const filteredMonthly = selectedYear
    ? monthlyStats.filter(m => m.year === selectedYear)
    : monthlyStats

  const monthlyTotals = filteredMonthly.reduce((acc, m) => {
    acc.spCount += m.sponsorPaymentsCount
    Object.entries(m.sponsorPaymentsAmount).forEach(([cur, amt]) => {
      acc.spByCurrency[cur] = (acc.spByCurrency[cur] || 0) + amt
    })
    acc.vpAmount += m.voucherPurchasesAmount
    acc.vpCount += m.voucherPurchasesCount
    acc.vuCount += m.voucherUsagesCount
    return acc
  }, { spCount: 0, spByCurrency: {} as Record<string, number>, vpAmount: 0, vpCount: 0, vuCount: 0 })

  // === Sponsor overview data ===
  const soq = soSearch.toLowerCase()
  const soFiltered = sponsorStats.filter(s =>
    !soSearch
    || s.firstName.toLowerCase().includes(soq)
    || s.lastName.toLowerCase().includes(soq)
    || s.email.toLowerCase().includes(soq)
  )

  const soSorted = [...soFiltered].sort((a: any, b: any) => {
    let va = a[soSortCol]
    let vb = b[soSortCol]
    if (soSortCol === 'totalPaid') {
      va = Object.values(a.byCurrency as Record<string, number>).reduce((s: number, v: number) => s + v, 0)
      vb = Object.values(b.byCurrency as Record<string, number>).reduce((s: number, v: number) => s + v, 0)
    }
    if (va == null) va = ''
    if (vb == null) vb = ''
    if (typeof va === 'number' && typeof vb === 'number') return soSortDir === 'asc' ? va - vb : vb - va
    return soSortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('statistics.title')}</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">{t('statistics.activeStudents')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalStudents)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <span className="text-sm text-gray-500">{t('statistics.activeSponsors')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalSponsors)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">{t('statistics.sponsorPaymentsTotal')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {Object.entries(summary.sponsorPaymentsByCurrency).map(([cur, amt], i) => (
                <span key={cur}>
                  {i > 0 && <span className="text-gray-400"> + </span>}
                  {formatNumber(Math.round(amt))} {cur}
                </span>
              ))}
              {Object.keys(summary.sponsorPaymentsByCurrency).length === 0 && <span className="text-gray-400">-</span>}
            </p>
            <p className="text-xs text-gray-400 mt-1">{summary.sponsorPaymentCount} {t('statistics.paymentsCount')}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">{t('statistics.vouchersTotal')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.vouchersAmount)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatNumber(summary.vouchersPurchased)} {t('statistics.purchasedCount')} / {formatNumber(summary.vouchersUsed)} {t('statistics.usedCount')}
            </p>
          </div>
        </div>
      )}

      {/* Visit Cards link */}
      <Link
        href="/reports/visit-cards"
        className="block bg-white rounded-xl border border-gray-200 card-hover overflow-hidden mb-4 p-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">{t('visitCards.title')}</h2>
            <p className="text-sm text-gray-500">{t('statistics.visitCardsDesc')}</p>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" />
        </div>
      </Link>

      {/* Section: Monthly Overview */}
      <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden mb-4">
        <button
          onClick={() => setOpenSection(openSection === 'monthly' ? null : 'monthly')}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">{t('statistics.monthlyTitle')}</h2>
            <p className="text-sm text-gray-500">{t('statistics.monthlyDesc')}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'monthly' ? 'rotate-180' : ''}`} />
        </button>

        {openSection === 'monthly' && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            {/* Year selector */}
            <div className="mb-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : '')}
                className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
              >
                <option value="">{t('statistics.allYears')}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 text-left">{t('statistics.month')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 text-right">{t('statistics.spPayments')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 text-right">{t('statistics.count')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 text-right">{t('statistics.vPurchases')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 text-right">{t('statistics.count')}</th>
                    <th className="py-2 px-3 text-sm font-medium text-gray-500 text-right">{t('statistics.vUsages')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthly.map(m => (
                    <tr key={`${m.year}-${m.month}`} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">
                        {!selectedYear && <span className="text-gray-400">{m.year} </span>}
                        {monthNames[m.month - 1]}
                      </td>
                      <td className="py-3 px-3 text-sm text-right">
                        {Object.keys(m.sponsorPaymentsAmount).length > 0
                          ? formatByCurrency(m.sponsorPaymentsAmount)
                          : <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-sm text-right text-gray-500">
                        {m.sponsorPaymentsCount > 0 ? m.sponsorPaymentsCount : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-3 text-sm text-right">
                        {m.voucherPurchasesAmount > 0
                          ? <span className="font-medium">{formatCurrency(m.voucherPurchasesAmount)}</span>
                          : <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-sm text-right text-gray-500">
                        {m.voucherPurchasesCount > 0 ? formatNumber(m.voucherPurchasesCount) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-3 text-sm text-right">
                        {m.voucherUsagesCount > 0
                          ? <span className="font-medium">{formatNumber(m.voucherUsagesCount)}</span>
                          : <span className="text-gray-400">-</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="py-3 px-3 text-sm">{t('statistics.total')}</td>
                    <td className="py-3 px-3 text-sm text-right">{formatByCurrency(monthlyTotals.spByCurrency)}</td>
                    <td className="py-3 px-3 text-sm text-right text-gray-500">{monthlyTotals.spCount}</td>
                    <td className="py-3 px-3 text-sm text-right">{formatCurrency(monthlyTotals.vpAmount)}</td>
                    <td className="py-3 px-3 text-sm text-right text-gray-500">{formatNumber(monthlyTotals.vpCount)}</td>
                    <td className="py-3 px-3 text-sm text-right">{formatNumber(monthlyTotals.vuCount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {filteredMonthly.length === 0 && (
              <p className="text-center py-8 text-gray-500 text-sm">{t('app.noData')}</p>
            )}
          </div>
        )}
      </div>

      {/* Section: Sponsor Overview */}
      <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden mb-4">
        <button
          onClick={() => setOpenSection(openSection === 'sponsorOverview' ? null : 'sponsorOverview')}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-pink-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">{t('statistics.sponsorOverview')}</h2>
            <p className="text-sm text-gray-500">{t('statistics.sponsorOverviewDesc')}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'sponsorOverview' ? 'rotate-180' : ''}`} />
        </button>

        {openSection === 'sponsorOverview' && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={soSearch}
                onChange={(e) => setSoSearch(e.target.value)}
                placeholder={t('app.search')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <SortHeader col="lastName" sortCol={soSortCol} sortDir={soSortDir} onSort={handleSoSort} className="text-left">{t('statistics.sponsor')}</SortHeader>
                    <SortHeader col="email" sortCol={soSortCol} sortDir={soSortDir} onSort={handleSoSort} className="text-left">{t('statistics.email')}</SortHeader>
                    <SortHeader col="studentsCount" sortCol={soSortCol} sortDir={soSortDir} onSort={handleSoSort} className="text-center">{t('statistics.students')}</SortHeader>
                    <SortHeader col="paymentCount" sortCol={soSortCol} sortDir={soSortDir} onSort={handleSoSort} className="text-center">{t('statistics.paymentCount')}</SortHeader>
                    <SortHeader col="totalPaid" sortCol={soSortCol} sortDir={soSortDir} onSort={handleSoSort} className="text-right">{t('statistics.totalPaid')}</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {soSorted.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-3 text-sm font-medium">
                        <Link href={`/sponsors?search=${encodeURIComponent(s.lastName)}&from=/reports`} className="text-primary-600 hover:underline">{s.lastName} {s.firstName}</Link>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-500">{s.email}</td>
                      <td className="py-3 px-3 text-sm text-center">
                        {s.studentsCount > 0
                          ? <span className="badge badge-green">{s.studentsCount}</span>
                          : <span className="text-gray-400">0</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-sm text-center">
                        {s.paymentCount > 0
                          ? <span className="font-medium">{s.paymentCount}</span>
                          : <span className="text-gray-400">0</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-sm text-right">
                        {Object.keys(s.byCurrency).length > 0
                          ? <span className="font-medium">{formatByCurrency(s.byCurrency)}</span>
                          : <span className="text-gray-400">{t('statistics.noPayments')}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {soFiltered.length === 0 && (
              <p className="text-center py-8 text-gray-500 text-sm">{t('app.noData')}</p>
            )}
          </div>
        )}
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
          <VoucherStatsTab
            voucherStats={voucherStats}
            vSearch={vSearch}
            setVSearch={setVSearch}
            vSortCol={vSortCol}
            vSortDir={vSortDir}
            handleVSort={handleVSort}
            t={t}
            formatNumber={formatNumber}
          />
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
            <p className="text-sm text-gray-500">{spWithPaymentCount} {t('statistics.studentsWithPayment')}, {spWithoutPaymentCount} {t('statistics.studentsWithoutPayment')}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'sponsorPayments' ? 'rotate-180' : ''}`} />
        </button>

        {openSection === 'sponsorPayments' && (
          <SponsorPaymentStatsTab
            sponsorPaymentStats={sponsorPaymentStats}
            paymentTypes={paymentTypes}
            spSearch={spSearch}
            setSpSearch={setSpSearch}
            spSortCol={spSortCol}
            spSortDir={spSortDir}
            handleSpSort={handleSpSort}
            selectedPaymentType={selectedPaymentType}
            setSelectedPaymentType={setSelectedPaymentType}
            t={t}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  )
}
