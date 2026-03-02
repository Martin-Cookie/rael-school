import { User, Heart, Edit3 } from 'lucide-react'
import { formatDateForInput } from '@/lib/format'
import { getLocaleName, Locale } from '@/lib/i18n'
import { Field, SelectField } from './FormFields'

interface PersonalTabProps {
  student: any
  editData: any
  setEditData: (data: any) => void
  editMode: boolean
  classrooms: any[]
  locale: Locale
  t: (key: string) => string
}

export function PersonalTab({ student, editData, setEditData, editMode, classrooms, locale, t }: PersonalTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal info card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg"><User className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('student.tabs.personal')}</h3>
        </div>
        <div className="space-y-4">
          <Field label={t('student.firstName')} value={editData.firstName} editMode={editMode} onChange={(v) => setEditData({ ...editData, firstName: v })} />
          <Field label={t('student.lastName')} value={editData.lastName} editMode={editMode} onChange={(v) => setEditData({ ...editData, lastName: v })} />
          <Field label={t('student.dateOfBirth')} value={formatDateForInput(editData.dateOfBirth)} type="date" editMode={editMode} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} />
          <SelectField label={t('student.gender')} value={editData.gender || ''} editMode={editMode} options={[{ value: '', label: '-' }, { value: 'M', label: t('student.male') }, { value: 'F', label: t('student.female') }]} displayValue={student.gender === 'M' ? t('student.male') : student.gender === 'F' ? t('student.female') : '-'} onChange={(v) => setEditData({ ...editData, gender: v })} />
          <SelectField label={t('student.className')} value={editData.className || ''} editMode={editMode} options={[{ value: '', label: '-' }, ...classrooms.map((c: any) => ({ value: c.name, label: getLocaleName(c, locale) }))]} displayValue={(() => { const cr = classrooms.find((c: any) => c.name === student.className); return cr ? getLocaleName(cr, locale) : student.className || '-' })()} onChange={(v) => setEditData({ ...editData, className: v })} />
          <Field label={t('student.healthStatus')} value={editData.healthStatus} editMode={editMode} onChange={(v) => setEditData({ ...editData, healthStatus: v })} />
        </div>
      </div>

      {/* Family card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-accent-50 dark:bg-accent-900/30 rounded-lg"><Heart className="w-4 h-4 text-accent-600 dark:text-accent-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('student.family.title')}</h3>
        </div>
        <div className="space-y-4">
          <Field label={t('student.family.motherName')} value={editData.motherName} editMode={editMode} onChange={(v) => setEditData({ ...editData, motherName: v })} />
          <SelectField label={t('student.family.motherAlive')} value={editData.motherAlive === null ? '' : String(editData.motherAlive)} editMode={editMode} options={[{ value:'',label:'-' },{ value:'true',label:t('app.yes') },{ value:'false',label:t('app.no') }]} displayValue={student.motherAlive === true ? t('app.yes') : student.motherAlive === false ? t('app.no') : '-'} onChange={(v) => setEditData({ ...editData, motherAlive: v === '' ? null : v === 'true' })} />
          <Field label={t('student.family.fatherName')} value={editData.fatherName} editMode={editMode} onChange={(v) => setEditData({ ...editData, fatherName: v })} />
          <SelectField label={t('student.family.fatherAlive')} value={editData.fatherAlive === null ? '' : String(editData.fatherAlive)} editMode={editMode} options={[{ value:'',label:'-' },{ value:'true',label:t('app.yes') },{ value:'false',label:t('app.no') }]} displayValue={student.fatherAlive === true ? t('app.yes') : student.fatherAlive === false ? t('app.no') : '-'} onChange={(v) => setEditData({ ...editData, fatherAlive: v === '' ? null : v === 'true' })} />
          <Field label={t('student.family.siblings')} value={editData.siblings} editMode={editMode} onChange={(v) => setEditData({ ...editData, siblings: v })} />
        </div>
      </div>

      {/* Notes card - full width */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('student.notes')}</h3>
        </div>
        {editMode ? <textarea value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none" /> : <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{student.notes || '-'}</p>}
      </div>
    </div>
  )
}
