import Link from 'next/link'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { formatDate, fmtCurrency } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'
import { CURRENCIES } from '@/lib/constants'

interface SponsorPaymentsTabProps {
  student: any
  canEditData: boolean
  paymentTypes: any[]
  allSponsors: any[]
  showAddPayment: boolean
  setShowAddPayment: (v: boolean) => void
  newPayment: { paymentDate: string; amount: string; currency: string; paymentType: string; sponsorId: string; notes: string }
  setNewPayment: (v: any) => void
  addSponsorPayment: () => void
  deleteSponsorPayment: (paymentId: string) => void
  locale: Locale
  t: (key: string) => string
}

export function SponsorPaymentsTab({
  student, canEditData, paymentTypes, allSponsors,
  showAddPayment, setShowAddPayment, newPayment, setNewPayment,
  addSponsorPayment, deleteSponsorPayment, locale, t
}: SponsorPaymentsTabProps) {

  const ptLabel = (type: string) => {
    const found = paymentTypes.find((pt: any) => pt.name === type)
    return found ? getLocaleName(found, locale) : type
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('sponsorPayments.title')}</h3>
        </div>
        {canEditData && <button onClick={() => { setNewPayment({ ...newPayment, sponsorId: student.sponsorships?.[0]?.sponsor?.id || '' }); setShowAddPayment(true) }} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('app.add')}</button>}
      </div>
      {showAddPayment && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <input type="date" value={newPayment.paymentDate} onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <select value={newPayment.paymentType} onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
              <option value="">{t('sponsorPayments.selectType')}</option>{paymentTypes.map((pt: any) => <option key={pt.id} value={pt.name}>{getLocaleName(pt, locale)}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} placeholder={t('vouchers.amount')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
              <select value={newPayment.currency} onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })} className="px-2 py-2 rounded-lg border border-gray-300 text-sm w-20">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <select value={newPayment.sponsorId} onChange={(e) => setNewPayment({ ...newPayment, sponsorId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
              <option value="">{t('sponsorPayments.selectSponsor')}</option>
              {allSponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
            </select>
            <div className="sm:col-span-2 lg:col-span-2"><input type="text" value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} placeholder={t('student.notes')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" /></div>
          </div>
          <div className="flex gap-2"><button onClick={addSponsorPayment} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button><button onClick={() => setShowAddPayment(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
        </div>
      )}
      {student.sponsorPayments?.length > 0 ? (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200 dark:border-gray-600">
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('payments.paymentDate')}</th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('sponsorPayments.paymentType')}</th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('vouchers.amount')}</th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('sponsors.title')}</th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('student.notes')}</th>
          {canEditData && <th className="w-10"></th>}
        </tr></thead><tbody>
          {student.sponsorPayments.map((p: any) => (
            <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700">
              <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(p.paymentDate, locale)}</td>
              <td className="py-3 px-2 text-sm"><span className={`badge ${p.paymentType === 'tuition' ? 'badge-green' : p.paymentType === 'medical' ? 'badge-yellow' : 'badge-red'}`}>{ptLabel(p.paymentType)}</span></td>
              <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100 font-medium">{fmtCurrency(p.amount, p.currency)}</td>
              <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{p.sponsor ? <Link href={`/sponsors?search=${encodeURIComponent(p.sponsor.lastName)}&from=${encodeURIComponent(`/students/${student.id}?tab=sponsorPayments`)}`} className="text-accent-600 dark:text-accent-400 hover:underline">{p.sponsor.firstName} {p.sponsor.lastName}</Link> : '-'}</td>
              <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{p.notes || '-'}</td>
              {canEditData && <td className="py-3 px-2 text-right"><button aria-label="Smazat" onClick={() => deleteSponsorPayment(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>}
            </tr>
          ))}
        </tbody></table></div>
      ) : <div className="text-center py-12"><CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p className="text-gray-500 dark:text-gray-400">{t('app.noData')}</p></div>}
    </div>
  )
}
