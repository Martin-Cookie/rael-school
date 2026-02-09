'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GraduationCap, Settings, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

const msgs: Record<string, any> = { cs, en, sw }

export default function AdminPage() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [locale, setLocale] = useState<Locale>('cs')

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => { fetchClassrooms() }, [])

  async function fetchClassrooms() {
    try {
      const res = await fetch('/api/admin/classrooms')
      const data = await res.json()
      setClassrooms(data.classrooms || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text }); setTimeout(() => setMessage(null), 3000)
  }

  async function addClass() {
    if (!newName.trim()) return
    try {
      const res = await fetch('/api/admin/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), sortOrder: classrooms.length }),
      })
      if (res.ok) {
        setNewName('')
        await fetchClassrooms()
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error || t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function deleteClass(id: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try {
      await fetch('/api/admin/classrooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await fetchClassrooms()
      showMsg('success', t('app.deleteSuccess'))
    } catch { showMsg('error', t('app.error')) }
  }

  async function moveClass(id: string, direction: 'up' | 'down') {
    const idx = classrooms.findIndex(c => c.id === id)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= classrooms.length - 1) return

    const updated = [...classrooms]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = updated[idx]
    updated[idx] = updated[swapIdx]
    updated[swapIdx] = temp

    const orders = updated.map((c, i) => ({ id: c.id, sortOrder: i }))
    try {
      await fetch('/api/admin/classrooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      })
      await fetchClassrooms()
    } catch { showMsg('error', t('app.error')) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      {message && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>{message.text}</div>}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <Settings className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.admin')}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <GraduationCap className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.classrooms')}</h2>
        </div>

        {/* Add new class */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('admin.newClassName')}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addClass()}
          />
          <button
            onClick={addClass}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> {t('app.add')}
          </button>
        </div>

        {/* List */}
        {classrooms.length > 0 ? (
          <div className="space-y-2">
            {classrooms.map((cls, idx) => (
              <div key={cls.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 group">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveClass(cls.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveClass(cls.id, 'down')}
                    disabled={idx === classrooms.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <GraduationCap className="w-5 h-5 text-primary-500" />
                <span className="flex-1 text-sm font-medium text-gray-900">{cls.name}</span>
                <button
                  onClick={() => deleteClass(cls.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">{t('app.noData')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
