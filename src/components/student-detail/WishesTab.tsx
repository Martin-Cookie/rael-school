import { Star, Plus, X, Check, Trash2 } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'

interface WishesTabProps {
  student: any
  canEditData: boolean
  wishTypes: any[]
  showAddWish: boolean
  setShowAddWish: (v: boolean) => void
  selectedWishType: string
  setSelectedWishType: (v: string) => void
  newWish: string
  setNewWish: (v: string) => void
  addWish: () => void
  toggleWishFulfilled: (wishId: string, current: boolean) => void
  deleteWish: (wishId: string) => void
  locale: Locale
  t: (key: string) => string
}

export function WishesTab({
  student, canEditData, wishTypes, showAddWish, setShowAddWish,
  selectedWishType, setSelectedWishType, newWish, setNewWish,
  addWish, toggleWishFulfilled, deleteWish, locale, t
}: WishesTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg"><Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('wishes.title')}</h3>
        </div>
        {canEditData && <button onClick={() => setShowAddWish(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('wishes.addWish')}</button>}
      </div>
      {showAddWish && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-2">
            <select aria-label="Typ prani" value={selectedWishType} onChange={(e) => { setSelectedWishType(e.target.value); if (e.target.value !== '__custom__') setNewWish('') }} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
              <option value="">{t('wishes.selectType')}</option>
              {wishTypes.map((wt: any) => <option key={wt.id} value={wt.name}>{getLocaleName(wt, locale)}{wt.price ? ` (${formatNumber(wt.price)} CZK)` : ''}</option>)}
              <option value="__custom__">{t('wishes.customWish')}</option>
            </select>
            {selectedWishType === '__custom__' && (
              <input aria-label="Vlastni prani" type="text" value={newWish} onChange={(e) => setNewWish(e.target.value)} placeholder={t('wishes.description')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" onKeyDown={(e) => e.key === 'Enter' && addWish()} />
            )}
            <button onClick={addWish} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
            <button aria-label="Zavrit" onClick={() => { setShowAddWish(false); setNewWish(''); setSelectedWishType('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {student.wishes?.map((wish: any) => (
          <div key={wish.id} className={`flex items-center justify-between p-3 rounded-lg ${wish.isFulfilled ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            <div className="flex items-center gap-3">
              {canEditData ? <button onClick={() => toggleWishFulfilled(wish.id, wish.isFulfilled)} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${wish.isFulfilled ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>{wish.isFulfilled && <Check className="w-4 h-4 text-white" />}</button> : <div className={`w-6 h-6 rounded-full flex items-center justify-center ${wish.isFulfilled ? 'bg-primary-500' : 'bg-gray-300'}`}>{wish.isFulfilled && <Check className="w-4 h-4 text-white" />}</div>}
              <div>
                <span className={`text-sm ${wish.isFulfilled ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{wish.wishType ? getLocaleName(wish.wishType, locale) : wish.description}</span>
                {wish.wishType?.price && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({formatNumber(wish.wishType.price)} CZK)</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wish.isFulfilled && <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(wish.fulfilledAt, locale)}</span>}
              {canEditData && <button aria-label="Smazat" onClick={() => deleteWish(wish.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
        ))}
        {(!student.wishes || student.wishes.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('wishes.noWishes')}</p>}
      </div>
    </div>
  )
}
