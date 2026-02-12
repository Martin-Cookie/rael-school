'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronDown, ChevronUp, ArrowUpDown, UtensilsCrossed, Search } from 'lucide-react'
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

export default function ReportsPage() {
  const [locale, setLocale] = useState<Locale>('cs')
  const [loading, setLoading] = useState(true)
  const [voucherStats, setVoucherStats] = useState<VoucherStat[]>([])
  const [openSection, setOpenSection] = useState<string | null>('vouchers')
  const [sortCol, setSortCol] = useState<string>('lastName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [search, setSearch] = useState('')

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
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return (
      <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => handleSort(col)}>
        <div className="flex items-center gap-1">
          {children}
          {isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
        </div>
      </th>
    )
  }

  const q = search.toLowerCase()
  const filtered = voucherStats.filter(s =>
    !search
    || s.firstName.toLowerCase().includes(q)
    || s.lastName.toLowerCase().includes(q)
    || (s.studentNo && s.studentNo.toLowerCase().includes(q))
    || (s.className && s.className.toLowerCase().includes(q))
  )

  const sorted = [...filtered].sort((a: any, b: any) => {
    let va = a[sortCol]
    let vb = b[sortCol]
    if (sortCol === 'available') { va = a.purchased - a.used; vb = b.purchased - b.used }
    if (va == null) va = ''
    if (vb == null) vb = ''
    if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
    return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
  })

  const totalPurchased = voucherStats.reduce((s, v) => s + v.purchased, 0)
  const totalUsed = voucherStats.reduce((s, v) => s + v.used, 0)

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
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <button
          onClick={() => setOpenSection(openSection === 'vouchers' ? null : 'vouchers')}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="font-semibold text-gray-900">{t('statistics.voucherPerStudent')}</h2>
              <p className="text-sm text-gray-500">{t('statistics.total')}: {totalPurchased} {t('statistics.purchased').toLowerCase()}, {totalUsed} {t('statistics.used').toLowerCase()}</p>
            </div>
          </div>
          {openSection === 'vouchers' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {openSection === 'vouchers' && (
          <div className="px-5 pb-5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('app.search')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
                    <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
                    <SH col="className" className="text-left">{t('student.className')}</SH>
                    <SH col="purchased" className="text-right">{t('statistics.purchased')}</SH>
                    <SH col="used" className="text-right">{t('statistics.used')}</SH>
                    <SH col="available" className="text-right">{t('statistics.available')}</SH>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(s => {
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

            {filtered.length === 0 && (
              <p className="text-center py-8 text-gray-500 text-sm">{t('app.noData')}</p>
            )}
          </div>
        )}
      </div>

      {/* Future statistics sections will be added here */}
    </div>
  )
}
