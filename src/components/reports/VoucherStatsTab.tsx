import Link from 'next/link'
import { ChevronUp, ChevronDown, ArrowUpDown, Search } from 'lucide-react'

type SortDir = 'asc' | 'desc'

export interface VoucherStat {
  id: string
  studentNo: string
  firstName: string
  lastName: string
  className: string | null
  purchased: number
  used: number
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
        {isA ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />}
      </div>
    </th>
  )
}

interface VoucherStatsTabProps {
  voucherStats: VoucherStat[]
  vSearch: string
  setVSearch: (value: string) => void
  vSortCol: string
  vSortDir: SortDir
  handleVSort: (col: string) => void
  t: (key: string) => string
  formatNumber: (n: number) => string
}

export function VoucherStatsTab({
  voucherStats,
  vSearch,
  setVSearch,
  vSortCol,
  vSortDir,
  handleVSort,
  t,
  formatNumber,
}: VoucherStatsTabProps) {
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

  return (
    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={vSearch}
          onChange={(e) => setVSearch(e.target.value)}
          placeholder={t('app.search')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
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
                <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-3 text-sm font-medium">
                    <Link href={`/students/${s.id}?from=/reports`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                  </td>
                  <td className="py-3 px-3 text-sm"><Link href={`/students/${s.id}?from=/reports`} className="text-primary-600 hover:underline">{s.firstName}</Link></td>
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
  )
}
