import Link from 'next/link'
import { ChevronUp, ChevronDown, ArrowUpDown, Search } from 'lucide-react'

type SortDir = 'asc' | 'desc'

export interface PaymentType {
  id: string
  name: string
}

export interface SponsorPaymentStat {
  id: string
  studentNo: string
  firstName: string
  lastName: string
  className: string | null
  payments: Record<string, { total: number; currency: string }>
}

interface SortHeaderProps {
  col: string
  sortCol: string
  sortDir: SortDir
  onSort: (col: string) => void
  children: React.ReactNode
  className?: string
}

function SortHeader({ col, sortCol, sortDir, onSort, children, className = '' }: SortHeaderProps) {
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

interface SponsorPaymentStatsTabProps {
  sponsorPaymentStats: SponsorPaymentStat[]
  paymentTypes: PaymentType[]
  spSearch: string
  setSpSearch: (value: string) => void
  spSortCol: string
  spSortDir: SortDir
  handleSpSort: (col: string) => void
  selectedPaymentType: string
  setSelectedPaymentType: (value: string) => void
  t: (key: string) => string
  formatNumber: (n: number) => string
  formatCurrency: (n: number, currency?: string) => string
}

export function SponsorPaymentStatsTab({
  sponsorPaymentStats,
  paymentTypes,
  spSearch,
  setSpSearch,
  spSortCol,
  spSortDir,
  handleSpSort,
  selectedPaymentType,
  setSelectedPaymentType,
  t,
}: SponsorPaymentStatsTabProps) {
  // Determine which payment types to show
  const allPaymentTypesInData = new Set<string>()
  sponsorPaymentStats.forEach(s => Object.keys(s.payments).forEach(pt => allPaymentTypesInData.add(pt)))
  const typesToShow = selectedPaymentType ? [selectedPaymentType] : Array.from(allPaymentTypesInData)

  // Filter by search
  const spq = spSearch.toLowerCase()
  const spFiltered = sponsorPaymentStats.filter(s =>
    !spSearch
    || s.firstName.toLowerCase().includes(spq)
    || s.lastName.toLowerCase().includes(spq)
    || (s.studentNo && s.studentNo.toLowerCase().includes(spq))
    || (s.className && s.className.toLowerCase().includes(spq))
  )

  // Compute hasPayment and totalAmount
  const spWithComputed = spFiltered.map(s => {
    const hasPayment = typesToShow.some(pt => s.payments[pt]?.total > 0)
    const totalAmount = typesToShow.reduce((sum, pt) => sum + (s.payments[pt]?.total || 0), 0)
    return { ...s, hasPayment, totalAmount }
  })

  // Sort
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
  const grandTotal = spWithComputed.reduce((sum, s) => sum + s.totalAmount, 0)

  // Map payment type name to translated label
  function paymentTypeLabel(name: string): string {
    const key = `sponsorPayments.${name}` as string
    const translated = t(key)
    return translated === key ? name : translated
  }

  return (
    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={spSearch}
            onChange={(e) => setSpSearch(e.target.value)}
            placeholder={t('app.search')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
          />
        </div>
        <select
          value={selectedPaymentType}
          onChange={(e) => setSelectedPaymentType(e.target.value)}
          className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
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
              <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-3 text-sm font-medium">
                  <Link href={`/students/${s.id}?from=/reports`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                </td>
                <td className="py-3 px-3 text-sm"><Link href={`/students/${s.id}?from=/reports`} className="text-primary-600 hover:underline">{s.firstName}</Link></td>
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
  )
}
