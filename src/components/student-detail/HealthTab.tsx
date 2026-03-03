import { Stethoscope, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface HealthTabProps {
  student: any
  canEditData: boolean
  healthTypes: any[]
  showAddHealth: boolean
  setShowAddHealth: (v: boolean) => void
  newHealth: { checkDate: string; checkType: string; notes: string }
  setNewHealth: (v: any) => void
  addHealthCheck: () => void
  deleteHealthCheck: (checkId: string) => void
  locale: Locale
  t: (key: string) => string
}

export function HealthTab({
  student, canEditData, healthTypes, showAddHealth, setShowAddHealth,
  newHealth, setNewHealth, addHealthCheck, deleteHealthCheck, locale, t
}: HealthTabProps) {
  const formRef = useFocusTrap(showAddHealth)

  const htLabel = (type: string) => {
    const found = healthTypes.find((ht: any) => ht.name === type)
    return found ? getLocaleName(found, locale) : type
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><Stethoscope className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('health.title')}</h3>
        </div>
        {canEditData && <button onClick={() => setShowAddHealth(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('health.addCheck')}</button>}
      </div>
      {showAddHealth && (
        <div ref={formRef} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input aria-label="Datum prohlidky" type="date" value={newHealth.checkDate} onChange={(e) => setNewHealth({ ...newHealth, checkDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
            <select aria-label="Typ prohlidky" value={newHealth.checkType} onChange={(e) => setNewHealth({ ...newHealth, checkType: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none"><option value="">{t('health.selectType')}</option>{healthTypes.map((ht: any) => <option key={ht.id} value={ht.name}>{getLocaleName(ht, locale)}</option>)}</select>
            <input aria-label="Poznamky k prohlidce" type="text" value={newHealth.notes} onChange={(e) => setNewHealth({ ...newHealth, notes: e.target.value })} placeholder={t('health.notes')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
          <div className="flex gap-2"><button onClick={addHealthCheck} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button><button onClick={() => setShowAddHealth(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
        </div>
      )}
      {student.healthChecks?.length > 0 ? (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200 dark:border-gray-600">
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-28">{t('health.checkDate')}</th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-24">{t('health.checkType')}</th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('health.notes')}</th>
          {canEditData && <th className="w-10"></th>}
        </tr></thead><tbody>
          {student.healthChecks.map((hc: any) => (
            <tr key={hc.id} className="border-b border-gray-50 dark:border-gray-700">
              <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(hc.checkDate, locale)}</td>
              <td className="py-3 px-2 text-sm"><span className={`badge ${hc.checkType === 'urgent' ? 'badge-red' : hc.checkType === 'dentist' ? 'badge-yellow' : 'badge-green'}`}>{htLabel(hc.checkType)}</span></td>
              <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{hc.notes || '-'}</td>
              {canEditData && <td className="py-3 px-2 text-right"><button aria-label="Smazat" onClick={() => deleteHealthCheck(hc.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400"><Trash2 className="w-4 h-4" /></button></td>}
            </tr>
          ))}
        </tbody></table></div>
      ) : <div className="text-center py-12"><Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p className="text-gray-500 dark:text-gray-400">{t('health.noChecks')}</p></div>}
    </div>
  )
}
