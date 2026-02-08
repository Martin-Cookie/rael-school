'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, CreditCard, HandHeart, AlertCircle, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { formatNumber, formatCurrency, formatDate, calculateAge } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type DashTab = 'overview' | 'students' | 'sponsors' | 'payments' | 'needs'
type SortDir = 'asc' | 'desc'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [studentsWithNeeds, setStudentsWithNeeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [activeTab, setActiveTab] = useState<DashTab>('overview')
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats)
        setRecentPayments(data.recentPayments || [])
        setStudents(data.students || [])
        setSponsors(data.sponsors || [])
        setStudentsWithNeeds(data.studentsWithNeeds || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va = col.includes('.') ? col.split('.').reduce((o, k) => o?.[k], a) : a[col]
      let vb = col.includes('.') ? col.split('.').reduce((o, k) => o?.[k], b) : b[col]
      // Handle _count fields
      if (col.startsWith('_count.')) {
        const field = col.replace('_count.', '')
        va = a._count?.[field] ?? 0
        vb = b._count?.[field] ?? 0
      }
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }

  function SortHeader({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isActive = sortCol === col
    return (
      <th
        className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`}
        onClick={() => handleSort(col)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30" />
          )}
        </div>
      </th>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  const statCards = [
    { key: 'students' as DashTab, label: t('dashboard.totalStudents'), value: formatNumber(stats?.totalStudents || 0), icon: Users, color: 'bg-primary-50 text-primary-600', borderColor: 'border-primary-200' },
    { key: 'sponsors' as DashTab, label: t('dashboard.activeSponsors'), value: formatNumber(stats?.activeSponsors || 0), icon: HandHeart, color: 'bg-accent-50 text-accent-600', borderColor: 'border-accent-200' },
    { key: 'payments' as DashTab, label: t('dashboard.totalPayments'), value: formatCurrency(stats?.totalPayments || 0), icon: CreditCard, color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-200' },
    { key: 'needs' as DashTab, label: t('dashboard.studentsNeedingAttention'), value: formatNumber(stats?.unfulfilledNeeds || 0), icon: AlertCircle, color: 'bg-red-50 text-red-600', borderColor: 'border-red-200' },
  ]

  const sortedStudents = sortData(students, sortCol)
  const sortedSponsors = sortData(sponsors, sortCol)
  const sortedPayments = sortData(recentPayments, sortCol)
  const sortedNeeds = sortData(studentsWithNeeds, sortCol)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.title')}</h1>

      {/* Stat cards - clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <button
            key={card.key}
            onClick={() => { setActiveTab(card.key); setSortCol(''); setSortDir('asc') }}
            className={`bg-white rounded-xl border-2 p-5 card-hover text-left transition-all ${
              activeTab === card.key ? card.borderColor : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Overview - default with recent payments */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentPayments')}</h2>
            {recentPayments.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('app.noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100">
                    <SortHeader col="paymentDate" className="text-left">{t('payments.paymentDate')}</SortHeader>
                    <SortHeader col="student.firstName" className="text-left">{t('student.firstName')}</SortHeader>
                    <SortHeader col="amount" className="text-right">{t('payments.amount')}</SortHeader>
                    <SortHeader col="notes" className="text-left">{t('payments.notes')}</SortHeader>
                  </tr></thead>
                  <tbody>
                    {sortData(recentPayments.slice(0, 10), sortCol).map((payment: any) => (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 text-sm text-gray-900">{formatDate(payment.paymentDate, locale)}</td>
                        <td className="py-3 px-3 text-sm text-gray-900">
                          {payment.student ? (
                            <Link href={`/students/${payment.student.id}`} className="text-primary-600 hover:text-primary-700 hover:underline">
                              {payment.student.firstName} {payment.student.lastName}
                            </Link>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(payment.amount)}</td>
                        <td className="py-3 px-3 text-sm text-gray-500">{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Students tab */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('student.list')} ({students.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <SortHeader col="studentNo" className="text-left">{t('student.studentNo')}</SortHeader>
                  <SortHeader col="lastName" className="text-left">{t('student.lastName')}</SortHeader>
                  <SortHeader col="firstName" className="text-left">{t('student.firstName')}</SortHeader>
                  <SortHeader col="className" className="text-left">{t('student.className')}</SortHeader>
                  <SortHeader col="gender" className="text-left">{t('student.gender')}</SortHeader>
                  <SortHeader col="_count.needs" className="text-right">{t('needs.title')}</SortHeader>
                  <SortHeader col="_count.sponsorships" className="text-right">{t('sponsors.title')}</SortHeader>
                </tr></thead>
                <tbody>
                  {sortedStudents.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-500">{s.studentNo}</td>
                      <td className="py-3 px-3 text-sm font-medium">
                        <Link href={`/students/${s.id}`} className="text-primary-600 hover:text-primary-700 hover:underline">{s.lastName}</Link>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.className || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '-'}</td>
                      <td className="py-3 px-3 text-sm text-right">
                        {s._count.needs > 0 ? <span className="badge badge-red">{s._count.needs}</span> : <span className="text-gray-400">0</span>}
                      </td>
                      <td className="py-3 px-3 text-sm text-right">
                        {s._count.sponsorships > 0 ? <span className="badge badge-green">{s._count.sponsorships}</span> : <span className="text-gray-400">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sponsors tab */}
        {activeTab === 'sponsors' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('sponsors.title')} ({sponsors.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <SortHeader col="lastName" className="text-left">{t('student.lastName')}</SortHeader>
                  <SortHeader col="firstName" className="text-left">{t('student.firstName')}</SortHeader>
                  <SortHeader col="email" className="text-left">{t('sponsors.email')}</SortHeader>
                  <SortHeader col="phone" className="text-left">{t('sponsors.phone')}</SortHeader>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('nav.students')}</th>
                </tr></thead>
                <tbody>
                  {sortedSponsors.map((sp: any) => (
                    <tr key={sp.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">{sp.lastName}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{sp.firstName}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{sp.email}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{sp.phone || '-'}</td>
                      <td className="py-3 px-3 text-sm">
                        {sp.sponsorships?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sp.sponsorships.map((s: any, i: number) => (
                              <span key={i} className="badge badge-green">{s.student.firstName} {s.student.lastName}</span>
                            ))}
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments tab */}
        {activeTab === 'payments' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('payments.title')} ({recentPayments.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <SortHeader col="paymentDate" className="text-left">{t('payments.paymentDate')}</SortHeader>
                  <SortHeader col="amount" className="text-left">{t('payments.amount')}</SortHeader>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('student.firstName')}</th>
                  <SortHeader col="notes" className="text-left">{t('payments.notes')}</SortHeader>
                  <SortHeader col="source" className="text-left">{t('payments.source')}</SortHeader>
                </tr></thead>
                <tbody>
                  {sortedPayments.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-900">{formatDate(p.paymentDate, locale)}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 font-medium">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-3 text-sm">
                        {p.student ? (
                          <Link href={`/students/${p.student.id}`} className="text-primary-600 hover:underline">{p.student.firstName} {p.student.lastName}</Link>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-500">{p.notes || '-'}</td>
                      <td className="py-3 px-3 text-sm"><span className={`badge ${p.source === 'bank_import' ? 'badge-yellow' : 'badge-green'}`}>{p.source === 'bank_import' ? t('payments.bankImport') : t('payments.manual')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students needing attention tab */}
        {activeTab === 'needs' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.studentsNeedingAttention')} ({studentsWithNeeds.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <SortHeader col="studentNo" className="text-left">{t('student.studentNo')}</SortHeader>
                  <SortHeader col="lastName" className="text-left">{t('student.lastName')}</SortHeader>
                  <SortHeader col="firstName" className="text-left">{t('student.firstName')}</SortHeader>
                  <SortHeader col="className" className="text-left">{t('student.className')}</SortHeader>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('needs.title')}</th>
                </tr></thead>
                <tbody>
                  {sortedNeeds.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-500">{s.studentNo}</td>
                      <td className="py-3 px-3 text-sm font-medium">
                        <Link href={`/students/${s.id}`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.className || '-'}</td>
                      <td className="py-3 px-3 text-sm">
                        <div className="space-y-1">
                          {s.needs.map((n: any) => (
                            <div key={n.id} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                              <span className="text-gray-700">{n.description}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
