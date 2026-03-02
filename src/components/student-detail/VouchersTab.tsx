import Link from 'next/link'
import { Ticket, Plus, Trash2 } from 'lucide-react'
import { formatDate, formatNumber, fmtCurrency } from '@/lib/format'
import { CURRENCIES } from '@/lib/constants'

interface VouchersTabProps {
  student: any
  canEditData: boolean
  allSponsors: any[]
  totalPurchased: number
  totalUsed: number
  totalsByCurrency: Record<string, number>
  available: number
  showAddVoucher: boolean
  setShowAddVoucher: (v: boolean) => void
  newVoucher: any
  setNewVoucher: (v: any) => void
  defaultDonor: string
  addVoucher: () => void
  deleteVoucher: (voucherId: string, type: 'purchase' | 'usage') => void
  getVoucherRate: (cur: string) => number | null
  locale: string  // VouchersTab doesn't use getLocaleName, so string is fine
  t: (key: string) => string
}

export function VouchersTab({
  student, canEditData, allSponsors, totalPurchased, totalUsed,
  totalsByCurrency, available, showAddVoucher, setShowAddVoucher,
  newVoucher, setNewVoucher, defaultDonor, addVoucher, deleteVoucher,
  getVoucherRate, locale, t
}: VouchersTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('vouchers.totalAmount')}</p>
          {Object.keys(totalsByCurrency).length > 0 ? Object.entries(totalsByCurrency).map(([cur, amt]) => (
            <p key={cur} className="text-xl font-bold text-blue-900 dark:text-blue-300">{fmtCurrency(amt, cur)}</p>
          )) : <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{fmtCurrency(0, 'CZK')}</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{t('vouchers.totalPurchased')}</p>
          <p className="text-xl font-bold text-primary-900 dark:text-primary-300">{formatNumber(totalPurchased)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-accent-600 dark:text-accent-400 font-medium">{t('vouchers.totalUsed')}</p>
          <p className="text-xl font-bold text-accent-900 dark:text-accent-300">{formatNumber(totalUsed)}</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm ${available > 0 ? 'border-primary-200 dark:border-primary-700' : 'border-red-200 dark:border-red-700'}`}>
          <p className={`text-xs font-medium ${available > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>{t('vouchers.available')}</p>
          <p className={`text-xl font-bold ${available > 0 ? 'text-primary-900 dark:text-primary-300' : 'text-red-900 dark:text-red-300'}`}>{formatNumber(available)}</p>
        </div>
      </div>

      {/* Voucher tables card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('vouchers.title')}</h3>
          </div>
          {canEditData && <button onClick={() => { setNewVoucher({ ...newVoucher, donorName: defaultDonor, sponsorId: '' }); setShowAddVoucher(true) }} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('app.add')}</button>}
        </div>
        {showAddVoucher && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <select aria-label="Typ stravenky" value={newVoucher.type} onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none"><option value="purchase">{t('vouchers.addPurchase')}</option><option value="usage">{t('vouchers.addUsage')}</option></select>
              <input aria-label="Datum" type="date" value={newVoucher.date} onChange={(e) => setNewVoucher({ ...newVoucher, date: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
              {newVoucher.type === 'purchase' && (
                <div className="flex gap-2">
                  <input aria-label="Castka" type="number" value={newVoucher.amount} onChange={(e) => {
                    const amt = e.target.value
                    const rate = getVoucherRate(newVoucher.currency)
                    const autoCount = (amt && rate) ? String(Math.floor(parseFloat(amt) / rate)) : ''
                    setNewVoucher({ ...newVoucher, amount: amt, count: autoCount })
                  }} placeholder={t('vouchers.amount')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
                  <select aria-label="Mena" value={newVoucher.currency} onChange={(e) => {
                    const cur = e.target.value
                    const rate = getVoucherRate(cur)
                    const autoCount = (newVoucher.amount && rate) ? String(Math.floor(parseFloat(newVoucher.amount) / rate)) : ''
                    setNewVoucher({ ...newVoucher, currency: cur, count: autoCount })
                  }} className="w-20 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <input aria-label="Pocet stravenek" type="number" value={newVoucher.count} onChange={(e) => setNewVoucher({ ...newVoucher, count: e.target.value })} placeholder={t('vouchers.count')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
              {newVoucher.type === 'purchase' && (
                <div className="sm:col-span-2">
                  <label htmlFor="newVoucherSponsor" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vouchers.donorName')}</label>
                  <select id="newVoucherSponsor" value={newVoucher.sponsorId} onChange={(e) => {
                    const sp = allSponsors.find((s: any) => s.id === e.target.value)
                    if (sp) {
                      setNewVoucher({ ...newVoucher, sponsorId: sp.id, donorName: `${sp.firstName} ${sp.lastName}` })
                    } else {
                      setNewVoucher({ ...newVoucher, sponsorId: '', donorName: '' })
                    }
                  }} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
                    <option value="">{t('vouchers.selectSponsor')}</option>
                    {allSponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}{s.email ? ` (${s.email})` : ''}</option>)}
                  </select>
                </div>
              )}
            </div>
            <input aria-label="Poznamky" type="text" value={newVoucher.notes} onChange={(e) => setNewVoucher({ ...newVoucher, notes: e.target.value })} placeholder={t('student.notes')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none mb-3" />
            <div className="flex gap-2">
              <button onClick={addVoucher} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
              <button onClick={() => setShowAddVoucher(false)} className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">{t('app.cancel')}</button>
            </div>
          </div>
        )}
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('vouchers.purchases')}</h4>
        <div className="overflow-x-auto mb-6">
          <table className="w-full table-fixed"><thead><tr className="border-b border-gray-200 dark:border-gray-600">
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-28">{t('vouchers.purchaseDate')}</th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-28">{t('vouchers.amount')}</th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-20">{t('vouchers.count')}</th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('vouchers.donorName')}</th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('student.notes')}</th>
            {canEditData && <th className="w-10"></th>}
          </tr></thead><tbody>
            {student.vouchers?.map((v: any) => (
              <tr key={v.id} className="border-b border-gray-50 dark:border-gray-700">
                <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(v.purchaseDate, locale)}</td>
                <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{fmtCurrency(v.amount, v.currency || 'CZK')}</td>
                <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatNumber(v.count)}</td>
                <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{v.sponsor ? <Link href={`/sponsors?search=${encodeURIComponent(v.sponsor.lastName)}&from=${encodeURIComponent(`/students/${student.id}?tab=vouchers`)}`} className="text-accent-600 dark:text-accent-400 hover:underline">{v.sponsor.firstName} {v.sponsor.lastName}</Link> : (v.donorName || '-')}</td>
                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{v.notes || '-'}</td>
                {canEditData && <td className="py-3 px-1 text-right"><button aria-label="Smazat" onClick={() => deleteVoucher(v.id, 'purchase')} className="p-2 text-gray-400 hover:text-red-500 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400"><Trash2 className="w-4 h-4" /></button></td>}
              </tr>
            ))}
            {(!student.vouchers || student.vouchers.length === 0) && <tr><td colSpan={canEditData ? 6 : 5} className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('app.noData')}</td></tr>}
          </tbody></table>
        </div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('vouchers.usages')}</h4>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed"><thead><tr className="border-b border-gray-200 dark:border-gray-600">
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-28">{t('vouchers.usageDate')}</th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-28"></th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-16">{t('vouchers.usedCount')}</th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-32"></th>
            <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('student.notes')}</th>
            {canEditData && <th className="w-10"></th>}
          </tr></thead><tbody>
            {student.voucherUsages?.map((v: any) => (
              <tr key={v.id} className="border-b border-gray-50 dark:border-gray-700">
                <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(v.usageDate, locale)}</td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatNumber(v.count)}</td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{v.notes || '-'}</td>
                {canEditData && <td className="py-3 px-1 text-right"><button aria-label="Smazat" onClick={() => deleteVoucher(v.id, 'usage')} className="p-2 text-gray-400 hover:text-red-500 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400"><Trash2 className="w-4 h-4" /></button></td>}
              </tr>
            ))}
            {(!student.voucherUsages || student.voucherUsages.length === 0) && <tr><td colSpan={canEditData ? 6 : 5} className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('app.noData')}</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}
