'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, GraduationCap, Settings, ChevronUp, ChevronDown, Stethoscope, CreditCard, Heart, Package, Star, Pencil, Database, Download, Upload, FileJson, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, getLocaleName, type Locale } from '@/lib/i18n'



const msgs: Record<string, any> = { cs, en, sw }

type CodelistItem = { id: string; name: string; nameEn?: string | null; nameSw?: string | null; sortOrder: number; isActive: boolean; price?: number | null }

function formatNumber(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

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
  locale,
  showPrice,
  newPrice,
  setNewPrice,
  onPriceChange,
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
  locale: Locale
  showPrice?: boolean
  newPrice?: string
  setNewPrice?: (v: string) => void
  onPriceChange?: (id: string, price: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden">
      {/* Tile - clickable card */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'položka' : items.length >= 2 && items.length <= 4 ? 'položky' : 'položek'}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {/* Add new item */}
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              />
              {showPrice && setNewPrice && (
                <input
                  type="number"
                  value={newPrice || ''}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder={t('admin.priceCZK')}
                  className="w-28 px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                />
              )}
            </div>
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" /> {t('app.add')}
            </button>
          </div>

          {/* Item list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => onMove(item.id, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onMove(item.id, 'down')}
                      disabled={idx === items.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <Icon className="w-5 h-5 text-primary-500" />
                  <span className="flex-1 text-sm font-medium text-gray-900">{getLocaleName(item, locale)}</span>
                  {showPrice && onPriceChange && (
                    editingPriceId === item.id ? (
                      <input
                        type="number"
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onBlur={() => {
                          onPriceChange(item.id, editPriceValue ? parseFloat(editPriceValue) : null)
                          setEditingPriceId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onPriceChange(item.id, editPriceValue ? parseFloat(editPriceValue) : null)
                            setEditingPriceId(null)
                          }
                          if (e.key === 'Escape') setEditingPriceId(null)
                        }}
                        className="w-24 px-2 py-1 rounded-lg border border-primary-400 text-sm text-right focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingPriceId(item.id); setEditPriceValue(item.price?.toString() || '') }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                        title={t('admin.editPrice')}
                      >
                        {item.price ? `${formatNumber(item.price)} CZK` : t('admin.noPrice')}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    )
                  )}
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Icon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500 text-sm">{t('app.noData')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BackupSection({ t, showMsg }: { t: (key: string) => string; showMsg: (type: 'success' | 'error', text: string) => void }) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleDownload(endpoint: string, key: string) {
    setDownloading(key)
    try {
      const res = await fetch(endpoint)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showMsg('error', data.error || t('app.error'))
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="(.+?)"/)
      const fileName = match ? match[1] : 'backup'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showMsg('success', t('app.savedSuccess'))
    } catch {
      showMsg('error', t('app.error'))
    } finally {
      setDownloading(null)
    }
  }

  async function handleRestore() {
    if (!selectedFile) return
    setRestoring(true)
    setShowRestoreConfirm(false)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('success', t('admin.restoreSuccess'))
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        // Redirect to dashboard after short delay to allow Prisma to reconnect
        setTimeout(() => { window.location.href = '/dashboard' }, 2000)
      } else {
        showMsg('error', data.error || t('admin.restoreError'))
      }
    } catch {
      showMsg('error', t('admin.restoreError'))
    } finally {
      setRestoring(false)
    }
  }

  const downloadButtons = [
    { key: 'db', label: t('admin.downloadDb'), desc: t('admin.downloadDbDesc'), icon: Database, endpoint: '/api/admin/backup/database' },
    { key: 'json', label: t('admin.downloadJson'), desc: t('admin.downloadJsonDesc'), icon: FileJson, endpoint: '/api/admin/backup/json' },
    { key: 'csv-students', label: t('admin.exportStudentsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=students' },
    { key: 'csv-sponsors', label: t('admin.exportSponsorsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=sponsors' },
    { key: 'csv-payments', label: t('admin.exportPaymentsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=payments' },
    { key: 'csv-codelists', label: t('admin.exportCodelistsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=codelists' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Database className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{t('admin.backup')}</h3>
          <p className="text-sm text-gray-500">{t('admin.backupDesc')}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
          {/* Download buttons */}
          {downloadButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleDownload(btn.endpoint, btn.key)}
              disabled={downloading !== null}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
            >
              <btn.icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 block">{btn.label}</span>
                <span className="text-xs text-gray-500">{btn.desc}</span>
              </div>
              {downloading === btn.key ? (
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
          ))}

          {/* Restore section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-semibold text-gray-900">{t('admin.restoreBackup')}</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3">{t('admin.restoreDesc')}</p>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
              />
              <button
                onClick={() => setShowRestoreConfirm(true)}
                disabled={!selectedFile || restoring}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('admin.restoring')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('admin.restoreConfirm')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Restore confirmation modal */}
          {showRestoreConfirm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('admin.restoreBackup')}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{t('admin.restoreWarning')}</p>
                {selectedFile && (
                  <p className="text-sm text-gray-500 mb-4">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRestoreConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                  >
                    {t('app.cancel')}
                  </button>
                  <button
                    onClick={handleRestore}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600"
                  >
                    {t('admin.restoreConfirm')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [classrooms, setClassrooms] = useState<CodelistItem[]>([])
  const [healthTypes, setHealthTypes] = useState<CodelistItem[]>([])
  const [paymentTypes, setPaymentTypes] = useState<CodelistItem[]>([])
  const [needTypes, setNeedTypes] = useState<CodelistItem[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<CodelistItem[]>([])
  const [wishTypes, setWishTypes] = useState<CodelistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newClassName, setNewClassName] = useState('')
  const [newHealthTypeName, setNewHealthTypeName] = useState('')
  const [newPaymentTypeName, setNewPaymentTypeName] = useState('')
  const [newNeedTypeName, setNewNeedTypeName] = useState('')
  const [newNeedTypePrice, setNewNeedTypePrice] = useState('')
  const [newEquipmentTypeName, setNewEquipmentTypeName] = useState('')
  const [newEquipmentTypePrice, setNewEquipmentTypePrice] = useState('')
  const [newWishTypeName, setNewWishTypeName] = useState('')
  const [newWishTypePrice, setNewWishTypePrice] = useState('')
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
      const [crRes, htRes, ptRes, ntRes, etRes, wtRes] = await Promise.all([
        fetch('/api/admin/classrooms'),
        fetch('/api/admin/health-types'),
        fetch('/api/admin/payment-types'),
        fetch('/api/admin/need-types'),
        fetch('/api/admin/equipment-types'),
        fetch('/api/admin/wish-types'),
      ])
      const crData = await crRes.json()
      const htData = await htRes.json()
      const ptData = await ptRes.json()
      const ntData = await ntRes.json()
      const etData = await etRes.json()
      const wtData = await wtRes.json()
      setClassrooms(crData.classrooms || [])
      setHealthTypes(htData.healthTypes || [])
      setPaymentTypes(ptData.paymentTypes || [])
      setNeedTypes(ntData.needTypes || [])
      setEquipmentTypes(etData.equipmentTypes || [])
      setWishTypes(wtData.wishTypes || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text }); setTimeout(() => setMessage(null), 3000)
  }

  // Generic CRUD factory
  function makeHandlers(endpoint: string, items: CodelistItem[]) {
    return {
      add: async (name: string, resetFn: () => void, price?: string) => {
        if (!name.trim()) return
        const body: any = { name: name.trim(), sortOrder: items.length }
        if (price && parseFloat(price)) body.price = parseFloat(price)
        try {
          const res = await fetch(endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
      updatePrice: async (id: string, price: number | null) => {
        try {
          await fetch(endpoint, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, price }),
          })
          await fetchAll(); showMsg('success', t('app.savedSuccess'))
        } catch { showMsg('error', t('app.error')) }
      },
    }
  }

  const classroomH = makeHandlers('/api/admin/classrooms', classrooms)
  const healthTypeH = makeHandlers('/api/admin/health-types', healthTypes)
  const paymentTypeH = makeHandlers('/api/admin/payment-types', paymentTypes)
  const needTypeH = makeHandlers('/api/admin/need-types', needTypes)
  const equipmentTypeH = makeHandlers('/api/admin/equipment-types', equipmentTypes)
  const wishTypeH = makeHandlers('/api/admin/wish-types', wishTypes)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div>
      {message && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>{message.text}</div>}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.admin')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          locale={locale}
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
          locale={locale}
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
          locale={locale}
        />

        <CodelistSection
          title={t('admin.needTypes')}
          icon={Heart}
          items={needTypes}
          newName={newNeedTypeName}
          setNewName={setNewNeedTypeName}
          onAdd={() => needTypeH.add(newNeedTypeName, () => { setNewNeedTypeName(''); setNewNeedTypePrice('') }, newNeedTypePrice)}
          onDelete={needTypeH.del}
          onMove={needTypeH.move}
          placeholder={t('admin.newNeedTypeName')}
          t={t}
          locale={locale}
          showPrice
          newPrice={newNeedTypePrice}
          setNewPrice={setNewNeedTypePrice}
          onPriceChange={needTypeH.updatePrice}
        />

        <CodelistSection
          title={t('admin.equipmentTypes')}
          icon={Package}
          items={equipmentTypes}
          newName={newEquipmentTypeName}
          setNewName={setNewEquipmentTypeName}
          onAdd={() => equipmentTypeH.add(newEquipmentTypeName, () => { setNewEquipmentTypeName(''); setNewEquipmentTypePrice('') }, newEquipmentTypePrice)}
          onDelete={equipmentTypeH.del}
          onMove={equipmentTypeH.move}
          placeholder={t('admin.newEquipmentTypeName')}
          t={t}
          locale={locale}
          showPrice
          newPrice={newEquipmentTypePrice}
          setNewPrice={setNewEquipmentTypePrice}
          onPriceChange={equipmentTypeH.updatePrice}
        />

        <CodelistSection
          title={t('admin.wishTypes')}
          icon={Star}
          items={wishTypes}
          newName={newWishTypeName}
          setNewName={setNewWishTypeName}
          onAdd={() => wishTypeH.add(newWishTypeName, () => { setNewWishTypeName(''); setNewWishTypePrice('') }, newWishTypePrice)}
          onDelete={wishTypeH.del}
          onMove={wishTypeH.move}
          placeholder={t('admin.newWishTypeName')}
          t={t}
          locale={locale}
          showPrice
          newPrice={newWishTypePrice}
          setNewPrice={setNewWishTypePrice}
          onPriceChange={wishTypeH.updatePrice}
        />
      </div>

      {/* Backup & Export */}
      <div className="mt-6">
        <BackupSection t={t} showMsg={showMsg} />
      </div>
    </div>
  )
}
