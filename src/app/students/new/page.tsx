'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/hooks/useToast'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { Toast } from '@/components/Toast'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'
import type { ClassRoom, StudentListItem } from '@/types/api'

const MAX_NAME = 100
const MIN_YEAR = 1950

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'dateOfBirth', string>>

export default function NewStudentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const { t } = useLocale()
  const { message, showMsg } = useToast()
  const { confirm: askConfirm, dialog: confirmDialogEl } = useConfirmDialog()
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '',
    className: '', healthStatus: '', motherName: '', motherAlive: '',
    fatherName: '', fatherAlive: '', siblings: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/admin/classrooms').then(r => r.json()).then(d => setClassrooms(d.classrooms || [])).catch(e => console.error('Failed to load classrooms:', e))
  }, [])

  function validate(trimmed: typeof form): FieldErrors {
    const errs: FieldErrors = {}
    if (trimmed.firstName.length < 1) errs.firstName = t('student.validation.nameRequired')
    else if (trimmed.firstName.length > MAX_NAME) errs.firstName = t('student.validation.nameTooLong')
    if (trimmed.lastName.length < 1) errs.lastName = t('student.validation.nameRequired')
    else if (trimmed.lastName.length > MAX_NAME) errs.lastName = t('student.validation.nameTooLong')
    if (trimmed.dateOfBirth) {
      const dob = new Date(trimmed.dateOfBirth)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (Number.isNaN(dob.getTime())) errs.dateOfBirth = t('student.validation.dateInvalid')
      else if (dob > today) errs.dateOfBirth = t('student.validation.dateFuture')
      else if (dob.getFullYear() < MIN_YEAR) errs.dateOfBirth = t('student.validation.dateTooOld').replace('{year}', String(MIN_YEAR))
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() }
    const errs = validate(trimmed)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    // Warn on potential duplicate (same firstName + lastName, optionally same DOB)
    try {
      const q = `${trimmed.firstName} ${trimmed.lastName}`.trim()
      const res = await fetch(`/api/students?search=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        const candidates = (data.students || []) as StudentListItem[]
        const matches = candidates.filter(s =>
          s.firstName.trim().toLowerCase() === trimmed.firstName.toLowerCase() &&
          s.lastName.trim().toLowerCase() === trimmed.lastName.toLowerCase()
        )
        const exactDob = trimmed.dateOfBirth
          ? matches.find(s => s.dateOfBirth && String(s.dateOfBirth).slice(0, 10) === trimmed.dateOfBirth)
          : null
        if (exactDob || matches.length > 0) {
          const reason = exactDob
            ? t('student.validation.duplicateExact')
            : t('student.validation.duplicateName').replace('{count}', String(matches.length))
          const ok = await askConfirm({
            title: t('student.validation.duplicateTitle'),
            message: reason,
            variant: 'danger',
            confirmLabel: t('app.save'),
          })
          if (!ok) return
        }
      }
    } catch {
      // Pokud duplicate check selže, pokračujeme — server-side unique constraint nás případně zastaví
    }

    setSaving(true)
    try {
      const res = await fetchWithCsrf('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...trimmed,
          motherAlive: trimmed.motherAlive === '' ? null : trimmed.motherAlive === 'true',
          fatherAlive: trimmed.fatherAlive === '' ? null : trimmed.fatherAlive === 'true',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/students/${data.student.id}`)
        return
      }
      const d = await res.json().catch(() => null)
      showMsg('error', d?.error || t('app.error'))
    } catch {
      showMsg('error', t('app.error'))
    }
    setSaving(false)
  }

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value })
    if (errors[field as keyof FieldErrors]) {
      setErrors(prev => { const next = { ...prev }; delete next[field as keyof FieldErrors]; return next })
    }
  }

  const inputBase = 'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none'
  function inputCls(field: keyof FieldErrors) {
    return `${inputBase} ${errors[field] ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`
  }

  return (
    <div>
      <Toast message={message} />
      {confirmDialogEl}

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/students')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('student.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.firstName')} *</label>
            <input id="firstName" type="text" required maxLength={MAX_NAME} aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-err' : undefined} value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className={inputCls('firstName')} />
            {errors.firstName && <p id="firstName-err" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.lastName')} *</label>
            <input id="lastName" type="text" required maxLength={MAX_NAME} aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-err' : undefined} value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className={inputCls('lastName')} />
            {errors.lastName && <p id="lastName-err" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName}</p>}
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.dateOfBirth')}</label>
            <input id="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} min={`${MIN_YEAR}-01-01`} aria-invalid={!!errors.dateOfBirth} aria-describedby={errors.dateOfBirth ? 'dateOfBirth-err' : undefined} value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className={inputCls('dateOfBirth')} />
            {errors.dateOfBirth && <p id="dateOfBirth-err" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dateOfBirth}</p>}
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.gender')}</label>
            <select id="gender" value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
              <option value="">-</option>
              <option value="M">{t('student.male')}</option>
              <option value="F">{t('student.female')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="className" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.className')}</label>
            <select id="className" value={form.className} onChange={(e) => updateField('className', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
              <option value="">-</option>
              {classrooms.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.healthStatus')}</label>
            <input id="healthStatus" type="text" value={form.healthStatus} onChange={(e) => updateField('healthStatus', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('student.family.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.family.motherName')}</label>
            <input id="motherName" type="text" value={form.motherName} onChange={(e) => updateField('motherName', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
          <div>
            <label htmlFor="motherAlive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.family.motherAlive')}</label>
            <select id="motherAlive" value={form.motherAlive} onChange={(e) => updateField('motherAlive', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
              <option value="">-</option>
              <option value="true">{t('app.yes')}</option>
              <option value="false">{t('app.no')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.family.fatherName')}</label>
            <input id="fatherName" type="text" value={form.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
          <div>
            <label htmlFor="fatherAlive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.family.fatherAlive')}</label>
            <select id="fatherAlive" value={form.fatherAlive} onChange={(e) => updateField('fatherAlive', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none">
              <option value="">-</option>
              <option value="true">{t('app.yes')}</option>
              <option value="false">{t('app.no')}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="siblings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.family.siblings')}</label>
            <input id="siblings" type="text" value={form.siblings} onChange={(e) => updateField('siblings', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.notes')}</label>
          <textarea id="notes" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none resize-none placeholder:text-gray-400" />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '...' : t('app.save')}
        </button>
      </form>
    </div>
  )
}
