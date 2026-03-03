'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, X, Edit3, User, Camera, Ticket,
  HandHeart, Stethoscope, Package, Heart, CreditCard, Loader2, Star, FileText
} from 'lucide-react'
import Image from 'next/image'
import { calculateAge } from '@/lib/format'
import { validateImageFile, compressImage } from '@/lib/imageUtils'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/hooks/useToast'
import { useFetchList } from '@/hooks/useFetchList'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Toast } from '@/components/Toast'
import { PersonalTab } from '@/components/student-detail/PersonalTab'
import { EquipmentTab } from '@/components/student-detail/EquipmentTab'
import { NeedsTab } from '@/components/student-detail/NeedsTab'
import { WishesTab } from '@/components/student-detail/WishesTab'
import { VouchersTab } from '@/components/student-detail/VouchersTab'
import { PhotosTab } from '@/components/student-detail/PhotosTab'
import { SponsorsTab } from '@/components/student-detail/SponsorsTab'
import { SponsorPaymentsTab } from '@/components/student-detail/SponsorPaymentsTab'
import { TuitionTab } from '@/components/student-detail/TuitionTab'
import { HealthTab } from '@/components/student-detail/HealthTab'

type Tab = 'personal' | 'equipment' | 'needs' | 'wishes' | 'vouchers' | 'photos' | 'sponsors' | 'health' | 'sponsorPayments' | 'tuition'

interface StudentDetail {
  id: string
  studentNo: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string | null
  className: string | null
  school: string | null
  orphanStatus: string | null
  healthStatus: string | null
  profilePhoto: string | null
  motherName: string | null
  motherAlive: boolean | null
  fatherName: string | null
  fatherAlive: boolean | null
  siblings: string | null
  isActive: boolean
  notes: string | null
  equipment: { id: string; type: string; condition: string; acquiredAt: string | null; notes: string | null }[]
  needs: { id: string; description: string; isFulfilled: boolean; fulfilledAt: string | null; notes: string | null }[]
  photos: { id: string; category: string; fileName: string; filePath: string; description: string | null; takenAt: string }[]
  vouchers: { id: string; purchaseDate: string; amount: number; currency: string; count: number; donorName: string | null; notes: string | null; sponsor: { id: string; firstName: string; lastName: string } | null }[]
  voucherUsages: { id: string; usageDate: string; count: number; notes: string | null }[]
  sponsorships: { id: string; startDate: string; endDate: string | null; notes: string | null; isActive: boolean; sponsor: { id: string; firstName: string; lastName: string; email: string; phone: string | null } }[]
  healthChecks: { id: string; checkDate: string; checkType: string; notes: string | null }[]
  wishes: { id: string; description: string; isFulfilled: boolean; fulfilledAt: string | null; notes: string | null; wishType: { id: string; name: string; nameEn: string | null; nameSw: string | null; price: number | null } | null }[]
  payments: { id: string; paymentDate: string; amount: number; notes: string | null }[]
  sponsorPayments: { id: string; paymentDate: string; amount: number; currency: string; paymentType: string; notes: string | null; sponsor: { id: string; firstName: string; lastName: string } | null }[]
}

interface EquipmentItem {
  id?: string
  type: string
  condition: string
  acquiredAt: string | null
  notes: string | null
}

