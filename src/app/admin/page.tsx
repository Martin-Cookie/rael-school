'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Settings, Stethoscope, CreditCard, Heart, Package, Star } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { CodelistSection } from '@/components/admin/CodelistSection'
import { VoucherRateSection } from '@/components/admin/VoucherRateSection'
import { TuitionRateSection } from '@/components/admin/TuitionRateSection'
import { BackupSection } from '@/components/admin/BackupSection'
import { AuditLogSection } from '@/components/admin/AuditLogSection'
import type { CodelistItem, VoucherRateItem, TuitionRateItem } from '@/components/admin/types'

export default function AdminPage() {
  const [classrooms, setClassrooms] = useState<CodelistItem[]>([])
  const [healthTypes, setHealthTypes] = useState<CodelistItem[]>([])
  const [paymentTypes, setPaymentTypes] = useState<CodelistItem[]>([])
  const [needTypes, setNeedTypes] = useState<CodelistItem[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<CodelistItem[]>([])
  const [wishTypes, setWishTypes] = useState<CodelistItem[]>([])
  const [voucherRates, setVoucherRates] = useState<VoucherRateItem[]>([])
  const [newVRCurrency, setNewVRCurrency] = useState('')
  const [newVRRate, setNewVRRate] = useState('')
  const [tuitionRates, setTuitionRates] = useState<TuitionRateItem[]>([])
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
  const { locale, t } = useLocale()
  const [translations, setTranslations] = useState<Record<string, { en: string; sw: string }>>({})
  const [translating, setTranslating] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [crRes, htRes, ptRes, ntRes, etRes, wtRes, vrRes, trRes] = await Promise.all([
        fetch('/api/admin/classrooms'),
        fetch('/api/admin/health-types'),
        fetch('/api/admin/payment-types'),
        fetch('/api/admin/need-types'),
        fetch('/api/admin/equipment-types'),
        fetch('/api/admin/wish-types'),
        fetch('/api/admin/voucher-rates'),
        fetch('/api/admin/tuition-rates'),
      ])
      const crData = await crRes.json()
      const htData = await htRes.json()
      const ptData = await ptRes.json()
      const ntData = await ntRes.json()
      const etData = await etRes.json()
      const wtData = await wtRes.json()
      const vrData = await vrRes.json()
      const trData = await trRes.json()
      setClassrooms(crData.classrooms || [])
      setHealthTypes(htData.healthTypes || [])
      setPaymentTypes(ptData.paymentTypes || [])
      setNeedTypes(ntData.needTypes || [])
      setEquipmentTypes(etData.equipmentTypes || [])
      setWishTypes(wtData.wishTypes || [])
      setVoucherRates(vrData.voucherRates || [])
      setTuitionRates(trData.tuitionRates || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text }); setTimeout(() => setMessage(null), 3000)
  }

  async function translateName(text: string, key: string) {
    if (!text.trim()) return
    setTranslating(key)
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setTranslations(prev => ({ ...prev, [key]: { en: data.en || '', sw: data.sw || '' } }))
      }
    } catch { /* silent fail */ }
    finally { setTranslating(null) }
  }

  // Generic CRUD factory
  function makeHandlers(endpoint: string, items: CodelistItem[]) {
    return {
      add: async (name: string, resetFn: () => void, price?: string, nameEn?: string, nameSw?: string) => {
        if (!name.trim()) return
        const body: any = { name: name.trim(), sortOrder: items.length }
        if (price && parseFloat(price)) body.price = parseFloat(price)
        if (nameEn?.trim()) body.nameEn = nameEn.trim()
        if (nameSw?.trim()) body.nameSw = nameSw.trim()
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
      updateTranslations: async (id: string, nameEn: string | null, nameSw: string | null) => {
        try {
          await fetch(endpoint, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nameEn, nameSw }),
          })
          await fetchAll(); showMsg('success', t('app.savedSuccess'))
        } catch { showMsg('error', t('app.error')) }
      },
      updateName: async (id: string, name: string) => {
        if (!name.trim()) return
        try {
          const res = await fetch(endpoint, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name: name.trim() }),
          })
          if (res.ok) { await fetchAll(); showMsg('success', t('app.savedSuccess')) }
          else { const d = await res.json(); showMsg('error', d.error || t('app.error')) }
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
          onAdd={() => {
            const tr = translations['classrooms'] || { en: '', sw: '' }
            classroomH.add(newClassName, () => {
              setNewClassName('')
              setTranslations(prev => { const next = { ...prev }; delete next['classrooms']; return next })
            }, undefined, tr.en, tr.sw)
          }}
          onDelete={classroomH.del}
          onMove={classroomH.move}
          placeholder={t('admin.newClassName')}
          t={t}
          locale={locale}
          newNameEn={translations['classrooms']?.en || ''}
          setNewNameEn={(v) => setTranslations(prev => ({ ...prev, classrooms: { en: v, sw: prev['classrooms']?.sw || '' } }))}
          newNameSw={translations['classrooms']?.sw || ''}
          setNewNameSw={(v) => setTranslations(prev => ({ ...prev, classrooms: { en: prev['classrooms']?.en || '', sw: v } }))}
          translating={translating === 'classrooms'}
          onTranslate={() => translateName(newClassName, 'classrooms')}
          onUpdateTranslations={classroomH.updateTranslations}
          onNameChange={classroomH.updateName}
        />

        <CodelistSection
          title={t('admin.healthTypes')}
          icon={Stethoscope}
          items={healthTypes}
          newName={newHealthTypeName}
          setNewName={setNewHealthTypeName}
          onAdd={() => {
            const tr = translations['healthTypes'] || { en: '', sw: '' }
            healthTypeH.add(newHealthTypeName, () => {
              setNewHealthTypeName('')
              setTranslations(prev => { const next = { ...prev }; delete next['healthTypes']; return next })
            }, undefined, tr.en, tr.sw)
          }}
          onDelete={healthTypeH.del}
          onMove={healthTypeH.move}
          placeholder={t('admin.newHealthTypeName')}
          t={t}
          locale={locale}
          newNameEn={translations['healthTypes']?.en || ''}
          setNewNameEn={(v) => setTranslations(prev => ({ ...prev, healthTypes: { en: v, sw: prev['healthTypes']?.sw || '' } }))}
          newNameSw={translations['healthTypes']?.sw || ''}
          setNewNameSw={(v) => setTranslations(prev => ({ ...prev, healthTypes: { en: prev['healthTypes']?.en || '', sw: v } }))}
          translating={translating === 'healthTypes'}
          onTranslate={() => translateName(newHealthTypeName, 'healthTypes')}
          onUpdateTranslations={healthTypeH.updateTranslations}
          onNameChange={healthTypeH.updateName}
        />

        <CodelistSection
          title={t('admin.paymentTypes')}
          icon={CreditCard}
          items={paymentTypes}
          newName={newPaymentTypeName}
          setNewName={setNewPaymentTypeName}
          onAdd={() => {
            const tr = translations['paymentTypes'] || { en: '', sw: '' }
            paymentTypeH.add(newPaymentTypeName, () => {
              setNewPaymentTypeName('')
              setTranslations(prev => { const next = { ...prev }; delete next['paymentTypes']; return next })
            }, undefined, tr.en, tr.sw)
          }}
          onDelete={paymentTypeH.del}
          onMove={paymentTypeH.move}
          placeholder={t('admin.newPaymentTypeName')}
          t={t}
          locale={locale}
          newNameEn={translations['paymentTypes']?.en || ''}
          setNewNameEn={(v) => setTranslations(prev => ({ ...prev, paymentTypes: { en: v, sw: prev['paymentTypes']?.sw || '' } }))}
          newNameSw={translations['paymentTypes']?.sw || ''}
          setNewNameSw={(v) => setTranslations(prev => ({ ...prev, paymentTypes: { en: prev['paymentTypes']?.en || '', sw: v } }))}
          translating={translating === 'paymentTypes'}
          onTranslate={() => translateName(newPaymentTypeName, 'paymentTypes')}
          onUpdateTranslations={paymentTypeH.updateTranslations}
          onNameChange={paymentTypeH.updateName}
        />

        <CodelistSection
          title={t('admin.needTypes')}
          icon={Heart}
          items={needTypes}
          newName={newNeedTypeName}
          setNewName={setNewNeedTypeName}
          onAdd={() => {
            const tr = translations['needTypes'] || { en: '', sw: '' }
            needTypeH.add(newNeedTypeName, () => {
              setNewNeedTypeName(''); setNewNeedTypePrice('')
              setTranslations(prev => { const next = { ...prev }; delete next['needTypes']; return next })
            }, newNeedTypePrice, tr.en, tr.sw)
          }}
          onDelete={needTypeH.del}
          onMove={needTypeH.move}
          placeholder={t('admin.newNeedTypeName')}
          t={t}
          locale={locale}
          showPrice
          newPrice={newNeedTypePrice}
          setNewPrice={setNewNeedTypePrice}
          onPriceChange={needTypeH.updatePrice}
          newNameEn={translations['needTypes']?.en || ''}
          setNewNameEn={(v) => setTranslations(prev => ({ ...prev, needTypes: { en: v, sw: prev['needTypes']?.sw || '' } }))}
          newNameSw={translations['needTypes']?.sw || ''}
          setNewNameSw={(v) => setTranslations(prev => ({ ...prev, needTypes: { en: prev['needTypes']?.en || '', sw: v } }))}
          translating={translating === 'needTypes'}
          onTranslate={() => translateName(newNeedTypeName, 'needTypes')}
          onUpdateTranslations={needTypeH.updateTranslations}
          onNameChange={needTypeH.updateName}
        />

        <CodelistSection
          title={t('admin.equipmentTypes')}
          icon={Package}
          items={equipmentTypes}
          newName={newEquipmentTypeName}
          setNewName={setNewEquipmentTypeName}
          onAdd={() => {
            const tr = translations['equipmentTypes'] || { en: '', sw: '' }
            equipmentTypeH.add(newEquipmentTypeName, () => {
              setNewEquipmentTypeName(''); setNewEquipmentTypePrice('')
              setTranslations(prev => { const next = { ...prev }; delete next['equipmentTypes']; return next })
            }, newEquipmentTypePrice, tr.en, tr.sw)
          }}
          onDelete={equipmentTypeH.del}
          onMove={equipmentTypeH.move}
          placeholder={t('admin.newEquipmentTypeName')}
          t={t}
          locale={locale}
          showPrice
          newPrice={newEquipmentTypePrice}
          setNewPrice={setNewEquipmentTypePrice}
          onPriceChange={equipmentTypeH.updatePrice}
          newNameEn={translations['equipmentTypes']?.en || ''}
          setNewNameEn={(v) => setTranslations(prev => ({ ...prev, equipmentTypes: { en: v, sw: prev['equipmentTypes']?.sw || '' } }))}
          newNameSw={translations['equipmentTypes']?.sw || ''}
          setNewNameSw={(v) => setTranslations(prev => ({ ...prev, equipmentTypes: { en: prev['equipmentTypes']?.en || '', sw: v } }))}
          translating={translating === 'equipmentTypes'}
          onTranslate={() => translateName(newEquipmentTypeName, 'equipmentTypes')}
          onUpdateTranslations={equipmentTypeH.updateTranslations}
          onNameChange={equipmentTypeH.updateName}
        />

        <CodelistSection
          title={t('admin.wishTypes')}
          icon={Star}
          items={wishTypes}
          newName={newWishTypeName}
          setNewName={setNewWishTypeName}
          onAdd={() => {
            const tr = translations['wishTypes'] || { en: '', sw: '' }
            wishTypeH.add(newWishTypeName, () => {
              setNewWishTypeName(''); setNewWishTypePrice('')
              setTranslations(prev => { const next = { ...prev }; delete next['wishTypes']; return next })
            }, newWishTypePrice, tr.en, tr.sw)
          }}
          onDelete={wishTypeH.del}
          onMove={wishTypeH.move}
          placeholder={t('admin.newWishTypeName')}
          t={t}
          locale={locale}
          showPrice
          newPrice={newWishTypePrice}
          setNewPrice={setNewWishTypePrice}
          onPriceChange={wishTypeH.updatePrice}
          newNameEn={translations['wishTypes']?.en || ''}
          setNewNameEn={(v) => setTranslations(prev => ({ ...prev, wishTypes: { en: v, sw: prev['wishTypes']?.sw || '' } }))}
          newNameSw={translations['wishTypes']?.sw || ''}
          setNewNameSw={(v) => setTranslations(prev => ({ ...prev, wishTypes: { en: prev['wishTypes']?.en || '', sw: v } }))}
          translating={translating === 'wishTypes'}
          onTranslate={() => translateName(newWishTypeName, 'wishTypes')}
          onUpdateTranslations={wishTypeH.updateTranslations}
          onNameChange={wishTypeH.updateName}
        />
      </div>

      {/* Voucher Rates */}
      <div className="mt-6">
        <VoucherRateSection
          items={voucherRates}
          newCurrency={newVRCurrency}
          setNewCurrency={setNewVRCurrency}
          newRate={newVRRate}
          setNewRate={setNewVRRate}
          onAdd={async () => {
            if (!newVRCurrency.trim() || !newVRRate || parseFloat(newVRRate) <= 0) return
            try {
              const res = await fetch('/api/admin/voucher-rates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency: newVRCurrency.trim(), rate: parseFloat(newVRRate) }),
              })
              if (res.ok) { setNewVRCurrency(''); setNewVRRate(''); await fetchAll(); showMsg('success', t('app.savedSuccess')) }
              else { const d = await res.json(); showMsg('error', d.error || t('app.error')) }
            } catch { showMsg('error', t('app.error')) }
          }}
          onDelete={async (id) => {
            if (!confirm(t('app.confirmDelete'))) return
            try {
              await fetch('/api/admin/voucher-rates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
              await fetchAll(); showMsg('success', t('app.deleteSuccess'))
            } catch { showMsg('error', t('app.error')) }
          }}
          onUpdate={async (id, rate) => {
            try {
              await fetch('/api/admin/voucher-rates', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, rate }),
              })
              await fetchAll(); showMsg('success', t('app.savedSuccess'))
            } catch { showMsg('error', t('app.error')) }
          }}
          t={t}
        />
      </div>

      {/* Tuition Rates */}
      <div className="mt-6">
        <TuitionRateSection
          items={tuitionRates}
          onUpdate={async (id, annualFee) => {
            try {
              await fetch('/api/admin/tuition-rates', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, annualFee }),
              })
              await fetchAll(); showMsg('success', t('app.savedSuccess'))
            } catch { showMsg('error', t('app.error')) }
          }}
          onDelete={async (id) => {
            if (!confirm(t('app.confirmDelete'))) return
            try {
              await fetch('/api/admin/tuition-rates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
              await fetchAll(); showMsg('success', t('app.deleteSuccess'))
            } catch { showMsg('error', t('app.error')) }
          }}
          t={t}
        />
      </div>

      {/* Backup & Export */}
      <div className="mt-6">
        <BackupSection t={t} showMsg={showMsg} />
      </div>

      {/* Audit Log */}
      <div className="mt-6">
        <AuditLogSection t={t} />
      </div>
    </div>
  )
}
