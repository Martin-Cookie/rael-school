'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreditCard, Ticket } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

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

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(data => {
      setSponsorPayments(data.sponsorPayments || [])
      setVoucherPurchases(data.voucherPurchases || [])
      setStats(data.stats)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  const spByCur = stats?.sponsorPaymentsByCurrency || {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('payments.title')}</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('sponsor')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sponsor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <CreditCard className="w-4 h-4" /> {t('sponsorPayments.title')} ({sponsorPayments.length})
        </button>
        <button onClick={() => setActiveTab('voucher')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'voucher' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Ticket className="w-4 h-4" /> {t('vouchers.purchases')} ({voucherPurchases.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('payments.paymentDate')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('sponsorPayments.paymentType')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('payments.amount')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('nav.students')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('sponsors.title')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('payments.notes')}</th>
            </tr></thead><tbody>
              {sponsorPayments.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 text-sm text-gray-900">{formatDate(p.paymentDate, locale)}</td>
                  <td className="py-3 px-3 text-sm"><span className={`badge ${p.paymentType === 'tuition' ? 'badge-green' : p.paymentType === 'medical' ? 'badge-yellow' : 'badge-red'}`}>{p.paymentType === 'tuition' ? t('sponsorPayments.tuition') : p.paymentType === 'medical' ? t('sponsorPayments.medical') : t('sponsorPayments.other')}</span></td>
                  <td className="py-3 px-3 text-sm text-gray-900 font-medium">{fmtCurrency(p.amount, p.currency)}</td>
                  <td className="py-3 px-3 text-sm">{p.student ? <Link href={`/students/${p.student.id}`} className="text-primary-600 hover:underline">{p.student.firstName} {p.student.lastName}</Link> : '-'}</td>
                  <td className="py-3 px-3 text-sm text-gray-700">{p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : '-'}</td>
                  <td className="py-3 px-3 text-sm text-gray-500">{p.notes || '-'}</td>
                </tr>
              ))}
              {sponsorPayments.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
            </tbody></table></div>
          </div>
        )}

        {activeTab === 'voucher' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl px-5 py-3">
                <p className="text-xs text-blue-600 font-medium">{t('vouchers.totalAmount')}</p>
                <p className="text-xl font-bold text-blue-900">{fmtCurrency(stats?.voucherTotalAmount || 0, 'KES')}</p>
              </div>
              <div className="bg-primary-50 rounded-xl px-5 py-3">
                <p className="text-xs text-primary-600 font-medium">{t('vouchers.totalPurchased')}</p>
                <p className="text-xl font-bold text-primary-900">{formatNumber(voucherPurchases.reduce((s: number, v: any) => s + v.count, 0))}</p>
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.purchaseDate')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.amount')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.count')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('nav.students')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.donorName')}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('payments.notes')}</th>
            </tr></thead><tbody>
              {voucherPurchases.map((v: any) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 text-sm text-gray-900">{formatDate(v.purchaseDate, locale)}</td>
                  <td className="py-3 px-3 text-sm text-gray-900 font-medium">{fmtCurrency(v.amount, 'KES')}</td>
                  <td className="py-3 px-3 text-sm text-gray-900">{formatNumber(v.count)}</td>
                  <td className="py-3 px-3 text-sm">{v.student ? <Link href={`/students/${v.student.id}`} className="text-primary-600 hover:underline">{v.student.firstName} {v.student.lastName}</Link> : '-'}</td>
                  <td className="py-3 px-3 text-sm text-gray-700">{v.donorName || '-'}</td>
                  <td className="py-3 px-3 text-sm text-gray-500">{v.notes || '-'}</td>
                </tr>
              ))}
              {voucherPurchases.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
            </tbody></table></div>
          </div>
        )}
      </div>
    </div>
  )
}
