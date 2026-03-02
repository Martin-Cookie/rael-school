import { Heart, Plus, X, Check, Trash2 } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'

interface NeedsTabProps {
  student: any
  canEditData: boolean
  needTypes: any[]
  showAddNeed: boolean
  setShowAddNeed: (v: boolean) => void
  selectedNeedType: string
  setSelectedNeedType: (v: string) => void
  newNeed: string
  setNewNeed: (v: string) => void
  addNeed: () => void
  toggleNeedFulfilled: (needId: string, current: boolean) => void
  deleteNeed: (needId: string) => void
  locale: Locale
  t: (key: string) => string
}

export function NeedsTab({
  student, canEditData, needTypes, showAddNeed, setShowAddNeed,
  selectedNeedType, setSelectedNeedType, newNeed, setNewNeed,
  addNeed, toggleNeedFulfilled, deleteNeed, locale, t
}: NeedsTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><Heart className="w-4 h-4 text-red-500 dark:text-red-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('needs.title')}</h3>
        </div>
        {canEditData && <button onClick={() => setShowAddNeed(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('needs.addNeed')}</button>}
      </div>
      {showAddNeed && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-2">
            <select aria-label="Typ potreby" value={selectedNeedType} onChange={(e) => { setSelectedNeedType(e.target.value); if (e.target.value !== '__custom__') setNewNeed('') }} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">{t('needs.selectType')}</option>
              {needTypes.map((nt: any) => <option key={nt.id} value={nt.name}>{getLocaleName(nt, locale)}{nt.price ? ` (${formatNumber(nt.price)} CZK)` : ''}</option>)}
              <option value="__custom__">{t('needs.customNeed')}</option>
            </select>
            {selectedNeedType === '__custom__' && (
              <input aria-label="Vlastni potreba" type="text" value={newNeed} onChange={(e) => setNewNeed(e.target.value)} placeholder={t('needs.description')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && addNeed()} />
            )}
            <button onClick={addNeed} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
            <button aria-label="Zavrit" onClick={() => { setShowAddNeed(false); setNewNeed(''); setSelectedNeedType('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {student.needs?.map((need: any) => (
          <div key={need.id} className={`flex items-center justify-between p-3 rounded-lg ${need.isFulfilled ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-3">
              {canEditData ? <button onClick={() => toggleNeedFulfilled(need.id, need.isFulfilled)} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${need.isFulfilled ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>{need.isFulfilled && <Check className="w-4 h-4 text-white" />}</button> : <div className={`w-6 h-6 rounded-full flex items-center justify-center ${need.isFulfilled ? 'bg-primary-500' : 'bg-gray-300'}`}>{need.isFulfilled && <Check className="w-4 h-4 text-white" />}</div>}
              <div>
                {(() => { const nt = needTypes.find((t: any) => t.name === need.description); return <><span className={`text-sm ${need.isFulfilled ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{nt ? getLocaleName(nt, locale) : need.description}</span>{nt?.price ? <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({formatNumber(nt.price)} CZK)</span> : null}</> })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {need.isFulfilled && <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(need.fulfilledAt, locale)}</span>}
              {canEditData && <button aria-label="Smazat" onClick={() => deleteNeed(need.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
        ))}
        {(!student.needs || student.needs.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('app.noData')}</p>}
      </div>
    </div>
  )
}
