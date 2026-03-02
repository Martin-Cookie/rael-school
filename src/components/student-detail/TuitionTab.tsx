import Link from 'next/link'
import { FileText } from 'lucide-react'
import { formatDate, fmtCurrency } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'

interface TuitionTabProps {
  student: any
  tuitionCharges: any[]
  locale: Locale
  t: (key: string) => string
}

export function TuitionTab({ student, tuitionCharges, locale, t }: TuitionTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('tuition.charges')}</h3>
        </div>
        {tuitionCharges.length > 0 ? (
          <>
            {/* Summary bar */}
            {(() => {
              const totalCharged = tuitionCharges.reduce((s: number, c: any) => s + c.amount, 0)
              const totalPaid = tuitionCharges.reduce((s: number, c: any) => s + (c.paidAmount || 0), 0)
              const totalRemaining = tuitionCharges.reduce((s: number, c: any) => s + (c.remainingAmount || 0), 0)
              const pct = totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 0
              return (
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('tuition.totalPaid')}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmtCurrency(totalPaid, tuitionCharges[0]?.currency || 'CZK')} / {fmtCurrency(totalCharged, tuitionCharges[0]?.currency || 'CZK')}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  {totalRemaining > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('tuition.totalRemaining')}</p>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{fmtCurrency(totalRemaining, tuitionCharges[0]?.currency || 'CZK')}</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </>
        ) : <div className="text-center py-12"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p className="text-gray-500 dark:text-gray-400">{t('tuition.noCharges')}</p></div>}
      </div>

      {/* Charge cards */}
      {tuitionCharges.map((c: any) => {
        const paidAmt = c.paidAmount || 0
        const remainingAmt = c.remainingAmount || 0
        const pct = c.amount > 0 ? Math.round((paidAmt / c.amount) * 100) : 0
        const rateName = c.rateName ? getLocaleName({ name: c.rateName, nameEn: c.rateNameEn, nameSw: c.rateNameSw }, locale) : null
        return (
          <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            {/* Card header: name + period + status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {rateName || t('tuition.charges')}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">&bull;</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{c.period}</span>
              </div>
              <span className={`badge ${c.status === 'PAID' ? 'badge-green' : c.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                {c.status === 'PAID' ? t('tuition.statusPaid') : c.status === 'PARTIAL' ? t('tuition.statusPartial') : t('tuition.statusUnpaid')}
              </span>
            </div>

            {/* Three amounts side by side */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('tuition.charged')}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmtCurrency(c.amount, c.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('tuition.paid')}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmtCurrency(paidAmt, c.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('tuition.remaining')}</p>
                <p className={`text-sm font-semibold ${remainingAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>{fmtCurrency(remainingAmt, c.currency)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>

            {/* Notes */}
            {c.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{c.notes}</p>}

            {/* Related payments */}
            {c.payments?.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('tuition.relatedPayments')}</p>
                {c.payments.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className="text-gray-400 dark:text-gray-500">{p.paymentDate ? formatDate(p.paymentDate, locale) : ''}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmtCurrency(p.amount, c.currency)}</span>
                    {p.paymentType && <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{p.paymentType}</span>}
                    {p.sponsor && (
                      <Link href={`/sponsors?search=${encodeURIComponent(p.sponsor.lastName)}&from=${encodeURIComponent(`/students/${student.id}?tab=tuition`)}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                        {p.sponsor.lastName} {p.sponsor.firstName}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
