'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, X, Edit3, User, Camera, Ticket,
  HandHeart, Stethoscope, Plus, Check, Trash2, Upload,
  Pencil, Package, Heart, CreditCard, Loader2, Star
} from 'lucide-react'
import { formatDate, formatDateForInput, formatNumber, calculateAge } from '@/lib/format'
import { validateImageFile, compressImage } from '@/lib/imageUtils'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }
const CURRENCIES = ['CZK', 'EUR', 'USD', 'KES']
type Tab = 'personal' | 'equipment' | 'needs' | 'wishes' | 'vouchers' | 'photos' | 'sponsors' | 'health' | 'sponsorPayments'
function fmtCurrency(amount: number, currency: string): string { return `${formatNumber(amount)} ${currency}` }

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const [backUrl, setBackUrl] = useState('/students')
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
  const [needTypes, setNeedTypes] = useState<any[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([])
  const [allSponsors, setAllSponsors] = useState<any[]>([])
  useEffect(() => { fetch('/api/sponsors').then(r => r.json()).then(d => setAllSponsors(d.sponsors || [])).catch(() => {}) }, [])

  const [wishTypes, setWishTypes] = useState<any[]>([])
  const [newWish, setNewWish] = useState('')
  const [selectedWishType, setSelectedWishType] = useState('')
  const [showAddWish, setShowAddWish] = useState(false)
  const [newNeed, setNewNeed] = useState('')
  const [selectedNeedType, setSelectedNeedType] = useState('')
  const [showAddNeed, setShowAddNeed] = useState(false)
  const [newVoucher, setNewVoucher] = useState({ type: 'purchase', date: '', amount: '', currency: 'CZK', count: '', donorName: '', sponsorId: '', notes: '' })
  const [showAddVoucher, setShowAddVoucher] = useState(false)
  const [newHealth, setNewHealth] = useState({ checkDate: '', checkType: '', notes: '' })
  const [showAddHealth, setShowAddHealth] = useState(false)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [newEquipmentType, setNewEquipmentType] = useState('')
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
  const [uploading, setUploading] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ paymentDate: '', amount: '', currency: 'CZK', paymentType: '', sponsorId: '', notes: '' })

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    if (from) setBackUrl(from)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const savedC = localStorage.getItem('rael-currency')
    if (savedC) setCurrency(savedC)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => { fetchStudent(); fetchUser(); fetchClassrooms(); fetchHealthTypes(); fetchPaymentTypes(); fetchNeedTypes(); fetchEquipmentTypes(); fetchWishTypes() }, [id])

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

  async function fetchNeedTypes() {
    try { const res = await fetch('/api/admin/need-types'); const d = await res.json(); setNeedTypes(d.needTypes || []) } catch {}
  }

  async function fetchEquipmentTypes() {
    try { const res = await fetch('/api/admin/equipment-types'); const d = await res.json(); setEquipmentTypes(d.equipmentTypes || []) } catch {}
  }

  async function fetchWishTypes() {
    try { const res = await fetch('/api/admin/wish-types'); const d = await res.json(); setWishTypes(d.wishTypes || []) } catch {}
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

  const sponsorNames = student?.sponsorships?.filter((s: any) => s.isActive).map((s: any) => `${s.sponsor.firstName} ${s.sponsor.lastName}`) || []
  const defaultDonor = sponsorNames[0] || ''

  // ---- CRUD handlers ----
  async function addNeed() {
    const description = selectedNeedType === '__custom__' ? newNeed.trim() : selectedNeedType
    if (!description) return
    try {
      const res = await fetch(`/api/students/${id}/needs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) })
      if (res.ok) { setNewNeed(''); setSelectedNeedType(''); setShowAddNeed(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
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
  async function addWish() {
    const isCustom = selectedWishType === '__custom__'
    const description = isCustom ? newWish.trim() : selectedWishType
    if (!description) return
    const wishType = !isCustom ? wishTypes.find((wt: any) => wt.name === description) : null
    try {
      const res = await fetch(`/api/students/${id}/wishes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, wishTypeId: wishType?.id || null }) })
      if (res.ok) { setNewWish(''); setSelectedWishType(''); setShowAddWish(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function toggleWishFulfilled(wishId: string, current: boolean) {
    try {
      const wish = student.wishes.find((w: any) => w.id === wishId)
      await fetch(`/api/students/${id}/wishes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishId, description: wish.description, isFulfilled: !current }) })
      await fetchStudent()
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteWish(wishId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/wishes`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }
  async function addSingleEquipment() {
    if (!newEquipmentType) return
    try {
      const res = await fetch(`/api/students/${id}/equipment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newEquipmentType, condition: 'new' }) })
      if (res.ok) { setNewEquipmentType(''); setShowAddEquipment(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteSingleEquipment(equipmentId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/equipment`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ equipmentId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }
  async function addVoucher() {
    if (!newVoucher.date || !newVoucher.count) return
    try {
      const payload = { ...newVoucher, donorName: newVoucher.donorName || defaultDonor }
      const res = await fetch(`/api/students/${id}/vouchers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { setNewVoucher({ type: 'purchase', date: '', amount: '', currency: 'CZK', count: '', donorName: '', sponsorId: '', notes: '' }); setShowAddVoucher(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
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
    const validationError = validateImageFile(newPhoto.file)
    if (validationError) { showMsg('error', t(`photos.${validationError}`)); return }
    setUploading(true)
    try {
      const compressed = await compressImage(newPhoto.file, 1600, 0.8)
      const fd = new FormData(); fd.append('file', compressed); fd.append('category', newPhoto.category); fd.append('description', newPhoto.description); if (newPhoto.takenAt) fd.append('takenAt', newPhoto.takenAt)
      const res = await fetch(`/api/students/${id}/photos`, { method: 'POST', body: fd })
      if (res.ok) { setNewPhoto({ category: 'visit', description: '', takenAt: '', file: null }); setShowAddPhoto(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
    setUploading(false)
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

  async function removeSponsor(sponsorshipId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try {
      const res = await fetch(`/api/students/${id}/sponsors`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorshipId }),
      })
      if (res.ok) {
        fetchStudent()
        showMsg('success', t('app.deleteSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
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
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error || t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
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
    const validationError = validateImageFile(file)
    if (validationError) { showMsg('error', t(`photos.${validationError}`)); return }
    setUploading(true)
    try {
      const compressed = await compressImage(file, 400, 0.8)
      const fd = new FormData(); fd.append('file', compressed)
      const res = await fetch(`/api/students/${id}/profile-photo`, { method: 'POST', body: fd })
      if (res.ok) { await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
    setUploading(false)
  }
  async function addSponsorPayment() {
    if (!newPayment.paymentDate || !newPayment.amount || !newPayment.paymentType) return
    try {
      const res = await fetch(`/api/students/${id}/sponsor-payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPayment) })
      if (res.ok) { setNewPayment({ paymentDate: '', amount: '', currency: 'CZK', paymentType: '', sponsorId: '', notes: '' }); setShowAddPayment(false); await fetchStudent(); showMsg('success', t('app.savedSuccess')) }
    } catch { showMsg('error', t('app.error')) }
  }
  async function deleteSponsorPayment(paymentId: string) {
    if (!confirm(t('app.confirmDelete'))) return
    try { await fetch(`/api/students/${id}/sponsor-payments`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) }); await fetchStudent(); showMsg('success', t('app.deleteSuccess')) } catch { showMsg('error', t('app.error')) }
  }

  function updateEquipment(idx: number, field: string, value: string) { const u = [...editEquipment]; u[idx] = { ...u[idx], [field]: value }; setEditEquipment(u) }
  function addEquipmentItem(typeName: string) {
    if (!typeName) return
    setEditEquipment([...editEquipment, { type: typeName, condition: 'new', acquiredAt: '', notes: '' }])
  }
  function removeEquipmentItem(idx: number) {
    setEditEquipment(editEquipment.filter((_: any, i: number) => i !== idx))
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'personal', label: t('student.tabs.personal'), icon: User },
    { key: 'equipment', label: t('equipment.title'), icon: Package },
    { key: 'needs', label: t('needs.title'), icon: Heart },
    { key: 'wishes', label: t('wishes.title'), icon: Star },
    { key: 'vouchers', label: t('student.tabs.vouchers'), icon: Ticket },
    { key: 'photos', label: t('student.tabs.photos'), icon: Camera },
    { key: 'sponsors', label: t('student.tabs.sponsors'), icon: HandHeart },
    { key: 'sponsorPayments', label: t('sponsorPayments.title'), icon: CreditCard },
    { key: 'health', label: t('student.tabs.health'), icon: Stethoscope },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!student) return <div className="text-center py-12 text-gray-500">Student not found</div>

  const condBadge = (c: string) => { const m: Record<string,string> = { new:'badge-green', satisfactory:'badge-yellow', poor:'badge-red' }; const l: Record<string,string> = { new:t('equipment.new'), satisfactory:t('equipment.satisfactory'), poor:t('equipment.poor') }; return <span className={`badge ${m[c]||'badge-yellow'}`}>{l[c]||c}</span> }
  const eqLabel = (type: string) => {
    const m: Record<string,string> = { bed:t('equipment.bed'), mattress:t('equipment.mattress'), blanket:t('equipment.blanket'), mosquito_net:t('equipment.mosquito_net'), bedding:t('equipment.bedding'), uniform:t('equipment.uniform'), shoes:t('equipment.shoes'), school_bag:t('equipment.school_bag'), pillow:t('equipment.pillow'), wheelchair:t('equipment.wheelchair'), other:t('equipment.other'), received:t('equipment.received') }
    return m[type] || type
  }
  const htLabel = (type: string) => { const found = healthTypes.find((ht: any) => ht.name === type); return found ? found.name : type }
  const ptLabel = (type: string) => { const found = paymentTypes.find((pt: any) => pt.name === type); return found ? found.name : type }

  const totalPurchased = student.vouchers?.reduce((s: number, v: any) => s + v.count, 0) || 0
  const totalUsed = student.voucherUsages?.reduce((s: number, v: any) => s + v.count, 0) || 0
  const totalsByCurrency: Record<string, number> = {}
  student.vouchers?.forEach((v: any) => { const c = v.currency || 'CZK'; totalsByCurrency[c] = (totalsByCurrency[c] || 0) + v.amount })
  const available = totalPurchased - totalUsed
  const filteredPhotos = photoFilter === 'all' ? (student.photos || []) : (student.photos || []).filter((p: any) => p.category === photoFilter)

  return (
    <div>
      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('app.confirm')}</h3>
            <p className="text-gray-600 mb-6">{t('app.confirmSave')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">{t('app.cancel')}</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium">{t('app.save')}</button>
            </div>
          </div>
        </div>
      )}
      {message && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>{message.text}</div>}

      {/* ===== HERO HEADER ===== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-5">
          <button onClick={() => router.push(backUrl)} className="p-2 rounded-lg hover:bg-gray-100 mt-1 flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative group flex-shrink-0">
            {student.profilePhoto ? (
              <img src={student.profilePhoto} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center border-2 border-primary-100">
                <User className="w-10 h-10 text-primary-400" />
              </div>
            )}
            {canEditData && (
              <label className={`absolute inset-0 rounded-2xl cursor-pointer flex items-center justify-center transition-all ${uploading ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/30'}`}>
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) uploadProfilePhoto(e.target.files[0]) }} />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">{student.studentNo}</span>
                  {student.className && <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 text-xs font-medium text-primary-700">{student.className}</span>}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-medium text-blue-700">{calculateAge(student.dateOfBirth)} {locale === 'cs' ? 'let' : locale === 'sw' ? 'miaka' : 'years'}</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-xs font-medium text-purple-700">{student.gender === 'M' ? t('student.male') : student.gender === 'F' ? t('student.female') : '-'}</span>
                </div>
              </div>
              {canEditData && (activeTab === 'personal' || activeTab === 'equipment') && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editMode ? (
                    <>
                      <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"><X className="w-4 h-4" /> {t('app.cancel')}</button>
                      <button onClick={() => setShowConfirm(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? '...' : t('app.save')}</button>
                    </>
                  ) : (
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"><Edit3 className="w-4 h-4" /> {t('app.edit')}</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-50">
            <HandHeart className="w-5 h-5 text-accent-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-accent-600 font-medium">{t('student.tabs.sponsors')}</p>
              <p className="text-lg font-bold text-accent-900">{student.sponsorships?.filter((s: any) => s.isActive).length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50">
            <Heart className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-600 font-medium">{t('needs.title')}</p>
              <p className="text-lg font-bold text-red-900">{student.needs?.filter((n: any) => !n.isFulfilled).length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50">
            <Ticket className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-600 font-medium">{t('vouchers.available')}</p>
              <p className="text-lg font-bold text-blue-900">{formatNumber(available)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50">
            <Stethoscope className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-green-600 font-medium">{t('student.tabs.health')}</p>
              <p className="text-lg font-bold text-green-900">{student.healthChecks?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {editMode && <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">✏️ {t('app.editMode')}</div>}

      {/* ===== TABS - pill style ===== */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}

      {/* ===== PERSONAL ===== */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-primary-50 rounded-lg"><User className="w-4 h-4 text-primary-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('student.tabs.personal')}</h3>
            </div>
            <div className="space-y-4">
              <Field label={t('student.firstName')} value={editData.firstName} editMode={editMode} onChange={(v) => setEditData({ ...editData, firstName: v })} />
              <Field label={t('student.lastName')} value={editData.lastName} editMode={editMode} onChange={(v) => setEditData({ ...editData, lastName: v })} />
              <Field label={t('student.dateOfBirth')} value={formatDateForInput(editData.dateOfBirth)} type="date" editMode={editMode} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} />
              <SelectField label={t('student.gender')} value={editData.gender || ''} editMode={editMode} options={[{ value: '', label: '-' }, { value: 'M', label: t('student.male') }, { value: 'F', label: t('student.female') }]} displayValue={student.gender === 'M' ? t('student.male') : student.gender === 'F' ? t('student.female') : '-'} onChange={(v) => setEditData({ ...editData, gender: v })} />
              <SelectField label={t('student.className')} value={editData.className || ''} editMode={editMode} options={[{ value: '', label: '-' }, ...classrooms.map((c: any) => ({ value: c.name, label: c.name }))]} displayValue={student.className || '-'} onChange={(v) => setEditData({ ...editData, className: v })} />
              <Field label={t('student.healthStatus')} value={editData.healthStatus} editMode={editMode} onChange={(v) => setEditData({ ...editData, healthStatus: v })} />
            </div>
          </div>

          {/* Family card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-accent-50 rounded-lg"><Heart className="w-4 h-4 text-accent-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('student.family.title')}</h3>
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
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4 text-blue-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('student.notes')}</h3>
            </div>
            {editMode ? <textarea value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none" /> : <p className="text-gray-700 whitespace-pre-wrap">{student.notes || '-'}</p>}
          </div>
        </div>
      )}

      {/* ===== EQUIPMENT ===== */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-50 rounded-lg"><Package className="w-4 h-4 text-primary-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('equipment.title')}</h3>
            </div>
            {canEditData && !editMode && <button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('equipment.addEquipment')}</button>}
          </div>
          {showAddEquipment && !editMode && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={newEquipmentType} onChange={(e) => setNewEquipmentType(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">{t('equipment.selectType')}</option>
                  {equipmentTypes.map((et: any) => <option key={et.id} value={et.name}>{eqLabel(et.name)}{et.price ? ` (${formatNumber(et.price)} CZK)` : ''}</option>)}
                </select>
                <button onClick={addSingleEquipment} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                <button onClick={() => { setShowAddEquipment(false); setNewEquipmentType('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          {editMode ? (
            <div className="space-y-3">
              {editEquipment.map((eq: any, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <select value={eq.type} onChange={(e) => updateEquipment(idx, 'type', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none sm:w-40">
                    <option value={eq.type}>{eqLabel(eq.type)}</option>
                    {equipmentTypes.filter((et: any) => et.name !== eq.type).map((et: any) => <option key={et.id} value={et.name}>{eqLabel(et.name)}</option>)}
                  </select>
                  <select value={eq.condition} onChange={(e) => updateEquipment(idx, 'condition', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="new">{t('equipment.new')}</option>
                    <option value="satisfactory">{t('equipment.satisfactory')}</option>
                    <option value="poor">{t('equipment.poor')}</option>
                  </select>
                  <input type="date" value={formatDateForInput(eq.acquiredAt)} onChange={(e) => updateEquipment(idx, 'acquiredAt', e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  <button onClick={() => removeEquipmentItem(idx)} className="p-1.5 text-gray-400 hover:text-red-500" title={t('equipment.removeItem')}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <select id="addEquipmentSelect" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" defaultValue="">
                  <option value="">{t('equipment.selectType')}</option>
                  {equipmentTypes.map((et: any) => <option key={et.id} value={et.name}>{eqLabel(et.name)}{et.price ? ` (${formatNumber(et.price)} CZK)` : ''}</option>)}
                </select>
                <button onClick={() => { const sel = document.getElementById('addEquipmentSelect') as HTMLSelectElement; if (sel.value) { addEquipmentItem(sel.value); sel.value = '' } }} className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4" /> {t('equipment.addEquipment')}</button>
              </div>
            </div>
          ) : student.equipment?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {student.equipment.map((eq: any) => (
                <div key={eq.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {eqLabel(eq.type)}
                      {(() => { const et = equipmentTypes.find((t: any) => t.name === eq.type); return et?.price ? <span className="ml-2 text-xs font-normal text-gray-500">({formatNumber(et.price)} CZK)</span> : null })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(eq.acquiredAt, locale)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {condBadge(eq.condition)}
                    {canEditData && <button onClick={() => deleteSingleEquipment(eq.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm text-center py-8">{t('app.noData')}</p>}
        </div>
      )}

      {/* ===== NEEDS ===== */}
      {activeTab === 'needs' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg"><Heart className="w-4 h-4 text-red-500" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('needs.title')}</h3>
            </div>
            {canEditData && <button onClick={() => setShowAddNeed(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('needs.addNeed')}</button>}
          </div>
          {showAddNeed && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={selectedNeedType} onChange={(e) => { setSelectedNeedType(e.target.value); if (e.target.value !== '__custom__') setNewNeed('') }} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">{t('needs.selectType')}</option>
                  {needTypes.map((nt: any) => <option key={nt.id} value={nt.name}>{nt.name}{nt.price ? ` (${formatNumber(nt.price)} CZK)` : ''}</option>)}
                  <option value="__custom__">{t('needs.customNeed')}</option>
                </select>
                {selectedNeedType === '__custom__' && (
                  <input type="text" value={newNeed} onChange={(e) => setNewNeed(e.target.value)} placeholder={t('needs.description')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && addNeed()} />
                )}
                <button onClick={addNeed} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                <button onClick={() => { setShowAddNeed(false); setNewNeed(''); setSelectedNeedType('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {student.needs?.map((need: any) => (
              <div key={need.id} className={`flex items-center justify-between p-3 rounded-lg ${need.isFulfilled ? 'bg-primary-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  {canEditData ? <button onClick={() => toggleNeedFulfilled(need.id, need.isFulfilled)} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${need.isFulfilled ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>{need.isFulfilled && <Check className="w-4 h-4 text-white" />}</button> : <div className={`w-6 h-6 rounded-full flex items-center justify-center ${need.isFulfilled ? 'bg-primary-500' : 'bg-gray-300'}`}>{need.isFulfilled && <Check className="w-4 h-4 text-white" />}</div>}
                  <div>
                    <span className={`text-sm ${need.isFulfilled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{need.description}</span>
                    {(() => { const nt = needTypes.find((t: any) => t.name === need.description); return nt?.price ? <span className="ml-2 text-xs text-gray-500">({formatNumber(nt.price)} CZK)</span> : null })()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {need.isFulfilled && <span className="text-xs text-gray-500">{formatDate(need.fulfilledAt, locale)}</span>}
                  {canEditData && <button onClick={() => deleteNeed(need.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
            {(!student.needs || student.needs.length === 0) && <p className="text-gray-500 text-sm text-center py-8">{t('app.noData')}</p>}
          </div>
        </div>
      )}

      {/* ===== WISHES ===== */}
      {activeTab === 'wishes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-50 rounded-lg"><Star className="w-4 h-4 text-yellow-500" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('wishes.title')}</h3>
            </div>
            {canEditData && <button onClick={() => setShowAddWish(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('wishes.addWish')}</button>}
          </div>
          {showAddWish && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={selectedWishType} onChange={(e) => { setSelectedWishType(e.target.value); if (e.target.value !== '__custom__') setNewWish('') }} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">{t('wishes.selectType')}</option>
                  {wishTypes.map((wt: any) => <option key={wt.id} value={wt.name}>{wt.name}{wt.price ? ` (${formatNumber(wt.price)} CZK)` : ''}</option>)}
                  <option value="__custom__">{t('wishes.customWish')}</option>
                </select>
                {selectedWishType === '__custom__' && (
                  <input type="text" value={newWish} onChange={(e) => setNewWish(e.target.value)} placeholder={t('wishes.description')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && addWish()} />
                )}
                <button onClick={addWish} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('app.add')}</button>
                <button onClick={() => { setShowAddWish(false); setNewWish(''); setSelectedWishType('') }} className="px-3 py-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {student.wishes?.map((wish: any) => (
              <div key={wish.id} className={`flex items-center justify-between p-3 rounded-lg ${wish.isFulfilled ? 'bg-primary-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-3">
                  {canEditData ? <button onClick={() => toggleWishFulfilled(wish.id, wish.isFulfilled)} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${wish.isFulfilled ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>{wish.isFulfilled && <Check className="w-4 h-4 text-white" />}</button> : <div className={`w-6 h-6 rounded-full flex items-center justify-center ${wish.isFulfilled ? 'bg-primary-500' : 'bg-gray-300'}`}>{wish.isFulfilled && <Check className="w-4 h-4 text-white" />}</div>}
                  <div>
                    <span className={`text-sm ${wish.isFulfilled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{wish.description}</span>
                    {wish.wishType?.price && <span className="ml-2 text-xs text-gray-500">({formatNumber(wish.wishType.price)} CZK)</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {wish.isFulfilled && <span className="text-xs text-gray-500">{formatDate(wish.fulfilledAt, locale)}</span>}
                  {canEditData && <button onClick={() => deleteWish(wish.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
            {(!student.wishes || student.wishes.length === 0) && <p className="text-gray-500 text-sm text-center py-8">{t('wishes.noWishes')}</p>}
          </div>
        </div>
      )}

      {/* ===== VOUCHERS ===== */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-blue-600 font-medium">{t('vouchers.totalAmount')}</p>
              {Object.keys(totalsByCurrency).length > 0 ? Object.entries(totalsByCurrency).map(([cur, amt]) => (
                <p key={cur} className="text-xl font-bold text-blue-900">{fmtCurrency(amt, cur)}</p>
              )) : <p className="text-xl font-bold text-blue-900">{fmtCurrency(0, 'CZK')}</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-primary-600 font-medium">{t('vouchers.totalPurchased')}</p>
              <p className="text-xl font-bold text-primary-900">{formatNumber(totalPurchased)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-accent-600 font-medium">{t('vouchers.totalUsed')}</p>
              <p className="text-xl font-bold text-accent-900">{formatNumber(totalUsed)}</p>
            </div>
            <div className={`bg-white rounded-xl border p-4 shadow-sm ${available > 0 ? 'border-primary-200' : 'border-red-200'}`}>
              <p className={`text-xs font-medium ${available > 0 ? 'text-primary-600' : 'text-red-600'}`}>{t('vouchers.available')}</p>
              <p className={`text-xl font-bold ${available > 0 ? 'text-primary-900' : 'text-red-900'}`}>{formatNumber(available)}</p>
            </div>
          </div>

          {/* Voucher tables card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Ticket className="w-4 h-4 text-blue-600" /></div>
                <h3 className="text-base font-semibold text-gray-900">{t('vouchers.title')}</h3>
              </div>
              {canEditData && <button onClick={() => { setNewVoucher({ ...newVoucher, donorName: defaultDonor, sponsorId: '' }); setShowAddVoucher(true) }} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('app.add')}</button>}
            </div>
            {showAddVoucher && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <select value={newVoucher.type} onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"><option value="purchase">{t('vouchers.addPurchase')}</option><option value="usage">{t('vouchers.addUsage')}</option></select>
                  <input type="date" value={newVoucher.date} onChange={(e) => setNewVoucher({ ...newVoucher, date: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  {newVoucher.type === 'purchase' && (
                    <div className="flex gap-2">
                      <input type="number" value={newVoucher.amount} onChange={(e) => {
                        const amt = e.target.value
                        const autoCount = (amt && newVoucher.currency === 'CZK') ? String(Math.floor(parseFloat(amt) / 80)) : ''
                        setNewVoucher({ ...newVoucher, amount: amt, count: autoCount })
                      }} placeholder={t('vouchers.amount')} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      <select value={newVoucher.currency} onChange={(e) => {
                        const cur = e.target.value
                        const autoCount = (newVoucher.amount && cur === 'CZK') ? String(Math.floor(parseFloat(newVoucher.amount) / 80)) : ''
                        setNewVoucher({ ...newVoucher, currency: cur, count: autoCount })
                      }} className="w-20 px-2 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  <input type="number" value={newVoucher.count} onChange={(e) => setNewVoucher({ ...newVoucher, count: e.target.value })} placeholder={t('vouchers.count')} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  {newVoucher.type === 'purchase' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">{t('vouchers.donorName')}</label>
                      <select value={newVoucher.sponsorId} onChange={(e) => {
                        const sp = allSponsors.find((s: any) => s.id === e.target.value)
                        if (sp) {
                          setNewVoucher({ ...newVoucher, sponsorId: sp.id, donorName: `${sp.firstName} ${sp.lastName}` })
                        } else {
                          setNewVoucher({ ...newVoucher, sponsorId: '', donorName: '' })
                        }
                      }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                        <option value="">{t('vouchers.selectSponsor')}</option>
                        {allSponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}{s.email ? ` (${s.email})` : ''}</option>)}
                      </select>
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
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('vouchers.purchases')}</h4>
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
                    <td className="py-3 px-2 text-sm text-gray-900">{fmtCurrency(v.amount, v.currency || 'CZK')}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{formatNumber(v.count)}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{v.donorName || '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{v.notes || '-'}</td>
                    {canEditData && <td className="py-3 px-1 text-right"><button onClick={() => deleteVoucher(v.id, 'purchase')} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>}
                  </tr>
                ))}
                {(!student.vouchers || student.vouchers.length === 0) && <tr><td colSpan={canEditData ? 6 : 5} className="py-4 text-center text-gray-500 text-sm">{t('app.noData')}</td></tr>}
              </tbody></table>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('vouchers.usages')}</h4>
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
        </div>
      )}

      {/* ===== PHOTOS ===== */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg"><Camera className="w-4 h-4 text-purple-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('photos.title')}</h3>
            </div>
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
              <div className="flex gap-2"><button onClick={addPhoto} disabled={!newPhoto.file || uploading} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('app.loading')}</> : t('photos.upload')}</button><button onClick={() => setShowAddPhoto(false)} disabled={uploading} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent-50 rounded-lg"><HandHeart className="w-4 h-4 text-accent-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('sponsors.title')}</h3>
            </div>
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
                      {canEditData && <button onClick={() => removeSponsor(sp.id)} className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"><Trash2 className="w-3 h-3" /> {t('sponsors.removeSponsor')}</button>}
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg"><CreditCard className="w-4 h-4 text-green-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('sponsorPayments.title')}</h3>
            </div>
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
                  {allSponsors.map((s: any) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg"><Stethoscope className="w-4 h-4 text-green-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">{t('health.title')}</h3>
            </div>
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
  )
}

function Field({ label, value, type = 'text', editMode, onChange }: { label: string; value: any; type?: string; editMode: boolean; onChange: (v: string) => void }) {
  return (<div><label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>{editMode ? <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none" /> : <p className="text-gray-900 py-2">{type === 'date' ? formatDate(value) : value || '-'}</p>}</div>)
}
function SelectField({ label, value, editMode, options, displayValue, onChange }: { label: string; value: string; editMode: boolean; options: { value: string; label: string }[]; displayValue: string; onChange: (v: string) => void }) {
  return (<div><label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>{editMode ? <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <p className="text-gray-900 py-2">{displayValue}</p>}</div>)
}