interface SponsorSearchResult {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface EditSponsorData {
  startDate: string
  endDate: string
  notes: string
  isActive: boolean
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const [backUrl, setBackUrl] = useState('/students')
  // StudentDetail interface defined above for reference; kept as any due to extensive nested access after early-return guard
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [editEquipment, setEditEquipment] = useState<EquipmentItem[]>([])
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const confirmRef = useFocusTrap(showConfirm)
  const [userRole, setUserRole] = useState<string>('')
  const [currency, setCurrency] = useState('KES')
  const [classrooms, fetchClassrooms] = useFetchList('/api/admin/classrooms', 'classrooms')
  const [healthTypes, fetchHealthTypes] = useFetchList('/api/admin/health-types', 'healthTypes')
  const [paymentTypes, fetchPaymentTypes] = useFetchList('/api/admin/payment-types', 'paymentTypes')
  const [needTypes, fetchNeedTypes] = useFetchList('/api/admin/need-types', 'needTypes')
  const [equipmentTypes, fetchEquipmentTypes] = useFetchList('/api/admin/equipment-types', 'equipmentTypes')
  const [wishTypes, fetchWishTypes] = useFetchList('/api/admin/wish-types', 'wishTypes')
  const [voucherRates, fetchVoucherRates] = useFetchList('/api/voucher-rates', 'voucherRates')
  const [tuitionCharges, fetchTuitionCharges] = useFetchList(`/api/tuition-charges?studentId=${id}`, 'charges')
  const [allSponsors, fetchAllSponsors] = useFetchList('/api/sponsors/names', 'sponsors')
  useEffect(() => { fetchAllSponsors() }, [])
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
  const [sponsorResults, setSponsorResults] = useState<SponsorSearchResult[]>([])
  const [showSponsorSearch, setShowSponsorSearch] = useState(false)
  const [newSponsor, setNewSponsor] = useState({ firstName: '', lastName: '', email: '', phone: '', startDate: '', notes: '' })
  const [editingSponsor, setEditingSponsor] = useState<string | null>(null)
  const [editSponsorData, setEditSponsorData] = useState<EditSponsorData>({ startDate: '', endDate: '', notes: '', isActive: true })
  const [photoFilter, setPhotoFilter] = useState('all')
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ category: 'visit', description: '', takenAt: '', file: null as File | null })
  const [uploading, setUploading] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ paymentDate: '', amount: '', currency: 'CZK', paymentType: '', sponsorId: '', notes: '' })

  const { locale, t } = useLocale()
  const { message, showMsg } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    if (from) setBackUrl(from)
    const tab = params.get('tab')
    if (tab) setActiveTab(tab as Tab)
  }, [])

  useEffect(() => {
    const savedC = localStorage.getItem('rael-currency')
    if (savedC) setCurrency(savedC)
  }, [])

  // Eager: student data + user role (needed for all tabs)
  useEffect(() => { fetchStudent(); fetchUser() }, [id])

  // Lazy-load: fetch tab-specific data only when tab is activated
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (loadedTabs.has(activeTab)) return
    setLoadedTabs(prev => new Set(prev).add(activeTab))
    const fetchers: Record<string, () => void> = {
      personal: fetchClassrooms,
      equipment: () => { fetchClassrooms(); fetchEquipmentTypes() },
      needs: fetchNeedTypes,
      wishes: fetchWishTypes,
      vouchers: fetchVoucherRates,
      sponsorPayments: fetchPaymentTypes,
      tuition: fetchTuitionCharges,
      health: fetchHealthTypes,
    }
    fetchers[activeTab]?.()
  }, [activeTab])

  async function fetchUser() {
    try { const res = await fetch('/api/auth/me'); const d = await res.json(); if (d.user) setUserRole(d.user.role) } catch {}
  }


  function getVoucherRate(cur: string): number | null {
    const rate = voucherRates.find((r: any) => r.currency === cur)
    return rate ? rate.rate : null
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

  function cancelEdit() { setEditData(student); setEditEquipment(student?.equipment?.map((eq: any) => ({ ...eq })) || []); setEditMode(false) }
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
    if (!newSponsor.firstName || !newSponsor.lastName || !newSponsor.email) { showMsg('error', 'Vyplnte jmeno, prijmeni a email'); return }
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

  const tabs: { key: Tab; label: string; icon: any; color: string; activeColor: string }[] = [
    { key: 'personal', label: t('student.tabs.personal'), icon: User, color: 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700', activeColor: 'bg-gray-700 text-white border-gray-700 dark:bg-gray-600 dark:border-gray-500' },
    { key: 'sponsors', label: t('student.tabs.sponsors'), icon: HandHeart, color: 'bg-accent-50 border-accent-200 text-accent-600 hover:bg-accent-100 dark:bg-accent-900/30 dark:border-accent-700 dark:text-accent-400 dark:hover:bg-accent-900/50', activeColor: 'bg-accent-600 text-white border-accent-600' },
    { key: 'equipment', label: t('equipment.title'), icon: Package, color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/50', activeColor: 'bg-amber-600 text-white border-amber-600' },
    { key: 'needs', label: t('needs.title'), icon: Heart, color: 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/50', activeColor: 'bg-rose-600 text-white border-rose-600' },
    { key: 'wishes', label: t('wishes.title'), icon: Star, color: 'bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/50', activeColor: 'bg-violet-600 text-white border-violet-600' },
    { key: 'vouchers', label: t('student.tabs.vouchers'), icon: Ticket, color: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50', activeColor: 'bg-blue-600 text-white border-blue-600' },
    { key: 'sponsorPayments', label: t('sponsorPayments.title'), icon: CreditCard, color: 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/50', activeColor: 'bg-indigo-600 text-white border-indigo-600' },
    { key: 'tuition', label: t('tuition.charges'), icon: FileText, color: 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/50', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'health', label: t('student.tabs.health'), icon: Stethoscope, color: 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/50', activeColor: 'bg-teal-600 text-white border-teal-600' },
    { key: 'photos', label: t('student.tabs.photos'), icon: Camera, color: 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700', activeColor: 'bg-slate-600 text-white border-slate-600' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!student) return <div className="text-center py-12 text-gray-500">Student not found</div>

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" ref={confirmRef} onKeyDown={(e) => e.key === 'Escape' && setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{t('app.confirm')}</h3>
            <p className="text-gray-600 mb-6">{t('app.confirmSave')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium focus-visible:ring-2 focus-visible:ring-primary-500">{t('app.cancel')}</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium focus-visible:ring-2 focus-visible:ring-primary-500">{t('app.save')}</button>
            </div>
          </div>
        </div>
      )}
      <Toast message={message} />

      {/* ===== HERO HEADER ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-5">
          <button aria-label="Zpet" onClick={() => router.push(backUrl)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mt-1 flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="relative group flex-shrink-0">
            {student.profilePhoto ? (
              <Image src={student.profilePhoto} alt={`${student.firstName} ${student.lastName}`} width={80} height={80} className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/40 rounded-2xl flex items-center justify-center border-2 border-primary-100 dark:border-primary-700">
                <User className="w-10 h-10 text-primary-400 dark:text-primary-300" />
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{student.firstName} {student.lastName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">{student.studentNo}</span>
                  {student.className && <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-xs font-medium text-primary-700 dark:text-primary-400">{student.className}</span>}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-400">{calculateAge(student.dateOfBirth)} {locale === 'cs' ? 'let' : locale === 'sw' ? 'miaka' : 'years'}</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-xs font-medium text-purple-700 dark:text-purple-400">{student.gender === 'M' ? t('student.male') : student.gender === 'F' ? t('student.female') : '-'}</span>
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

      </div>

      {editMode && <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">{'\u270F\uFE0F'} {t('app.editMode')}</div>}

      {/* ===== TABS - pill style ===== */}
      {(() => {
        const tabCounts: Partial<Record<Tab, number>> = {
          sponsors: student.sponsorships?.filter((s: any) => s.isActive).length || 0,
          needs: student.needs?.filter((n: any) => !n.isFulfilled).length || 0,
          vouchers: available,
          health: student.healthChecks?.length || 0,
          equipment: student.equipment?.length || 0,
          wishes: student.wishes?.filter((w: any) => !w.isFulfilled).length || 0,
          photos: student.photos?.length || 0,
          sponsorPayments: student.sponsorPayments?.length || 0,
          tuition: tuitionCharges.length,
        }
        return (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tabs.map((tab) => {
              const count = tabCounts[tab.key]
              const isActive = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${isActive ? tab.activeColor + ' shadow-sm' : tab.color}`}>
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  {count !== undefined && <span className={`ml-0.5 text-[10px] px-1 py-0 rounded-full ${isActive ? 'bg-white/25' : 'bg-black/5'}`}>{count}</span>}
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* ===== TAB CONTENT ===== */}

      {activeTab === 'personal' && (
        <PersonalTab
          student={student} editData={editData} setEditData={setEditData}
          editMode={editMode} classrooms={classrooms} locale={locale} t={t}
        />
      )}

      {activeTab === 'equipment' && (
        <EquipmentTab
          student={student} editMode={editMode} editEquipment={editEquipment}
          canEditData={canEditData} equipmentTypes={equipmentTypes}
          showAddEquipment={showAddEquipment} setShowAddEquipment={setShowAddEquipment}
          newEquipmentType={newEquipmentType} setNewEquipmentType={setNewEquipmentType}
          addSingleEquipment={addSingleEquipment} deleteSingleEquipment={deleteSingleEquipment}
          updateEquipment={updateEquipment} addEquipmentItem={addEquipmentItem}
          removeEquipmentItem={removeEquipmentItem} locale={locale} t={t}
        />
      )}

      {activeTab === 'needs' && (
        <NeedsTab
          student={student} canEditData={canEditData} needTypes={needTypes}
          showAddNeed={showAddNeed} setShowAddNeed={setShowAddNeed}
          selectedNeedType={selectedNeedType} setSelectedNeedType={setSelectedNeedType}
          newNeed={newNeed} setNewNeed={setNewNeed}
          addNeed={addNeed} toggleNeedFulfilled={toggleNeedFulfilled}
          deleteNeed={deleteNeed} locale={locale} t={t}
        />
      )}

      {activeTab === 'wishes' && (
        <WishesTab
          student={student} canEditData={canEditData} wishTypes={wishTypes}
          showAddWish={showAddWish} setShowAddWish={setShowAddWish}
          selectedWishType={selectedWishType} setSelectedWishType={setSelectedWishType}
          newWish={newWish} setNewWish={setNewWish}
          addWish={addWish} toggleWishFulfilled={toggleWishFulfilled}
          deleteWish={deleteWish} locale={locale} t={t}
        />
      )}

      {activeTab === 'vouchers' && (
        <VouchersTab
          student={student} canEditData={canEditData} allSponsors={allSponsors}
          totalPurchased={totalPurchased} totalUsed={totalUsed}
          totalsByCurrency={totalsByCurrency} available={available}
          showAddVoucher={showAddVoucher} setShowAddVoucher={setShowAddVoucher}
          newVoucher={newVoucher} setNewVoucher={setNewVoucher}
          defaultDonor={defaultDonor} addVoucher={addVoucher}
          deleteVoucher={deleteVoucher} getVoucherRate={getVoucherRate}
          locale={locale} t={t}
        />
      )}

      {activeTab === 'photos' && (
        <PhotosTab
          student={student} canEditData={canEditData}
          photoFilter={photoFilter} setPhotoFilter={setPhotoFilter}
          filteredPhotos={filteredPhotos}
          showAddPhoto={showAddPhoto} setShowAddPhoto={setShowAddPhoto}
          newPhoto={newPhoto} setNewPhoto={setNewPhoto}
          addPhoto={addPhoto} deletePhoto={deletePhoto}
          uploading={uploading} locale={locale} t={t}
        />
      )}

      {activeTab === 'sponsors' && (
        <SponsorsTab
          student={student} canEditData={canEditData}
          showAddSponsor={showAddSponsor} setShowAddSponsor={setShowAddSponsor}
          showSponsorSearch={showSponsorSearch} setShowSponsorSearch={setShowSponsorSearch}
          sponsorSearch={sponsorSearch} searchSponsors={searchSponsors}
          sponsorResults={sponsorResults} addExistingSponsor={addExistingSponsor}
          newSponsor={newSponsor} setNewSponsor={setNewSponsor}
          addSponsor={addSponsor} removeSponsor={removeSponsor}
          editingSponsor={editingSponsor} setEditingSponsor={setEditingSponsor}
          editSponsorData={editSponsorData} setEditSponsorData={setEditSponsorData}
          saveSponsorEdit={saveSponsorEdit} locale={locale} t={t}
        />
      )}

      {activeTab === 'sponsorPayments' && (
        <SponsorPaymentsTab
          student={student} canEditData={canEditData}
          paymentTypes={paymentTypes} allSponsors={allSponsors}
          showAddPayment={showAddPayment} setShowAddPayment={setShowAddPayment}
          newPayment={newPayment} setNewPayment={setNewPayment}
          addSponsorPayment={addSponsorPayment} deleteSponsorPayment={deleteSponsorPayment}
          locale={locale} t={t}
        />
      )}

      {activeTab === 'tuition' && (
        <TuitionTab
          student={student} tuitionCharges={tuitionCharges}
          locale={locale} t={t}
        />
      )}

      {activeTab === 'health' && (
        <HealthTab
          student={student} canEditData={canEditData} healthTypes={healthTypes}
          showAddHealth={showAddHealth} setShowAddHealth={setShowAddHealth}
          newHealth={newHealth} setNewHealth={setNewHealth}
          addHealthCheck={addHealthCheck} deleteHealthCheck={deleteHealthCheck}
          locale={locale} t={t}
        />
      )}
    </div>
  )
}
