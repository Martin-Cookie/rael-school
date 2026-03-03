'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'

export default function NewStudentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const { t } = useLocale()
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '',
    className: '', healthStatus: '', motherName: '', motherAlive: '',
    fatherName: '', fatherAlive: '', siblings: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/admin/classrooms').then(r => r.json()).then(d => setClassrooms(d.classrooms || [])).catch(e => console.error('Failed to load classrooms:', e))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName) return
    setSaving(true)

    try {
      const res = await fetchWithCsrf('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          motherAlive: form.motherAlive === '' ? null : form.motherAlive === 'true',
          fatherAlive: form.fatherAlive === '' ? null : form.fatherAlive === 'true',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/students/${data.student.id}`)
      }
    } catch {
      // handle error
    }
    setSaving(false)
  }

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value })
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/students')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('student.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.firstName')} *</label>
            <input id="firstName" type="text" required value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.lastName')} *</label>
            <input id="lastName" type="text" required value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('student.dateOfBirth')}</label>
            <input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
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
              {classrooms.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
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
