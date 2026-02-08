'use client'

import { useState, useEffect } from 'react'
import { Users, Heart, CreditCard, HandHeart, AlertCircle } from 'lucide-react'
import { formatNumber, formatCurrency, formatDate } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')

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
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: t('dashboard.totalStudents'), value: formatNumber(stats?.totalStudents || 0), icon: Users, color: 'bg-primary-50 text-primary-600' },
    { label: t('dashboard.activeSponsors'), value: formatNumber(stats?.activeSponsors || 0), icon: HandHeart, color: 'bg-accent-50 text-accent-600' },
    { label: t('dashboard.totalPayments'), value: formatCurrency(stats?.totalPayments || 0), icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
    { label: t('dashboard.studentsNeedingAttention'), value: formatNumber(stats?.unfulfilledNeeds || 0), icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.title')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentPayments')}</h2>
        {recentPayments.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('app.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">{t('payments.paymentDate')}</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">{t('student.firstName')}</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">{t('payments.amount')}</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">{t('payments.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment: any) => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{formatDate(payment.paymentDate, locale)}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
