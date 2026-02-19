'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Users, CreditCard, HandHeart, AlertCircle, ChevronUp, ChevronDown, ArrowUpDown, GraduationCap, Ticket, FileText } from 'lucide-react'

import { formatNumber, formatDate, calculateAge } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type DashTab = 'students' | 'sponsors' | 'payments' | 'needs' | 'classes' | 'tuition'
type SortDir = 'asc' | 'desc'

function fmtCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [sponsorPayments, setSponsorPayments] = useState<any[]>([])
  const [voucherPurchases, setVoucherPurchases] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [studentsWithNeeds, setStudentsWithNeeds] = useState<any[]>([])
  const [tuitionCharges, setTuitionCharges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [activeTab, setActiveTab] = useState<DashTab>('students')
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [theadTop, setTheadTop] = useState(0)
  const prevTabRef = useRef<DashTab | null>(null)
  const [paymentSubTab, setPaymentSubTab] = useState<'sponsor' | 'voucher'>('sponsor')

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
    fetch('/api/dashboard').then(r => r.json()).then(data => {
      setStats(data.stats)
      setRecentPayments(data.recentPayments || [])
      setSponsorPayments(data.sponsorPayments || [])
      setVoucherPurchases(data.voucherPurchases || [])
      setStudents(data.students || [])
      setSponsors(data.sponsors || [])
      setStudentsWithNeeds(data.studentsWithNeeds || [])
      setTuitionCharges(data.tuitionCharges || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va = col.startsWith('_count.') ? a._count?.[col.replace('_count.', '')] ?? 0 : col.includes('.') ? col.split('.').reduce((o: any, k: string) => o?.[k], a) : a[col]
      let vb = col.startsWith('_count.') ? b._count?.[col.replace('_count.', '')] ?? 0 : col.includes('.') ? col.split('.').reduce((o: any, k: string) => o?.[k], b) : b[col]
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  const classNames = [...new Set(students.map((s: any) => s.className).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) as string[]

  // Build payment summary string for the card
  const spByCur = stats?.sponsorPaymentsByCurrency || {}
  const paymentSummaryParts: string[] = []
  Object.keys(spByCur).sort().forEach(cur => {
    paymentSummaryParts.push(fmtCurrency(spByCur[cur], cur))
  })
  const paymentSummary = paymentSummaryParts.length > 0 ? paymentSummaryParts.join(' | ') : '0'

  const voucherSummary = fmtCurrency(stats?.voucherTotalAmount || 0, 'KES')

  const maleCount = students.filter((s: any) => s.gender === 'M').length
  const femaleCount = students.filter((s: any) => s.gender === 'F').length

  const statCards = [
    { key: 'students' as DashTab, label: t('dashboard.totalStudents'), value: formatNumber(stats?.totalStudents || 0), subtitle: `${formatNumber(maleCount)} ${t('student.male')} / ${formatNumber(femaleCount)} ${t('student.female')}`, icon: Users, color: 'bg-primary-50 text-primary-600', borderColor: 'border-primary-200' },
    { key: 'sponsors' as DashTab, label: t('dashboard.activeSponsors'), value: formatNumber(stats?.activeSponsors || 0), icon: HandHeart, color: 'bg-accent-50 text-accent-600', borderColor: 'border-accent-200' },
    { key: 'payments' as DashTab, label: t('sponsorPayments.title'), value: paymentSummary, icon: CreditCard, color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-200' },
    { key: 'needs' as DashTab, label: t('dashboard.studentsNeedingAttention'), value: formatNumber(stats?.unfulfilledNeeds || 0), icon: AlertCircle, color: 'bg-red-50 text-red-600', borderColor: 'border-red-200' },
    { key: 'classes' as DashTab, label: t('dashboard.classOverview'), value: formatNumber(classNames.length), icon: GraduationCap, color: 'bg-purple-50 text-purple-600', borderColor: 'border-purple-200' },
    { key: 'tuition' as DashTab, label: t('tuition.charges'), value: formatNumber(stats?.tuitionTotalCharges || 0), subtitle: `${formatNumber(stats?.tuitionPaidCount || 0)} ${t('tuition.statusPaid').toLowerCase()} / ${formatNumber(stats?.tuitionUnpaidCount || 0)} ${t('tuition.statusUnpaid').toLowerCase()}`, icon: FileText, color: 'bg-emerald-50 text-emerald-600', borderColor: 'border-emerald-200' },
  ]

  return (
    <div>
      <div ref={stickyRef} className="sticky top-16 lg:top-0 z-30 bg-[#fafaf8] dark:bg-gray-900 pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 pt-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('dashboard.title')}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(card => (
            <button key={card.key} onClick={() => { setActiveTab(card.key); prevTabRef.current = null; setSortCol(''); setSelectedClass(null) }} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 card-hover text-left transition-all ${activeTab === card.key ? card.borderColor : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <div className="flex items-start justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>{'subtitle' in card && card.subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.subtitle}</p>}</div><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}><card.icon className="w-5 h-5" /></div></div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">

        {/* Students */}
        {activeTab === 'students' && (
          <div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('student.list')} ({students.length})</h2>
          <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
            <SH col="studentNo" className="text-left">{t('student.studentNo')}</SH>
            <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
            <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
            <SH col="className" className="text-left">{t('student.className')}</SH>
            <SH col="gender" className="text-left">{t('student.gender')}</SH>
            <SH col="_count.needs" className="text-right">{t('needs.title')}</SH>
            <SH col="_count.sponsorships" className="text-right">{t('sponsors.title')}</SH>
          </tr></thead><tbody>
            {sortData(students, sortCol).map((s: any) => (
              <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">{s.studentNo}</td>
                <td className="py-3 px-3 text-sm font-medium"><Link href={`/students/${s.id}?from=/dashboard`} className="text-primary-600 hover:underline">{s.lastName}</Link></td>
                <td className="py-3 px-3 text-sm"><Link href={`/students/${s.id}?from=/dashboard`} className="text-primary-600 hover:underline">{s.firstName}</Link></td>
                <td className="py-3 px-3 text-sm">{s.className ? <button onClick={() => { prevTabRef.current = activeTab; setActiveTab('classes'); setSelectedClass(s.className); setSortCol('') }} className="text-primary-600 hover:underline">{s.className}</button> : '-'}</td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '-'}</td>
                <td className="py-3 px-3 text-sm text-right">{s._count.needs > 0 ? <span className="badge badge-red">{s._count.needs}</span> : <span className="text-gray-400">0</span>}</td>
                <td className="py-3 px-3 text-sm text-right">{s._count.sponsorships > 0 ? <span className="badge badge-green">{s._count.sponsorships}</span> : <span className="text-gray-400">0</span>}</td>
              </tr>
            ))}
          </tbody></table>
          </div>
        )}

        {/* Sponsors */}
        {activeTab === 'sponsors' && (
          <div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('sponsors.title')} ({sponsors.length})</h2>
          <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
            <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
            <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
            <SH col="email" className="text-left">{t('sponsors.email')}</SH>
            <SH col="phone" className="text-left">{t('sponsors.phone')}</SH>
            <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('nav.students')}</th>
          </tr></thead><tbody>
            {sortData(sponsors, sortCol).map((sp: any) => (
              <tr key={sp.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-3 text-sm font-medium"><Link href={`/sponsors?search=${encodeURIComponent(sp.lastName)}&from=/dashboard`} className="text-primary-600 hover:underline">{sp.lastName}</Link></td>
                <td className="py-3 px-3 text-sm"><Link href={`/sponsors?search=${encodeURIComponent(sp.lastName)}&from=/dashboard`} className="text-primary-600 hover:underline">{sp.firstName}</Link></td>
                <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-400">{sp.email}</td>
                <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-400">{sp.phone || '-'}</td>
                <td className="py-3 px-3 text-sm">
                  {sp.sponsorships?.length > 0 ? <div className="flex flex-wrap gap-1">{sp.sponsorships.map((s: any, i: number) => (
                    <Link key={i} href={`/students/${s.student?.id || ''}?from=/dashboard`} className="badge badge-green hover:opacity-80">{s.student.firstName} {s.student.lastName}</Link>
                  ))}</div> : <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))}
          </tbody></table>
          </div>
        )}

        {/* Payments - split into sponsor payments and voucher purchases */}
        {activeTab === 'payments' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('payments.title')}</h2>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button onClick={() => { setPaymentSubTab('sponsor'); setSortCol('') }} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${paymentSubTab === 'sponsor' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  {t('sponsorPayments.title')} ({sponsorPayments.length})
                </button>
                <button onClick={() => { setPaymentSubTab('voucher'); setSortCol('') }} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${paymentSubTab === 'voucher' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  {t('vouchers.purchases')} ({voucherPurchases.length})
                </button>
              </div>
            </div>

            {/* Summary cards */}
            {paymentSubTab === 'sponsor' && (
              <>
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.keys(spByCur).sort().map(cur => (
                    <div key={cur} className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{cur}</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatNumber(spByCur[cur])}</p>
                    </div>
                  ))}
                  {Object.keys(spByCur).length === 0 && <p className="text-gray-400 text-sm">{t('app.noData')}</p>}
                </div>
                <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
                  <SH col="paymentDate" className="text-left">{t('payments.paymentDate')}</SH>
                  <SH col="paymentType" className="text-left">{t('sponsorPayments.paymentType')}</SH>
                  <SH col="amount" className="text-left">{t('payments.amount')}</SH>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('nav.students')}</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('sponsors.title')}</th>
                  <SH col="notes" className="text-left">{t('payments.notes')}</SH>
                </tr></thead><tbody>
                  {sortData(sponsorPayments, sortCol).map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(p.paymentDate, locale)}</td>
                      <td className="py-3 px-3 text-sm"><span className={`badge ${p.paymentType === 'tuition' ? 'badge-green' : p.paymentType === 'medical' ? 'badge-yellow' : 'badge-red'}`}>{p.paymentType === 'tuition' ? t('sponsorPayments.tuition') : p.paymentType === 'medical' ? t('sponsorPayments.medical') : t('sponsorPayments.other')}</span></td>
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{fmtCurrency(p.amount, p.currency)}</td>
                      <td className="py-3 px-3 text-sm">{p.student ? <Link href={`/students/${p.student.id}?from=/dashboard`} className="text-primary-600 hover:underline">{p.student.firstName} {p.student.lastName}</Link> : '-'}</td>
                      <td className="py-3 px-3 text-sm">{p.sponsor ? <Link href={`/sponsors?search=${encodeURIComponent(p.sponsor.lastName)}&from=/dashboard`} className="text-primary-600 hover:underline">{p.sponsor.firstName} {p.sponsor.lastName}</Link> : '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">{p.notes || '-'}</td>
                    </tr>
                  ))}
                  {sponsorPayments.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
                </tbody></table>
              </>
            )}

            {paymentSubTab === 'voucher' && (
              <>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('vouchers.totalAmount')}</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{fmtCurrency(stats?.voucherTotalAmount || 0, 'KES')}</p>
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl px-4 py-3">
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{t('vouchers.totalPurchased')}</p>
                    <p className="text-lg font-bold text-primary-900 dark:text-primary-100">{formatNumber(voucherPurchases.reduce((s: number, v: any) => s + v.count, 0))}</p>
                  </div>
                </div>
                <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
                  <SH col="purchaseDate" className="text-left">{t('vouchers.purchaseDate')}</SH>
                  <SH col="amount" className="text-left">{t('vouchers.amount')}</SH>
                  <SH col="count" className="text-left">{t('vouchers.count')}</SH>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('nav.students')}</th>
                  <SH col="donorName" className="text-left">{t('vouchers.donorName')}</SH>
                  <SH col="notes" className="text-left">{t('payments.notes')}</SH>
                </tr></thead><tbody>
                  {sortData(voucherPurchases, sortCol).map((v: any) => (
                    <tr key={v.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(v.purchaseDate, locale)}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{fmtCurrency(v.amount, 'KES')}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{formatNumber(v.count)}</td>
                      <td className="py-3 px-3 text-sm">{v.student ? <Link href={`/students/${v.student.id}?from=/dashboard`} className="text-primary-600 hover:underline">{v.student.firstName} {v.student.lastName}</Link> : '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-700 dark:text-gray-300">{v.donorName || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">{v.notes || '-'}</td>
                    </tr>
                  ))}
                  {voucherPurchases.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
                </tbody></table>
              </>
            )}
          </div>
        )}

        {/* Needs */}
        {activeTab === 'needs' && (
          <div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.studentsNeedingAttention')} ({studentsWithNeeds.length})</h2>
          <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
            <SH col="studentNo" className="text-left">{t('student.studentNo')}</SH>
            <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
            <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
            <SH col="className" className="text-left">{t('student.className')}</SH>
            <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('needs.title')}</th>
          </tr></thead><tbody>
            {sortData(studentsWithNeeds, sortCol).map((s: any) => (
              <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">{s.studentNo}</td>
                <td className="py-3 px-3 text-sm font-medium"><Link href={`/students/${s.id}?from=/dashboard`} className="text-primary-600 hover:underline">{s.lastName}</Link></td>
                <td className="py-3 px-3 text-sm"><Link href={`/students/${s.id}?from=/dashboard`} className="text-primary-600 hover:underline">{s.firstName}</Link></td>
                <td className="py-3 px-3 text-sm">{s.className ? <button onClick={() => { prevTabRef.current = activeTab; setActiveTab('classes'); setSelectedClass(s.className); setSortCol('') }} className="text-primary-600 hover:underline">{s.className}</button> : '-'}</td>
                <td className="py-3 px-3 text-sm"><div className="space-y-1">{s.needs.map((n: any) => <div key={n.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span><span className="text-gray-700 dark:text-gray-300">{n.description}</span></div>)}</div></td>
              </tr>
            ))}
          </tbody></table>
          </div>
        )}

        {/* Tuition */}
        {activeTab === 'tuition' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('tuition.title')} ({tuitionCharges.length})</h2>
            {/* Summary cards */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-4 py-3">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('tuition.statusPaid')}</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{formatNumber(stats?.tuitionPaidCount || 0)}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('tuition.statusPartial')}</p>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{formatNumber(stats?.tuitionPartialCount || 0)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{t('tuition.statusUnpaid')}</p>
                <p className="text-lg font-bold text-red-900 dark:text-red-100">{formatNumber(stats?.tuitionUnpaidCount || 0)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('tuition.totalCharged')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmtCurrency(stats?.tuitionTotalCharged || 0, 'CZK')}</p>
              </div>
            </div>
            <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
              <SH col="student.lastName" className="text-left">{t('tuition.student')}</SH>
              <SH col="student.className" className="text-left">{t('tuition.class')}</SH>
              <SH col="period" className="text-left">{t('tuition.period')}</SH>
              <SH col="amount" className="text-left">{t('tuition.amount')}</SH>
              <SH col="status" className="text-left">{t('tuition.status')}</SH>
            </tr></thead><tbody>
              {sortData(tuitionCharges, sortCol).map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-3 text-sm font-medium">{c.student ? <Link href={`/students/${c.student.id}?from=/dashboard`} className="text-primary-600 hover:underline">{c.student.lastName} {c.student.firstName}</Link> : '-'}</td>
                  <td className="py-3 px-3 text-sm">{c.student?.className ? <button onClick={() => { prevTabRef.current = activeTab; setActiveTab('classes'); setSelectedClass(c.student.className); setSortCol('') }} className="text-primary-600 hover:underline">{c.student.className}</button> : '-'}</td>
                  <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{c.period}</td>
                  <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{fmtCurrency(c.amount, c.currency)}</td>
                  <td className="py-3 px-3 text-sm">
                    <span className={`badge ${c.status === 'PAID' ? 'badge-green' : c.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                      {c.status === 'PAID' ? t('tuition.statusPaid') : c.status === 'PARTIAL' ? t('tuition.statusPartial') : t('tuition.statusUnpaid')}
                    </span>
                  </td>
                </tr>
              ))}
              {tuitionCharges.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500 text-sm">{t('tuition.noCharges')}</td></tr>}
            </tbody></table>
          </div>
        )}

        {/* Classes */}
        {activeTab === 'classes' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.classOverview')}</h2>
            {!selectedClass ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {classNames.map(cn => {
                  const count = students.filter((s: any) => s.className === cn).length
                  return (
                    <button key={cn} onClick={() => { setSelectedClass(cn) }} className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 text-left transition-colors">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{cn}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{count} {locale === 'cs' ? 'studentů' : locale === 'sw' ? 'wanafunzi' : 'students'}</p>
                    </button>
                  )
                })}
                {classNames.length === 0 && <p className="text-gray-500 text-sm col-span-full text-center py-8">{t('app.noData')}</p>}
              </div>
            ) : (
              <div>
                <button onClick={() => { if (prevTabRef.current) { const tab = prevTabRef.current; prevTabRef.current = null; setSelectedClass(null); setSortCol(''); setActiveTab(tab) } else { setSelectedClass(null) } }} className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4">← {prevTabRef.current ? t('app.back') : t('dashboard.classOverview')}</button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{selectedClass} ({students.filter((s: any) => s.className === selectedClass).length})</h3>
                <table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
                  <SH col="studentNo" className="text-left">{t('student.studentNo')}</SH>
                  <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
                  <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
                  <SH col="gender" className="text-left">{t('student.gender')}</SH>
                  <SH col="_count.needs" className="text-right">{t('needs.title')}</SH>
                </tr></thead><tbody>
                  {sortData(students.filter((s: any) => s.className === selectedClass), sortCol).map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">{s.studentNo}</td>
                      <td className="py-3 px-3 text-sm font-medium"><Link href={`/students/${s.id}?from=/dashboard`} className="text-primary-600 hover:underline">{s.lastName}</Link></td>
                      <td className="py-3 px-3 text-sm"><Link href={`/students/${s.id}?from=/dashboard`} className="text-primary-600 hover:underline">{s.firstName}</Link></td>
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-gray-100">{s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '-'}</td>
                      <td className="py-3 px-3 text-sm text-right">{s._count.needs > 0 ? <span className="badge badge-red">{s._count.needs}</span> : <span className="text-gray-400">0</span>}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
