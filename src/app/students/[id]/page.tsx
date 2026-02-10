'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, X, Edit3, User, Camera, Ticket,
  HandHeart, Stethoscope, Plus, Check, Trash2, Upload,
  Pencil, Package, Heart, CreditCard
} from 'lucide-react'
import { formatDate, formatDateForInput, formatNumber, calculateAge } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }
const CURRENCIES = ['KES', 'CZK', 'USD', 'EUR']
type Tab = 'personal' | 'equipment' | 'needs' | 'vouchers' | 'photos' | 'sponsors' | 'health' | 'sponsorPayments'
function fmtCurrency(amount: number, currency: string): string { return `${formatNumber(amount)} ${currency}` }

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [editEquipment, setEditEquipment] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [locale, setLocale] = useState<Locale>('cs')
  const [showConfirm, setShowConfirm] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [currency, setCurrency] = useState('KES')
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [healthTypes, setHealthTypes] = useState<any[]>([])
  const [paymentTypes, setPaymentTypes] = useState<any[]>([])

  const [newNeed, setNewNeed] = useState('')
  const [showAddNeed, setShowAddNeed] = useState(false)
  const [newVoucher, setNewVoucher] = useState({ type: 'purchase', date: '', amount: '', count: '', donorName: '', notes: '' })
  const [showAddVoucher, setShowAddVoucher] = useState(false)
  const [newHealth, setNewHealth] = useState({ checkDate: '', checkType: '', notes: '' })
  const [showAddHealth, setShowAddHealth] = useState(false)
  const [showAddSponsor, setShowAddSponsor] = useState(false)
  const [sponsorSearch, setSponsorSearch] = useState('')
  const [sponsorResults, setSponsorResults] = useState<any[]>([])
  const [showSponsorSearch, setShowSponsorSearch] = useState(false)
  const [newSponsor, setNewSponsor] = useState({ firstName: '', lastName: '', email: '', phone: '', startDate: '', notes: '' })
  const [editingSponsor, setEditingSponsor] = useState<string | null>(null)
  const [editSponsorData, setEditSponsorData] = useState<any>({})
  const [photoFilter, setPhotoFilter] = useState('all')
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ category: 'visit', description: '', takenAt: '', file: null as File | null })
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ paymentDate: '', amount: '', currency: 'KES', paymentType: '', sponsorId: '', notes: '' })

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const savedC = localStorage.getItem('rael-currency')
    if (savedC) setCurrency(savedC)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => { fetchStudent(); fetchUser(); fetchClassrooms(); fetchHealthTypes(); fetchPaymentTypes() }, [id])

  async function fetchUser() {
    try { const res = await fetch('/api/auth/me'); const d = await res.json(); if (d.user) setUserRole(d.user.role) } catch {}
  }

  async function fetchHealthTypes() {
    try { const res = await fetch("/api/admin/health-types"); const d = await res.json(); setHealthTypes(d.healthTypes || []) } catch {}
  }

  async function fetchClassrooms() {
    try { const res = await fetch('/api/admin/classrooms'); const d = await res.json(); setClassrooms(d.classrooms || []) } catch {}
  }


  async function fetchPaymentTypes() {
    try { const res = await fetch('/api/admin/payment-types'); const d = await res.json(); setPaymentTypes(d.paymentTypes || []) } catch {}
  }



  async function fetchStudent() {
    try {
      const res = await fetch(`/api/students/${id}`)
      const data = await res.json()
      setStudent(data.student)
      setEditData(data.student)
      setEditEquipment(data.student.equipment?.map((eq: any) => ({ ...eq })) || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  const canEditData = ['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(userRole)

  async function handleSave() {
    setShowConfirm(false); setSaving(true)
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) })
      await fetch(`/api/students/${id}/equipment`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ equipment: editEquipment }) })
      if (res.ok) { await fetchStudent(); setEditMode(false); showMsg('success', t('app.savedSuccess')) }
      else showMsg('error', t('app.error'))
    } catch { showMsg('error', t('app.error')) }
    setSaving(false)
  }

  function showMsg(type: 'success' | 'error', text: string) { setMessage({ type, text }); setTimeout(() => setMessage(null), 3000) }
  function cancelEdit() { setEditData(student); setEditEquipment(student.equipment?.map((eq: any) => ({ ...eq })) || []); setEditMode(false) }
  function changeCurrency(c: string) { setCurrency(c); localStorage.setItem('rael-currency', c) }

  // Get sponsor names for donor dropdown
  const sponsorNames = student?.sponsorships?.filter((s: any) => s.isActive).map((s: any) => `${s.sponsor.firstName} ${s.sponsor.lastName}`) || []
  const defaultDonor = sponsorNames[0] || ''

  // ---- CRUD handlers ----
  async function addNeed() {
    if (!newNeed.trim()) return
    try {
      const res = await fetch(`/api/students/${id}/needs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: newNeed }) })
      if (res.ok) { setNewNeed(''); setShowAddNeed(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function toggleNeedFulfilled(needId: string, current: boolean) {
    try {
      const need = student.needs.find((n: any) => n.id === needId)
      await fetch(`/api/students/${id}/needs`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ needId, description: need.description, isFulfilled: !current }) })
      await fetchStudent()
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteNeed(needId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/needs`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ needId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }
  async function addVoucher() {
    if (!newVoucher.date || !newVoucher.count) return
    try {
      const payload = { ...newVoucher, donorName: newVoucher.donorName || defaultDonor }
      const res = await fetch(`/api/students/${id}/vouchers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { setNewVoucher({ type: 'purchase', date: '', amount: '', count: '', donorName: '', notes: '' }); setShowAddVoucher(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteVoucher(voucherId: string, type: 'purchase' | 'usage') {
    if (!confirm(t('app.confirmDelete'))) return
    try {
      const res = await fetch(`/api/students/${id}/vouchers`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voucherId, type }) })
      if (res.ok) { await fetchStudent(); showMsg('success', t('app.deleteSuccess')) }
      else showMsg('error', t('app.error'))
    } catch { showMsg('error', t('app.error')) }
  }
  async function addHealthCheck() {
    if (!newHealth.checkDate || !newHealth.checkType) return
    try {
      const res = await fetch(`/api/students/${id}/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newHealth) })
      if (res.ok) { setNewHealth({ checkDate: '', checkType: '', notes: '' }); setShowAddHealth(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteHealthCheck(checkId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/health`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }
  async function addPhoto() {
    if (!newPhoto.file) return
    try {
      const fd = new FormData(); fd.append('file', newPhoto.file); fd.append('category', newPhoto.category); fd.append('description', newPhoto.description); if (newPhoto.takenAt) fd.append('takenAt', newPhoto.takenAt)
      const res = await fetch(`/api/students/${id}/photos`, { method: 'POST', body: fd })
      if (res.ok) { setNewPhoto({ category: 'visit', description: '', takenAt: '', file: null }); setShowAddPhoto(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function deletePhoto(photoId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/photos`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }

  async function searchSponsors(query: string) {
    setSponsorSearch(query)
    if (query.length < 1) { setSponsorResults([]); return }
    try {
      const res = await fetch('/api/sponsors/search?q=' + encodeURIComponent(query))
      const data = await res.json()
      setSponsorResults(data.sponsors || [])
    } catch { setSponsorResults([]) }
  }

  async function addExistingSponsor(sponsorUserId: string) {
    try {
      const sponsor = sponsorResults.find((s: any) => s.id === sponsorUserId)
      if (!sponsor) return
      const res = await fetch(`/api/students/${id}/sponsors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: sponsor.firstName,
          lastName: sponsor.lastName,
          email: sponsor.email,
          phone: sponsor.phone || '',
          startDate: new Date().toISOString().split('T')[0],
        }),
      })
      if (res.ok) {
        setSponsorSearch('')
        setSponsorResults([])
        setShowSponsorSearch(false)
        fetchStudent()
        showToast('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showToast('error', d.error || t('app.error'))
      }
    } catch { showToast('error', t('app.error')) }
  }

  async function addSponsor() {
    if (!newSponsor.firstName || !newSponsor.lastName || !newSponsor.email) { showMsg('error', 'Vyplňte jméno, příjmení a email'); return }
    try {
      const res = await fetch(`/api/students/${id}/sponsors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSponsor) })
      if (res.ok) { setNewSponsor({ firstName: '', lastName: '', email: '', phone: '', startDate: '', notes: '' }); setShowAddSponsor(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
      else { const d = await res.json(); showMsg('error', d.error || t('app.error')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function saveSponsorEdit(sponsorshipId: string, sponsorUserId: string) {
    try {
      await fetch(`/api/students/${id}/sponsors`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sponsorshipId, sponsorUserId, ...editSponsorData }) })
      setEditingSponsor(null); await fetchStudent(); showMsg('success', t('app.savedSuccess'))
    } catch { showMsg('error', t('app.error')) }
  }
  async function uploadProfilePhoto(file: File) {
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`/api/students/${id}/profile-photo`, { method: 'POST', body: fd })
      if (res.ok) { await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function addSponsorPayment() {
    if (!newPayment.paymentDate || !newPayment.amount || !newPayment.paymentType) return
    try {
      const res = await fetch(`/api/students/${id}/sponsor-payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPayment) })
      if (res.ok) { setNewPayment({ paymentDate: '', amount: '', currency: 'KES', paymentType: '', sponsorId: '', notes: '' }); setShowAddPayment(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteSponsorPayment(paymentId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/sponsor-payments`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }

  function updateEquipment(idx: number, field: string, value: string) { const u = [...editEquipment]; u[idx] = { ...u[idx], [field]: value }; setEditEquipment(u) }
  function ensureEquipmentItems() {
    const types = ['bed', 'mattress', 'blanket', 'mosquito_net']
    const current = editEquipment.map((e: any) => e.type)
    const missing = types.filter(t => !current.includes(t))
    if (missing.length > 0) setEditEquipment([...editEquipment, ...missing.map(type => ({ type, condition: 'new', acquiredAt: '', notes: '' }))])
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'personal', label: t('student.tabs.personal'), icon: User },
    { key: 'equipment', label: t('equipment.title'), icon: Package },
    { key: 'needs', label: t('needs.title'), icon: Heart },
    { key: 'vouchers', label: t('student.tabs.vouchers'), icon: Ticket },
    { key: 'photos', label: t('student.tabs.photos'), icon: Camera },
    { key: 'sponsors', label: t('student.tabs.sponsors'), icon: HandHeart },
    { key: 'sponsorPayments', label: t('sponsorPayments.title'), icon: CreditCard },
    { key: 'health', label: t('student.tabs.health'), icon: Stethoscope },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!student) return <div className="text-center py-12 text-gray-500">Student not found</div>

  const condBadge = (c: string) => { const m: Record<string,string> = { new:'badge-green', satisfactory:'badge-yellow', poor:'badge-red' }; const l: Record<string,string> = { new:t('equipment.new'), satisfactory:t('equipment.satisfactory'), poor:t('equipment.poor') }; return <span className={`badge ${m[c]||'badge-yellow'}`}>{l[c]||c}</span> }
  const eqLabel = (type: string) => ({ bed:t('equipment.bed'), mattress:t('equipment.mattress'), blanket:t('equipment.blanket'), mosquito_net:t('equipment.mosquito_net') }[type] || type)
  const htLabel = (type: string) => { const found = healthTypes.find((ht: any) => ht.name === type); return found ? found.name : type }
  const ptLabel = (type: string) => { const found = paymentTypes.find((pt: any) => pt.name === type); return found ? found.name : type }

  const totalPurchased = student.vouchers?.reduce((s: number, v: any) => s + v.count, 0) || 0
  const totalUsed = student.voucherUsages?.reduce((s: number, v: any) => s + v.count, 0) || 0
  const totalAmount = student.vouchers?.reduce((s: number, v: any) => s + v.amount, 0) || 0
  const available = totalPurchased - totalUsed
  const filteredPhotos = photoFilter === 'all' ? (student.photos || []) : (student.photos || []).filter((p: any) => p.category === photoFilter)

  return (
    <div>
      {showConfirm && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"><h3 className="text-lg font-semibold text-gray-900 mb-2">{t('app.confirm')}</h3><p className="text-gray-600 mb-6">{t('app.confirmSave')}</p><div className="flex gap-3"><button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">{t('app.cancel')}</button><button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium">{t('app.save')}</button></div></div></div>}
      {message && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>{message.text}</div>}

      {/* Header with profile photo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/students')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div className="relative group">
            {student.profilePhoto ? (
              <img src={student.profilePhoto} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center border-2 border-gray-200"><User className="w-7 h-7 text-primary-600" /></div>
            )}
            {canEditData && (
              <label className="absolute inset-0 rounded-full cursor-pointer bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadProfilePhoto(e.target.files[0]) }} />
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
            <p className="text-sm text-gray-500">{student.studentNo} • {student.className || '-'} • {calculateAge(student.dateOfBirth)} {locale === 'cs' ? 'let' : locale === 'sw' ? 'miaka' : 'years'}</p>
          </div>
        </div>
        {canEditData && (
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"><X className="w-4 h-4" /> {t('app.cancel')}</button>
                <button onClick={() => setShowConfirm(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? '...' : t('app.save')}</button>
              </>
            ) : (
              <button onClick={() => { setEditMode(true); ensureEquipmentItems() }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"><Edit3 className="w-4 h-4" /> {t('app.edit')}</button>
            )}
          </div>
        )}
      </div>
      {editMode && <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">✏️ {t('app.editMode')}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* ===== PERSONAL ===== */}
        {activeTab === 'personal' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('student.tabs.personal')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t('student.firstName')} value={editData.firstName} editMode={editMode} onChange={(v) => setEditData({ ...editData, firstName: v })} />
                <Field label={t('student.lastName')} value={editData.lastName} editMode={editMode} onChange={(v) => setEditData({ ...editData, lastName: v })} />
                <Field label={t('student.dateOfBirth')} value={formatDateForInput(editData.dateOfBirth)} type="date" editMode={editMode} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} />
                <SelectField label={t('student.gender')} value={editData.gender || ''} editMode={editMode} options={[{ value: '', label: '-' }, { value: 'M', label: t('student.male') }, { value: 'F', label: t('student.female') }]} displayValue={student.gender === 'M' ? t('student.male') : student.gender === 'F' ? t('student.female') : '-'} onChange={(v) => setEditData({ ...editData, gender: v })} />
                <SelectField label={t('student.className')} value={editData.className || ''} editMode={editMode} options={[{ value: '', label: '-' }, ...classrooms.map((c: any) => ({ value: c.name, label: c.name }))]} displayValue={student.className || '-'} onChange={(v) => setEditData({ ...editData, className: v })} />
                <Field label={t('student.healthStatus')} value={editData.healthStatus} editMode={editMode} onChange={(v) => setEditData({ ...editData, healthStatus: v })} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('student.family.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t('student.family.motherName')} value={editData.motherName} editMode={editMode} onChange={(v) => setEditData({ ...editData, motherName: v })} />
                <SelectField label={t('student.family.motherAlive')} value={editData.motherAlive === null ? '' : String(editData.motherAlive)} editMode={editMode} options={[{ value:'',label:'-' },{ value:'true',label:t('app.yes') },{ value:'false',label:t('app.no') }]} displayValue={student.motherAlive === true ? t('app.yes') : student.motherAlive === false ? t('app.no') : '-'} onChange={(v) => setEditData({ ...editData, motherAlive: v === '' ? null : v === 'true' })} />
                <Field label={t('student.family.fatherName')} value={editData.fatherName} editMode={editMode} onChange={(v) => setEditData({ ...editData, fatherName: v })} />
                <SelectField label={t('student.family.fatherAlive')} value={editData.fatherAlive === null ? '' : String(editData.fatherAlive)} editMode={editMode} options={[{ value:'',label:'-' },{ value:'true',label:t('app.yes') },{ value:'false',label:t('app.no') }]} displayValue={student.fatherAlive === true ? t('app.yes') : student.fatherAlive === false ? t('app.no') : '-'} onChange={(v) => setEditData({ ...editData, fatherAlive: v === '' ? null : v === 'true' })} />
                <div className="md:col-span-2"><Field label={t('student.family.siblings')} value={editData.siblings} editMode={editMode} onChange={(v) => setEditData({ ...editData, siblings: v })} /></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('student.notes')}</h3>
              {editMode ? <textarea value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none" /> : <p className="text-gray-700 whitespace-pre-wrap">{student.notes || '-'}</p>}
            </div>
          </div>
        )}

        {/* ===== EQUIPMENT ===== */}
        {activeTab === 'equipment' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('equipment.title')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.type')}</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.condition')}</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('equipment.acquiredAt')}</th>
              </tr></thead><tbody>
                {editMode ? editEquipment.map((eq: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-3 px-3 text-sm text-gray-900 font-medium">{eqLabel(eq.type)}</td>
                    <td className="py-3 px-3"><select value={eq.condition} onChange={(e) => updateEquipment(idx, 'condition', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"><option value="new">{t('equipment.new')}</option><option value="satisfactory">{t('equipment.satisfactory')}</option><option value="poor">{t('equipment.poor')}</option></select></td>
                    <td className="py-3 px-3"><input type="date" value={formatDateForInput(eq.acquiredAt)} onChange={(e) => updateEquipment(idx, 'acquiredAt', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                  </tr>
                )) : student.equipment?.length > 0 ? student.equipment.map((eq: any) => (
                  <tr key={eq.id} className="border-b border-gray-50">
                    <td className="py-3 px-3 text-sm text-gray-900 font-medium">{eqLabel(eq.type)}</td>
                    <td className="py-3 px-3 text-sm">{condBadge(eq.condition)}</td>
                    <td className="py-3 px-3 text-sm text-gray-900">{formatDate(eq.acquiredAt, locale)}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
              </tbody></table>
            </div>
          </div>
        )}

        {/* ===== NEEDS ===== */}
        {activeTab === 'needs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('needs.title')}</h3>
              {canEditData && <button onClick={() => setShowAddNeed(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('needs.addNeed')}</button>}
            </div>
            {showAddNeed && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200"><div className="flex gap-2">
                <input type="text" value={newNeed} onChange={(e) => setNewNeed(e.target.value)} placeholder={t('needs.description')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && addNeed()} />
                <button onClick={addNeed} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                <button onClick={() => { setShowAddNeed(false); setNewNeed('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
              </div></div>
            )}
            <div className="space-y-2">
              {student.needs?.map((need: any) => (
                <div key={need.id} className={`flex items-center justify-between p-3 rounded-lg ${need.isFulfilled ? 'bg-primary-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3">
                    {canEditData ? <button onClick={() => toggleNeedFulfilled(need.id, need.isFulfilled)} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${need.isFulfilled ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>{need.isFulfilled && <Check className="w-4 h-4 text-white" />}</button> : <div className={`w-6 h-6 rounded-full flex items-center justify-center ${need.isFulfilled ? 'bg-primary-500' : 'bg-gray-300'}`}>{need.isFulfilled && <Check className="w-4 h-4 text-white" />}</div>}
                    <span className={`text-sm ${need.isFulfilled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{need.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {need.isFulfilled && <span className="text-xs text-gray-500">{formatDate(need.fulfilledAt, locale)}</span>}
                    {canEditData && <button onClick={() => deleteNeed(need.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
              {(!student.needs || student.needs.length === 0) && <p className="text-gray-500 text-sm text-center py-4">{t('app.noData')}</p>}
            </div>
          </div>
        )}

        {/* ===== VOUCHERS ===== */}
        {activeTab === 'vouchers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{t('vouchers.title')}</h3>
                <select value={currency} onChange={(e) => changeCurrency(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              {canEditData && <button onClick={() => { setNewVoucher({ ...newVoucher, donorName: defaultDonor }); setShowAddVoucher(true) }} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('app.add')}</button>}
            </div>
            {showAddVoucher && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <select value={newVoucher.type} onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"><option value="purchase">{t('vouchers.addPurchase')}</option><option value="usage">{t('vouchers.addUsage')}</option></select>
                  <input type="date" value={newVoucher.date} onChange={(e) => setNewVoucher({ ...newVoucher, date: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  {newVoucher.type === 'purchase' && <input type="number" value={newVoucher.amount} onChange={(e) => setNewVoucher({ ...newVoucher, amount: e.target.value })} placeholder={`${t('vouchers.amount')} (${currency})`} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />}
                  <input type="number" value={newVoucher.count} onChange={(e) => setNewVoucher({ ...newVoucher, count: e.target.value })} placeholder={t('vouchers.count')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  {newVoucher.type === 'purchase' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">{t('vouchers.donorName')}</label>
                      <div className="flex gap-2">
                        <input type="text" value={newVoucher.donorName} onChange={(e) => setNewVoucher({ ...newVoucher, donorName: e.target.value })} placeholder={t('vouchers.donorName')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        {sponsorNames.length > 0 && (
                          <select onChange={(e) => setNewVoucher({ ...newVoucher, donorName: e.target.value })} value="" className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                            <option value="">{t('vouchers.selectSponsor')}</option>
                            {sponsorNames.map((n: string, i: number) => <option key={i} value={n}>{n}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input type="text" value={newVoucher.notes} onChange={(e) => setNewVoucher({ ...newVoucher, notes: e.target.value })} placeholder={t('student.notes')} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none mb-3" />
                <div className="flex gap-2">
                  <button onClick={addVoucher} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                  <button onClick={() => setShowAddVoucher(false)} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">{t('app.cancel')}</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-blue-600 font-medium">{t('vouchers.totalAmount')}</p><p className="text-xl font-bold text-blue-900">{fmtCurrency(totalAmount, currency)}</p></div>
              <div className="bg-primary-50 rounded-xl p-4"><p className="text-xs text-primary-600 font-medium">{t('vouchers.totalPurchased')}</p><p className="text-xl font-bold text-primary-900">{formatNumber(totalPurchased)}</p></div>
              <div className="bg-accent-50 rounded-xl p-4"><p className="text-xs text-accent-600 font-medium">{t('vouchers.totalUsed')}</p><p className="text-xl font-bold text-accent-900">{formatNumber(totalUsed)}</p></div>
              <div className={`rounded-xl p-4 ${available > 0 ? 'bg-primary-50' : 'bg-red-50'}`}><p className={`text-xs font-medium ${available > 0 ? 'text-primary-600' : 'text-red-600'}`}>{t('vouchers.available')}</p><p className={`text-xl font-bold ${available > 0 ? 'text-primary-900' : 'text-red-900'}`}>{formatNumber(available)}</p></div>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('vouchers.purchases')}</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full table-fixed"><thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-28">{t('vouchers.purchaseDate')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-28">{t('vouchers.amount')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-16">{t('vouchers.count')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-32">{t('vouchers.donorName')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('student.notes')}</th>
                {canEditData && <th className="w-10"></th>}
              </tr></thead><tbody>
                {student.vouchers?.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{formatDate(v.purchaseDate, locale)}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{fmtCurrency(v.amount, currency)}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{formatNumber(v.count)}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{v.donorName || '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{v.notes || '-'}</td>
                    {canEditData && <td className="py-3 px-1 text-right"><button onClick={() => deleteVoucher(v.id, 'purchase')} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>}
                  </tr>
                ))}
                {(!student.vouchers || student.vouchers.length === 0) && <tr><td colSpan={canEditData ? 6 : 5} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
              </tbody></table>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('vouchers.usages')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed"><thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-28">{t('vouchers.usageDate')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-28"></th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-16">{t('vouchers.usedCount')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-32"></th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('student.notes')}</th>
                {canEditData && <th className="w-10"></th>}
              </tr></thead><tbody>
                {student.voucherUsages?.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{formatDate(v.usageDate, locale)}</td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-sm text-gray-900">{formatNumber(v.count)}</td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-sm text-gray-500">{v.notes || '-'}</td>
                    {canEditData && <td className="py-3 px-1 text-right"><button onClick={() => deleteVoucher(v.id, 'usage')} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>}
                  </tr>
                ))}
                {(!student.voucherUsages || student.voucherUsages.length === 0) && <tr><td colSpan={canEditData ? 6 : 5} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
              </tbody></table>
            </div>
          </div>
        )}

        {/* ===== PHOTOS ===== */}
        {activeTab === 'photos' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('photos.title')}</h3>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">{[{ key:'all',label:t('photos.filterAll') },{ key:'visit',label:t('photos.visit') },{ key:'handover',label:t('photos.handover') },{ key:'voucher',label:t('photos.voucher') }].map(f => <button key={f.key} onClick={() => setPhotoFilter(f.key)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${photoFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f.label}</button>)}</div>
                {canEditData && <button onClick={() => setShowAddPhoto(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"><Upload className="w-4 h-4" /> {t('photos.upload')}</button>}
              </div>
            </div>
            {showAddPhoto && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <select value={newPhoto.category} onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm"><option value="visit">{t('photos.visit')}</option><option value="handover">{t('photos.handover')}</option><option value="voucher">{t('photos.voucher')}</option></select>
                  <input type="date" value={newPhoto.takenAt} onChange={(e) => setNewPhoto({ ...newPhoto, takenAt: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="text" value={newPhoto.description} onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })} placeholder={t('photos.description')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="file" accept="image/*" onChange={(e) => setNewPhoto({ ...newPhoto, file: e.target.files?.[0] || null })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                </div>
                <div className="flex gap-2"><button onClick={addPhoto} disabled={!newPhoto.file} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{t('photos.upload')}</button><button onClick={() => setShowAddPhoto(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
              </div>
            )}
            {filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filteredPhotos.map((photo: any) => (
                <div key={photo.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                  {photo.filePath ? <img src={photo.filePath} alt={photo.description || ''} className="w-full h-48 object-cover" /> : <div className="w-full h-48 bg-gray-200 flex items-center justify-center"><Camera className="w-12 h-12 text-gray-400" /></div>}
                  <div className="p-3">
                    <div className="flex items-start justify-between"><p className="text-sm font-medium text-gray-900">{photo.description || '-'}</p>{canEditData && <button onClick={() => deletePhoto(photo.id)} className="p-1 text-gray-400 hover:text-red-500 -mt-1 -mr-1"><Trash2 className="w-4 h-4" /></button>}</div>
                    <div className="flex items-center justify-between mt-2"><span className="text-xs text-gray-500">{formatDate(photo.takenAt, locale)}</span><span className={`badge ${photo.category === 'visit' ? 'badge-green' : photo.category === 'handover' ? 'badge-yellow' : 'badge-red'}`}>{photo.category === 'visit' ? t('photos.visit') : photo.category === 'handover' ? t('photos.handover') : t('photos.voucher')}</span></div>
                  </div>
                </div>
              ))}</div>
            ) : <div className="text-center py-12"><Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">{t('photos.noPhotos')}</p></div>}
          </div>
        )}

        {/* ===== SPONSORS ===== */}
        {activeTab === 'sponsors' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('sponsors.title')}</h3>
              {canEditData && <button onClick={() => setShowAddSponsor(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('sponsors.addSponsor')}</button>}
            </div>
            {/* Search existing sponsor */}
            {canEditData && (
              <div className="mb-4">
                <button
                  onClick={() => setShowSponsorSearch(!showSponsorSearch)}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium mb-2"
                >
                  {showSponsorSearch ? '✕ ' : '🔍 '}{t('sponsorPage.searchExisting')}
                </button>
                {showSponsorSearch && (
                  <div className="relative">
                    <input
                      type="text"
                      value={sponsorSearch}
                      onChange={(e) => searchSponsors(e.target.value)}
                      placeholder={t('sponsorPage.searchByName')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                    {sponsorResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {sponsorResults.map((sr: any) => (
                          <button
                            key={sr.id}
                            onClick={() => addExistingSponsor(sr.id)}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium text-gray-900">{sr.lastName} {sr.firstName}</span>
                            <span className="text-gray-500 ml-2">{sr.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {showAddSponsor && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 mb-3">Vyplňte údaje sponzora. Pokud v systému neexistuje, bude vytvořen.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input type="text" value={newSponsor.firstName} onChange={(e) => setNewSponsor({ ...newSponsor, firstName: e.target.value })} placeholder={t('student.firstName') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="text" value={newSponsor.lastName} onChange={(e) => setNewSponsor({ ...newSponsor, lastName: e.target.value })} placeholder={t('student.lastName') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="email" value={newSponsor.email} onChange={(e) => setNewSponsor({ ...newSponsor, email: e.target.value })} placeholder={t('sponsors.email') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="text" value={newSponsor.phone} onChange={(e) => setNewSponsor({ ...newSponsor, phone: e.target.value })} placeholder={t('sponsors.phone')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="date" value={newSponsor.startDate} onChange={(e) => setNewSponsor({ ...newSponsor, startDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <input type="text" value={newSponsor.notes} onChange={(e) => setNewSponsor({ ...newSponsor, notes: e.target.value })} placeholder={t('sponsors.notes')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                </div>
                <div className="flex gap-2"><button onClick={addSponsor} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button><button onClick={() => setShowAddSponsor(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
              </div>
            )}
            {student.sponsorships?.length > 0 ? (
              <div className="space-y-4">{student.sponsorships.map((sp: any) => (
                <div key={sp.id} className="bg-accent-50 rounded-xl p-5 border border-accent-200">
                  {editingSponsor === sp.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={editSponsorData.firstName || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, firstName: e.target.value })} placeholder={t('student.firstName')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                        <input type="text" value={editSponsorData.lastName || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, lastName: e.target.value })} placeholder={t('student.lastName')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                        <input type="email" value={editSponsorData.email || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, email: e.target.value })} placeholder={t('sponsors.email')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        <input type="text" value={editSponsorData.phone || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, phone: e.target.value })} placeholder={t('sponsors.phone')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                        <div className="sm:col-span-2"><input type="text" value={editSponsorData.notes || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, notes: e.target.value })} placeholder={t('sponsors.notes')} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" /></div>
                      </div>
                      <div className="flex gap-2"><button onClick={() => saveSponsorEdit(sp.id, sp.sponsor.id)} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.save')}</button><button onClick={() => setEditingSponsor(null)} className="px-3 py-1.5 text-gray-500 text-sm">{t('app.cancel')}</button></div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent-200 rounded-full flex items-center justify-center flex-shrink-0"><HandHeart className="w-5 h-5 text-accent-700" /></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{sp.sponsor.firstName} {sp.sponsor.lastName}</h4>
                        <p className="text-sm text-gray-600">{sp.sponsor.email}</p>
                        {sp.sponsor.phone && <p className="text-sm text-gray-600">{sp.sponsor.phone}</p>}
                        <p className="text-xs text-gray-500 mt-2">{t('sponsors.startDate')}: {formatDate(sp.startDate, locale)}</p>
                        {sp.notes && <p className="text-sm text-gray-700 mt-2 italic">{sp.notes}</p>}
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${sp.isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>{sp.isActive ? '● Active' : '○ Inactive'}</span>
                      </div>
                      {canEditData && <button onClick={() => { setEditingSponsor(sp.id); setEditSponsorData({ firstName: sp.sponsor.firstName, lastName: sp.sponsor.lastName, email: sp.sponsor.email, phone: sp.sponsor.phone || '', notes: sp.notes || '' }) }} className="p-2 text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>}
                    </div>
                  )}
                </div>
              ))}</div>
            ) : <div className="text-center py-12"><HandHeart className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">{t('sponsors.noSponsors')}</p></div>}
          </div>
        )}

        {/* ===== SPONSOR PAYMENTS ===== */}
        {activeTab === 'sponsorPayments' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('sponsorPayments.title')}</h3>
              {canEditData && <button onClick={() => { setNewPayment({ ...newPayment, sponsorId: student.sponsorships?.[0]?.sponsor?.id || '' }); setShowAddPayment(true) }} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('app.add')}</button>}
            </div>
            {showAddPayment && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <input type="date" value={newPayment.paymentDate} onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <select value={newPayment.paymentType} onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">{t('sponsorPayments.selectType')}</option>{paymentTypes.map((pt: any) => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} placeholder={t('vouchers.amount')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                    <select value={newPayment.currency} onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })} className="px-2 py-2 rounded-lg border border-gray-300 text-sm w-20">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <select value={newPayment.sponsorId} onChange={(e) => setNewPayment({ ...newPayment, sponsorId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">{t('sponsorPayments.selectSponsor')}</option>
                    {student.sponsorships?.map((sp: any) => <option key={sp.sponsor.id} value={sp.sponsor.id}>{sp.sponsor.firstName} {sp.sponsor.lastName}</option>)}
                  </select>
                  <div className="sm:col-span-2 lg:col-span-2"><input type="text" value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} placeholder={t('student.notes')} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" /></div>
                </div>
                <div className="flex gap-2"><button onClick={addSponsorPayment} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button><button onClick={() => setShowAddPayment(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
              </div>
            )}
            {student.sponsorPayments?.length > 0 ? (
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('payments.paymentDate')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('sponsorPayments.paymentType')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('vouchers.amount')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('sponsors.title')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('student.notes')}</th>
                {canEditData && <th className="w-10"></th>}
              </tr></thead><tbody>
                {student.sponsorPayments.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{formatDate(p.paymentDate, locale)}</td>
                    <td className="py-3 px-2 text-sm"><span className={`badge ${p.paymentType === 'tuition' ? 'badge-green' : p.paymentType === 'medical' ? 'badge-yellow' : 'badge-red'}`}>{ptLabel(p.paymentType)}</span></td>
                    <td className="py-3 px-2 text-sm text-gray-900 font-medium">{fmtCurrency(p.amount, p.currency)}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{p.sponsor ? `${p.sponsor.firstName} ${p.sponsor.lastName}` : '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{p.notes || '-'}</td>
                    {canEditData && <td className="py-3 px-2 text-right"><button onClick={() => deleteSponsorPayment(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>}
                  </tr>
                ))}
              </tbody></table></div>
            ) : <div className="text-center py-12"><CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">{t('app.noData')}</p></div>}
          </div>
        )}

        {/* ===== HEALTH ===== */}
        {activeTab === 'health' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('health.title')}</h3>
              {canEditData && <button onClick={() => setShowAddHealth(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('health.addCheck')}</button>}
            </div>
            {showAddHealth && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <input type="date" value={newHealth.checkDate} onChange={(e) => setNewHealth({ ...newHealth, checkDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                  <select value={newHealth.checkType} onChange={(e) => setNewHealth({ ...newHealth, checkType: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm"><option value="">{t('health.selectType')}</option>{healthTypes.map((ht: any) => <option key={ht.id} value={ht.name}>{ht.name}</option>)}</select>
                  <input type="text" value={newHealth.notes} onChange={(e) => setNewHealth({ ...newHealth, notes: e.target.value })} placeholder={t('health.notes')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                </div>
                <div className="flex gap-2"><button onClick={addHealthCheck} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button><button onClick={() => setShowAddHealth(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
              </div>
            )}
            {student.healthChecks?.length > 0 ? (
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-28">{t('health.checkDate')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-24">{t('health.checkType')}</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">{t('health.notes')}</th>
                {canEditData && <th className="w-10"></th>}
              </tr></thead><tbody>
                {student.healthChecks.map((hc: any) => (
                  <tr key={hc.id} className="border-b border-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{formatDate(hc.checkDate, locale)}</td>
                    <td className="py-3 px-2 text-sm"><span className={`badge ${hc.checkType === 'urgent' ? 'badge-red' : hc.checkType === 'dentist' ? 'badge-yellow' : 'badge-green'}`}>{htLabel(hc.checkType)}</span></td>
                    <td className="py-3 px-2 text-sm text-gray-700">{hc.notes || '-'}</td>
                    {canEditData && <td className="py-3 px-2 text-right"><button onClick={() => deleteHealthCheck(hc.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>}
                  </tr>
                ))}
              </tbody></table></div>
            ) : <div className="text-center py-12"><Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">{t('health.noChecks')}</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, type = 'text', editMode, onChange }: { label: string; value: any; type?: string; editMode: boolean; onChange: (v: string) => void }) {
  return (<div><label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>{editMode ? <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none" /> : <p className="text-gray-900 py-2">{type === 'date' ? formatDate(value) : value || '-'}</p>}</div>)
}
function SelectField({ label, value, editMode, options, displayValue, onChange }: { label: string; value: string; editMode: boolean; options: { value: string; label: string }[]; displayValue: string; onChange: (v: string) => void }) {
  return (<div><label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>{editMode ? <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <p className="text-gray-900 py-2">{displayValue}</p>}</div>)
}
