import { formatDate } from '@/lib/format'

interface FieldProps {
  label: string
  value: any
  type?: string
  editMode: boolean
  onChange: (v: string) => void
}

export function Field({ label, value, type = 'text', editMode, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {editMode ? (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none" />
      ) : (
        <p className="text-gray-900 dark:text-gray-100 py-2">{type === 'date' ? formatDate(value) : value || '-'}</p>
      )}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  editMode: boolean
  options: { value: string; label: string }[]
  displayValue: string
  onChange: (v: string) => void
}

export function SelectField({ label, value, editMode, options, displayValue, onChange }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {editMode ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <p className="text-gray-900 dark:text-gray-100 py-2">{displayValue}</p>
      )}
    </div>
  )
}
