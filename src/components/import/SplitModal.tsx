import { X } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { getLocaleName } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

interface SplitPart {
  amount: string
  studentId: string
  paymentTypeId: string
  count: string
}

interface SplitRow {
  amount: number
  currency: string
}

interface SplitModalProps {
  splitRow: SplitRow
  splitParts: SplitPart[]
  splitValid: boolean
  splitSum: number
  students: any[]
  sponsors: any[]
  paymentTypes: any[]
  isVoucherType: (paymentTypeId: string) => boolean
  updateSplitPart: (index: number, field: keyof SplitPart, value: string) => void
  addSplitPart: () => void
  removeSplitPart: (index: number) => void
  closeSplitModal: () => void
  submitSplit: () => void
  splitModalRef: React.Ref<HTMLDivElement>
  locale: Locale
  t: (key: string) => string
  getVoucherRateLabel: (currency: string) => string
  actionLoading: boolean
}

export function SplitModal({
  splitRow,
  splitParts,
  splitValid,
  splitSum,
  students,
  paymentTypes,
  isVoucherType,
  updateSplitPart,
  addSplitPart,
  removeSplitPart,
  closeSplitModal,
  submitSplit,
  splitModalRef,
  locale,
  t,
  getVoucherRateLabel,
  actionLoading,
}: SplitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="split-dialog-title" ref={splitModalRef} onKeyDown={(e) => e.key === 'Escape' && closeSplitModal()}>
      <div className="fixed inset-0 bg-black/50" onClick={closeSplitModal} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 id="split-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('paymentImport.splitPayment')}</h3>
          <button aria-label="Zavrit" onClick={closeSplitModal} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded focus-visible:ring-2 focus-visible:ring-primary-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original amount */}
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-300">{t('paymentImport.splitOriginalAmount')}</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(splitRow.amount)} {splitRow.currency}</span>
        </div>

        {/* Parts */}
        <div className="space-y-3 mb-4">
          {splitParts.map((part, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">{i + 1}.</span>
                <input
                  type="number"
                  value={part.amount}
                  onChange={(e) => updateSplitPart(i, 'amount', e.target.value)}
                  placeholder={t('paymentImport.amount')}
                  className="w-28 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                  step="0.01"
                />
                <span className="text-sm text-gray-400">{splitRow.currency}</span>
                <div className="flex-1" />
                {splitParts.length > 2 && (
                  <button aria-label="Zavrit" onClick={() => removeSplitPart(i)} className="p-1 text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 ml-8">
                <select
                  value={part.studentId}
                  onChange={(e) => updateSplitPart(i, 'studentId', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                >
                  <option value="">{t('paymentImport.selectStudent')}</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>
                  ))}
                </select>
                <select
                  value={part.paymentTypeId}
                  onChange={(e) => updateSplitPart(i, 'paymentTypeId', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                >
                  <option value="">{t('paymentImport.selectPaymentType')}</option>
                  {paymentTypes.map((pt: any) => (
                    <option key={pt.id} value={pt.id}>{getLocaleName(pt, locale)}</option>
                  ))}
                </select>
              </div>
              {isVoucherType(part.paymentTypeId) && (
                <div className="flex items-center gap-2 ml-8">
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t('vouchers.count')}:</label>
                  <input
                    type="number"
                    value={part.count}
                    onChange={(e) => updateSplitPart(i, 'count', e.target.value)}
                    className="w-24 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    min="1"
                  />
                  <span className="text-xs text-gray-400">ks{getVoucherRateLabel(splitRow.currency || 'CZK')}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add part button */}
        {splitParts.length < 5 && (
          <button
            onClick={addSplitPart}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            + {t('app.add')}
          </button>
        )}

        {/* Sum validation */}
        <div className={`flex justify-between items-center p-3 rounded-lg mb-5 ${splitValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <span className="text-sm text-gray-600 dark:text-gray-300">{t('paymentImport.splitRemaining')}</span>
          <span className={`text-sm font-bold ${splitValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {formatNumber(Math.round((splitRow.amount - splitSum) * 100) / 100)} {splitRow.currency}
          </span>
        </div>

        {!splitValid && (
          <p className="text-xs text-red-600 mb-4">{t('paymentImport.splitSum')}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={closeSplitModal}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {t('app.cancel')}
          </button>
          <button
            onClick={submitSplit}
            disabled={!splitValid || actionLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {t('paymentImport.split')}
          </button>
        </div>
      </div>
    </div>
  )
}
