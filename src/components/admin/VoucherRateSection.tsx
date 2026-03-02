'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, Pencil, Ticket } from 'lucide-react'
import { CURRENCIES } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import type { VoucherRateSectionProps } from './types'

export function VoucherRateSection({
  items,
  newCurrency,
  setNewCurrency,
  newRate,
  setNewRate,
  onAdd,
  onDelete,
  onUpdate,
  t,
}: VoucherRateSectionProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 card-hover overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
          <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{t('admin.voucherRates')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.voucherRatesDesc')}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Add new rate */}
          {(() => {
            const usedCurrencies = new Set(items.map(i => i.currency))
            const available = CURRENCIES.filter(c => !usedCurrencies.has(c))
            return available.length > 0 ? (
              <div className="mb-4 flex gap-2">
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-28 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
                >
                  <option value="">{t('admin.newCurrency')}</option>
                  {available.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder={t('admin.ratePerVoucher')}
                  className="w-32 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                />
                <button
                  onClick={onAdd}
                  className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-400 dark:text-gray-500 italic">{t('admin.allCurrenciesAdded')}</p>
            )
          })()}

          {/* Rate list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 group">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Ticket className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-14">{item.currency}</span>
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (editValue && parseFloat(editValue) > 0 && parseFloat(editValue) !== item.rate) {
                            onUpdate(item.id, parseFloat(editValue))
                          }
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editValue && parseFloat(editValue) > 0 && parseFloat(editValue) !== item.rate) {
                              onUpdate(item.id, parseFloat(editValue))
                            }
                            setEditingId(null)
                          }
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="w-24 px-2 py-1 rounded-lg border border-primary-400 dark:border-primary-500 dark:bg-gray-700 dark:text-gray-100 text-sm text-right focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingId(item.id); setEditValue(item.rate.toString()) }}
                        className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        {formatNumber(item.rate)} {item.currency} {t('admin.perVoucher')}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 dark:group-hover:opacity-80" />
                      </button>
                    )}
                    <div className="flex-1" />
                    <button
                      aria-label="Smazat"
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Ticket className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('app.noData')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
