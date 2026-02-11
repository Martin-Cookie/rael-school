'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GraduationCap, Settings, ChevronUp, ChevronDown, ArrowLeft, Stethoscope, CreditCard } from 'lucide-react'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

const msgs: Record<string, any> = { cs, en, sw }

type CodelistItem = { id: string; name: string; sortOrder: number; isActive: boolean }

function CodelistSection({
  title,
  icon: Icon,
  items,
  newName,
  setNewName,
  onAdd,
  onDelete,
  onMove,
  placeholder,
  t,
}: {
  title: string
  icon: any
  items: CodelistItem[]
  newName: string
  setNewName: (v: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
  placeholder: string
  t: (key: string) => string
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900 flex-1">{title}</h2>
        <span className="text-sm text-gray-400 font-medium">{items.length}</span>
      </div>

      {/* Add new item */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        />
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" /> {t('app.add')}
        </button>
      </div>

      {/* Tile grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 card-hover group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate mb-2">{item.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMove(item.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-gray-100"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onMove(item.id, 'down')}
                      disabled={idx === items.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-gray-100"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{t('app.noData')}</p>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<CodelistItem[]>([])
  const [healthTypes, setHealthTypes] = useState<CodelistItem[]>([])
  const [paymentTypes, setPaymentTypes] = useState<CodelistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newClassName, setNewClassName] = useState('')
  const [newHealthTypeName, setNewHealthTypeName] = useState('')
  const [newPaymentTypeName, setNewPaymentTypeName] = useState('')
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

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [crRes, htRes, ptRes] = await Promise.all([
        fetch('/api/admin/classrooms'),
        fetch('/api/admin/health-types'),
        fetch('/api/admin/payment-types'),
      ])
      const crData = await crRes.json()
      const htData = await htRes.json()
      const ptData = await ptRes.json()
      setClassrooms(crData.classrooms || [])
      setHealthTypes(htData.healthTypes || [])
      setPaymentTypes(ptData.paymentTypes || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text }); setTimeout(() => setMessage(null), 3000)
  }

  // Generic CRUD factory
  function makeHandlers(endpoint: string, items: CodelistItem[]) {
    return {
      add: async (name: string, resetFn: () => void) => {
        if (!name.trim()) return
        try {
          const res = await fetch(endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), sortOrder: items.length }),
          })
          if (res.ok) { resetFn(); await fetchAll(); showMsg('success', t('app.savedSuccess')) }
          else { const d = await res.json(); showMsg('error', d.error || t('app.error')) }
        } catch { showMsg('error', t('app.error')) }
      },
      del: async (id: string) => {
        if (!confirm(t('app.confirmDelete'))) return
        try {
          await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
          await fetchAll(); showMsg('success', t('app.deleteSuccess'))
        } catch { showMsg('error', t('app.error')) }
      },
      move: async (id: string, direction: 'up' | 'down') => {
        const idx = items.findIndex(c => c.id === id)
        if (direction === 'up' && idx <= 0) return
        if (direction === 'down' && idx >= items.length - 1) return
        const updated = [...items]
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
        const orders = updated.map((c, i) => ({ id: c.id, sortOrder: i }))
        try {
          await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders }) })
          await fetchAll()
        } catch { showMsg('error', t('app.error')) }
      },
    }
  }

  const classroomH = makeHandlers('/api/admin/classrooms', classrooms)
  const healthTypeH = makeHandlers('/api/admin/health-types', healthTypes)
  const paymentTypeH = makeHandlers('/api/admin/payment-types', paymentTypes)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      {message && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>{message.text}</div>}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <Settings className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.admin')}</h1>
      </div>

      <div className="space-y-8">
        <CodelistSection
          title={t('admin.classrooms')}
          icon={GraduationCap}
          items={classrooms}
          newName={newClassName}
          setNewName={setNewClassName}
          onAdd={() => classroomH.add(newClassName, () => setNewClassName(''))}
          onDelete={classroomH.del}
          onMove={classroomH.move}
          placeholder={t('admin.newClassName')}
          t={t}
        />

        <CodelistSection
          title={t('admin.healthTypes')}
          icon={Stethoscope}
          items={healthTypes}
          newName={newHealthTypeName}
          setNewName={setNewHealthTypeName}
          onAdd={() => healthTypeH.add(newHealthTypeName, () => setNewHealthTypeName(''))}
          onDelete={healthTypeH.del}
          onMove={healthTypeH.move}
          placeholder={t('admin.newHealthTypeName')}
          t={t}
        />

        <CodelistSection
          title={t('admin.paymentTypes')}
          icon={CreditCard}
          items={paymentTypes}
          newName={newPaymentTypeName}
          setNewName={setNewPaymentTypeName}
          onAdd={() => paymentTypeH.add(newPaymentTypeName, () => setNewPaymentTypeName(''))}
          onDelete={paymentTypeH.del}
          onMove={paymentTypeH.move}
          placeholder={t('admin.newPaymentTypeName')}
          t={t}
        />
      </div>
    </div>
  )
}
