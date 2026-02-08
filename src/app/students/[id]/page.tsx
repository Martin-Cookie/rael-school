'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, X, Edit3, User, Camera, Ticket,
  HandHeart, Stethoscope, Plus, Check, Trash2
} from 'lucide-react'
import { formatDate, formatDateForInput, formatCurrency, formatNumber, calculateAge } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type Tab = 'personal' | 'photos' | 'vouchers' | 'sponsors' | 'health'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [locale, setLocale] = useState<Locale>('cs')
  const [showConfirm, setShowConfirm] = useState(false)

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetchStudent()
  }, [id])

  async function fetchStudent() {
    try {
      const res = await fetch(`/api/students/${id}`)
      const data = await res.json()
      setStudent(data.student)
      setEditData(data.student)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  async function handleSave() {
    setShowConfirm(false)
    setSaving(true)
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        await fetchStudent()
        setEditMode(false)
        showMessage('success', t('app.savedSuccess'))
      } else {
        showMessage('error', t('app.error'))
      }
    } catch {
      showMessage('error', t('app.error'))
    }
    setSaving(false)
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  function cancelEdit() {
    setEditData(student)
    setEditMode(false)
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'personal', label: t('student.tabs.personal'), icon: User },
    { key: 'photos', label: t('student.tabs.photos'), icon: Camera },
    { key: 'vouchers', label: t('student.tabs.vouchers'), icon: Ticket },
    { key: 'sponsors', label: t('student.tabs.sponsors'), icon: HandHeart },
    { key: 'health', label: t('student.tabs.health'), icon: Stethoscope },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) {
    return <div className="text-center py-12 text-gray-500">Student not found</div>
  }

  const conditionBadge = (condition: string) => {
    const map: Record<string, string> = {
      new: 'badge-green',
      satisfactory: 'badge-yellow',
      poor: 'badge-red',
    }
    const labelMap: Record<string, string> = {
      new: t('equipment.new'),
      satisfactory: t('equipment.satisfactory'),
      poor: t('equipment.poor'),
    }
    return <span className={`badge ${map[condition] || 'badge-yellow'}`}>{labelMap[condition] || condition}</span>
  }

  const equipmentLabel = (type: string) => {
    const map: Record<string, string> = {
      bed: t('equipment.bed'),
      mattress: t('equipment.mattress'),
      blanket: t('equipment.blanket'),
      mosquito_net: t('equipment.mosquito_net'),
    }
    return map[type] || type
  }

  // Voucher calculations
  const totalPurchased = student.vouchers?.reduce((sum: number, v: any) => sum + v.count, 0) || 0
  const totalUsed = student.voucherUsages?.reduce((sum: number, v: any) => sum + v.count, 0) || 0
  const totalAmount = student.vouchers?.reduce((sum: number, v: any) => sum + v.amount, 0) || 0
  const available = totalPurchased - totalUsed

  return (
    <div>
      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('app.confirm')}</h3>
            <p className="text-gray-600 mb-6">{t('app.confirmSave')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                {t('app.cancel')}
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium">
                {t('app.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast message */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${message.type === 'success' ? 'bg-primary-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/students')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
            <p className="text-sm text-gray-500">{student.studentNo} • {student.className || '-'} • {calculateAge(student.dateOfBirth)} {locale === 'cs' ? 'let' : locale === 'sw' ? 'miaka' : 'years'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                <X className="w-4 h-4" /> {t('app.cancel')}
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? '...' : t('app.save')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" /> {t('app.edit')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* ===== PERSONAL TAB ===== */}
        {activeTab === 'personal' && (
          <div className="space-y-8">
            {/* Basic info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('student.tabs.personal')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t('student.firstName')} value={editData.firstName} field="firstName" editMode={editMode} onChange={(v) => setEditData({ ...editData, firstName: v })} />
                <Field label={t('student.lastName')} value={editData.lastName} field="lastName" editMode={editMode} onChange={(v) => setEditData({ ...editData, lastName: v })} />
                <Field label={t('student.dateOfBirth')} value={formatDateForInput(editData.dateOfBirth)} field="dateOfBirth" type="date" editMode={editMode} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} />
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('student.gender')}</label>
                  {editMode ? (
                    <select value={editData.gender || ''} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">-</option>
                      <option value="M">{t('student.male')}</option>
                      <option value="F">{t('student.female')}</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2">{student.gender === 'M' ? t('student.male') : student.gender === 'F' ? t('student.female') : '-'}</p>
                  )}
                </div>
                <Field label={t('student.className')} value={editData.className} field="className" editMode={editMode} onChange={(v) => setEditData({ ...editData, className: v })} />
                <Field label={t('student.healthStatus')} value={editData.healthStatus} field="healthStatus" editMode={editMode} onChange={(v) => setEditData({ ...editData, healthStatus: v })} />
              </div>
            </div>

            {/* Family */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('student.family.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t('student.family.motherName')} value={editData.motherName} field="motherName" editMode={editMode} onChange={(v) => setEditData({ ...editData, motherName: v })} />
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('student.family.motherAlive')}</label>
                  {editMode ? (
                    <select value={editData.motherAlive === null ? '' : String(editData.motherAlive)} onChange={(e) => setEditData({ ...editData, motherAlive: e.target.value === '' ? null : e.target.value === 'true' })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">-</option>
                      <option value="true">{t('app.yes')}</option>
                      <option value="false">{t('app.no')}</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2">{student.motherAlive === true ? t('app.yes') : student.motherAlive === false ? t('app.no') : '-'}</p>
                  )}
                </div>
                <Field label={t('student.family.fatherName')} value={editData.fatherName} field="fatherName" editMode={editMode} onChange={(v) => setEditData({ ...editData, fatherName: v })} />
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('student.family.fatherAlive')}</label>
                  {editMode ? (
                    <select value={editData.fatherAlive === null ? '' : String(editData.fatherAlive)} onChange={(e) => setEditData({ ...editData, fatherAlive: e.target.value === '' ? null : e.target.value === 'true' })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">-</option>
                      <option value="true">{t('app.yes')}</option>
                      <option value="false">{t('app.no')}</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2">{student.fatherAlive === true ? t('app.yes') : student.fatherAlive === false ? t('app.no') : '-'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Field label={t('student.family.siblings')} value={editData.siblings} field="siblings" editMode={editMode} onChange={(v) => setEditData({ ...editData, siblings: v })} />
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('equipment.title')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.type')}</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.condition')}</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.acquiredAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.equipment?.map((eq: any) => (
                      <tr key={eq.id} className="border-b border-gray-50">
                        <td className="py-3 px-3 text-sm text-gray-900">{equipmentLabel(eq.type)}</td>
                        <td className="py-3 px-3 text-sm">{conditionBadge(eq.condition)}</td>
                        <td className="py-3 px-3 text-sm text-gray-900">{formatDate(eq.acquiredAt, locale)}</td>
                      </tr>
                    ))}
                    {(!student.equipment || student.equipment.length === 0) && (
                      <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Needs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('needs.title')}</h3>
              <div className="space-y-2">
                {student.needs?.map((need: any) => (
                  <div key={need.id} className={`flex items-center justify-between p-3 rounded-lg ${need.isFulfilled ? 'bg-primary-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${need.isFulfilled ? 'bg-primary-500' : 'bg-gray-300'}`}>
                        {need.isFulfilled && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm ${need.isFulfilled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {need.description}
                      </span>
                    </div>
                    {need.isFulfilled && (
                      <span className="text-xs text-gray-500">{formatDate(need.fulfilledAt, locale)}</span>
                    )}
                  </div>
                ))}
                {(!student.needs || student.needs.length === 0) && (
                  <p className="text-gray-500 text-sm text-center py-4">{t('app.noData')}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('student.notes')}</h3>
              {editMode ? (
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{student.notes || '-'}</p>
              )}
            </div>
          </div>
        )}

        {/* ===== PHOTOS TAB ===== */}
        {activeTab === 'photos' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('photos.title')}</h3>
            {student.photos?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {student.photos.map((photo: any) => (
                  <div key={photo.id} className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{photo.description || '-'}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(photo.takenAt, locale)}</p>
                    <span className="badge badge-green mt-1">
                      {photo.category === 'visit' ? t('photos.visit') : photo.category === 'handover' ? t('photos.handover') : t('photos.voucher')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('photos.noPhotos')}</p>
            )}
          </div>
        )}

        {/* ===== VOUCHERS TAB ===== */}
        {activeTab === 'vouchers' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('vouchers.title')}</h3>
            
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium">{t('vouchers.totalAmount')}</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4">
                <p className="text-xs text-primary-600 font-medium">{t('vouchers.totalPurchased')}</p>
                <p className="text-xl font-bold text-primary-900">{formatNumber(totalPurchased)}</p>
              </div>
              <div className="bg-accent-50 rounded-xl p-4">
                <p className="text-xs text-accent-600 font-medium">{t('vouchers.totalUsed')}</p>
                <p className="text-xl font-bold text-accent-900">{formatNumber(totalUsed)}</p>
              </div>
              <div className={`rounded-xl p-4 ${available > 0 ? 'bg-primary-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-medium ${available > 0 ? 'text-primary-600' : 'text-red-600'}`}>{t('vouchers.available')}</p>
                <p className={`text-xl font-bold ${available > 0 ? 'text-primary-900' : 'text-red-900'}`}>{formatNumber(available)}</p>
              </div>
            </div>

            {/* Purchases table */}
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('vouchers.purchases')}</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.purchaseDate')}</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.amount')}</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.count')}</th>
                  </tr>
                </thead>
                <tbody>
                  {student.vouchers?.map((v: any) => (
                    <tr key={v.id} className="border-b border-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-900">{formatDate(v.purchaseDate, locale)}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 text-right">{formatCurrency(v.amount)}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 text-right">{formatNumber(v.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Usages table */}
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('vouchers.usages')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.usageDate')}</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{t('vouchers.usedCount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {student.voucherUsages?.map((v: any) => (
                    <tr key={v.id} className="border-b border-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-900">{formatDate(v.usageDate, locale)}</td>
                      <td className="py-3 px-3 text-sm text-gray-900 text-right">{formatNumber(v.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== SPONSORS TAB ===== */}
        {activeTab === 'sponsors' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('sponsors.title')}</h3>
            {student.sponsorships?.length > 0 ? (
              <div className="space-y-4">
                {student.sponsorships.map((sp: any) => (
                  <div key={sp.id} className="bg-accent-50 rounded-xl p-5 border border-accent-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent-200 rounded-full flex items-center justify-center">
                        <HandHeart className="w-5 h-5 text-accent-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{sp.sponsor.firstName} {sp.sponsor.lastName}</h4>
                        <p className="text-sm text-gray-600">{sp.sponsor.email}</p>
                        {sp.sponsor.phone && <p className="text-sm text-gray-600">{sp.sponsor.phone}</p>}
                        <p className="text-xs text-gray-500 mt-2">
                          {t('sponsors.startDate')}: {formatDate(sp.startDate, locale)}
                        </p>
                        {sp.notes && <p className="text-sm text-gray-700 mt-2">{sp.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('sponsors.noSponsors')}</p>
            )}
          </div>
        )}

        {/* ===== HEALTH TAB ===== */}
        {activeTab === 'health' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('health.title')}</h3>
            {student.healthChecks?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('health.checkDate')}</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('health.checkType')}</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('health.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.healthChecks.map((hc: any) => (
                      <tr key={hc.id} className="border-b border-gray-50">
                        <td className="py-3 px-3 text-sm text-gray-900">{formatDate(hc.checkDate, locale)}</td>
                        <td className="py-3 px-3 text-sm">
                          <span className={`badge ${hc.checkType === 'urgent' ? 'badge-red' : hc.checkType === 'dentist' ? 'badge-yellow' : 'badge-green'}`}>
                            {t(`health.${hc.checkType}`)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-700">{hc.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('health.noChecks')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Reusable field component
function Field({ label, value, field, type = 'text', editMode, onChange }: {
  label: string; value: any; field: string; type?: string; editMode: boolean; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      {editMode ? (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
        />
      ) : (
        <p className="text-gray-900 py-2">{type === 'date' ? formatDate(value) : value || '-'}</p>
      )}
    </div>
  )
}
