import { Package, Plus, X, Trash2 } from 'lucide-react'
import { formatDate, formatDateForInput, formatNumber } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'

interface EquipmentTabProps {
  student: any
  editMode: boolean
  editEquipment: any[]
  canEditData: boolean
  equipmentTypes: any[]
  showAddEquipment: boolean
  setShowAddEquipment: (v: boolean) => void
  newEquipmentType: string
  setNewEquipmentType: (v: string) => void
  addSingleEquipment: () => void
  deleteSingleEquipment: (id: string) => void
  updateEquipment: (idx: number, field: string, value: string) => void
  addEquipmentItem: (typeName: string) => void
  removeEquipmentItem: (idx: number) => void
  locale: Locale
  t: (key: string) => string
}

export function EquipmentTab({
  student, editMode, editEquipment, canEditData, equipmentTypes,
  showAddEquipment, setShowAddEquipment, newEquipmentType, setNewEquipmentType,
  addSingleEquipment, deleteSingleEquipment, updateEquipment, addEquipmentItem,
  removeEquipmentItem, locale, t
}: EquipmentTabProps) {

  const condBadge = (c: string) => {
    const m: Record<string,string> = { new:'badge-green', satisfactory:'badge-yellow', poor:'badge-red' }
    const l: Record<string,string> = { new:t('equipment.new'), satisfactory:t('equipment.satisfactory'), poor:t('equipment.poor') }
    return <span className={`badge ${m[c]||'badge-yellow'}`}>{l[c]||c}</span>
  }

  const eqLabel = (type: string) => {
    const found = equipmentTypes.find((et: any) => et.name === type)
    if (found) return getLocaleName(found, locale)
    const m: Record<string,string> = { bed:t('equipment.bed'), mattress:t('equipment.mattress'), blanket:t('equipment.blanket'), mosquito_net:t('equipment.mosquito_net'), bedding:t('equipment.bedding'), uniform:t('equipment.uniform'), shoes:t('equipment.shoes'), school_bag:t('equipment.school_bag'), pillow:t('equipment.pillow'), wheelchair:t('equipment.wheelchair'), other:t('equipment.other'), received:t('equipment.received') }
    return m[type] || type
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg"><Package className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('equipment.title')}</h3>
        </div>
        {canEditData && !editMode && <button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('equipment.addEquipment')}</button>}
      </div>
      {showAddEquipment && !editMode && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={newEquipmentType} onChange={(e) => setNewEquipmentType(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">{t('equipment.selectType')}</option>
              {equipmentTypes.map((et: any) => <option key={et.id} value={et.name}>{eqLabel(et.name)}{et.price ? ` (${formatNumber(et.price)} CZK)` : ''}</option>)}
            </select>
            <button onClick={addSingleEquipment} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
            <button aria-label="Zavrit" onClick={() => { setShowAddEquipment(false); setNewEquipmentType('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {editMode ? (
        <div className="space-y-3">
          {editEquipment.map((eq: any, idx: number) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <select value={eq.type} onChange={(e) => updateEquipment(idx, 'type', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none sm:w-40">
                <option value={eq.type}>{eqLabel(eq.type)}</option>
                {equipmentTypes.filter((et: any) => et.name !== eq.type).map((et: any) => <option key={et.id} value={et.name}>{eqLabel(et.name)}</option>)}
              </select>
              <select value={eq.condition} onChange={(e) => updateEquipment(idx, 'condition', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="new">{t('equipment.new')}</option>
                <option value="satisfactory">{t('equipment.satisfactory')}</option>
                <option value="poor">{t('equipment.poor')}</option>
              </select>
              <input type="date" value={formatDateForInput(eq.acquiredAt)} onChange={(e) => updateEquipment(idx, 'acquiredAt', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              <button onClick={() => removeEquipmentItem(idx)} className="p-1.5 text-gray-400 hover:text-red-500" title={t('equipment.removeItem')}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <select id="addEquipmentSelect" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" defaultValue="">
              <option value="">{t('equipment.selectType')}</option>
              {equipmentTypes.map((et: any) => <option key={et.id} value={et.name}>{eqLabel(et.name)}{et.price ? ` (${formatNumber(et.price)} CZK)` : ''}</option>)}
            </select>
            <button onClick={() => { const sel = document.getElementById('addEquipmentSelect') as HTMLSelectElement; if (sel.value) { addEquipmentItem(sel.value); sel.value = '' } }} className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4" /> {t('equipment.addEquipment')}</button>
          </div>
        </div>
      ) : student.equipment?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {student.equipment.map((eq: any) => (
            <div key={eq.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {eqLabel(eq.type)}
                  {(() => { const et = equipmentTypes.find((t: any) => t.name === eq.type); return et?.price ? <span className="ml-2 text-xs font-normal text-gray-500">({formatNumber(et.price)} CZK)</span> : null })()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(eq.acquiredAt, locale)}</p>
              </div>
              <div className="flex items-center gap-2">
                {condBadge(eq.condition)}
                {canEditData && <button aria-label="Smazat" onClick={() => deleteSingleEquipment(eq.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-500 text-sm text-center py-8">{t('app.noData')}</p>}
    </div>
  )
}
