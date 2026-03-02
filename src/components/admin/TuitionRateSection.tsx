'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, Pencil, GraduationCap } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import type { TuitionRateSectionProps } from './types'

export function TuitionRateSection({
  items,
  onUpdate,
  onDelete,
  t,
}: TuitionRateSectionProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 card-hover overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{t('tuition.rates')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('tuition.ratesDesc')}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 group">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <GraduationCap className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({t('tuition.gradeRange')}: {item.gradeFrom}–{item.gradeTo})
                    </span>
                    <div className="flex-1" />
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (editValue && parseFloat(editValue) > 0 && parseFloat(editValue) !== item.annualFee) {
                            onUpdate(item.id, parseFloat(editValue))
                          }
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editValue && parseFloat(editValue) > 0 && parseFloat(editValue) !== item.annualFee) {
                              onUpdate(item.id, parseFloat(editValue))
                            }
                            setEditingId(null)
                          }
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="w-28 px-2 py-1 rounded-lg border border-primary-400 dark:border-primary-500 dark:bg-gray-700 dark:text-gray-100 text-sm text-right focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingId(item.id); setEditValue(item.annualFee.toString()) }}
                        className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        {formatNumber(item.annualFee)} {item.currency}/{t('tuition.annualFee').toLowerCase()}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 dark:group-hover:opacity-80" />
                      </button>
                    )}
                    <button
                      aria-label="Smazat"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('tuition.noRates')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
