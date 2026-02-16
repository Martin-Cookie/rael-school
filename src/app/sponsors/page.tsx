'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Heart, Plus, Search, Pencil, X, Check, UserX, UserCheck,
  ChevronUp, ChevronDown, ArrowUpDown
} from 'lucide-react'
import Pagination from '@/components/Pagination'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

interface Sponsor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  sponsorships: Array<{
    id: string
    isActive: boolean
    student: {
      id: string
      firstName: string
      lastName: string
      studentNo: string
      className: string | null
      isActive: boolean
    }
  }>
  paymentsByCurrency: Record<string, number>
}

type SortDir = 'asc' | 'desc'

export default function SponsorsPage() {
  const router = useRouter()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [backUrl, setBackUrl] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const PAGE_SIZE = 12
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [locale, setLocale] = useState<Locale>('cs')
  const [user, setUser] = useState<any>(null)
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Form state for new sponsor
  const [newForm, setNewForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  // Form state for editing
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromParam = params.get('from')
    if (fromParam) setBackUrl(fromParam)
    const searchParam = params.get('search')
    if (searchParam) setSearch(searchParam)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user)).catch(() => {})
    fetchSponsors()
  }, [])

  async function fetchSponsors() {
    try {
      const res = await fetch('/api/sponsors?includeInactive=true')
      const data = await res.json()
      setSponsors(data.sponsors || [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function addSponsor() {
    if (!newForm.firstName.trim() || !newForm.lastName.trim() || !newForm.email.trim()) {
      showMsg('error', t('sponsorPage.requiredFields'))
      return
    }
    try {
      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      })
      if (res.ok) {
        setNewForm({ firstName: '', lastName: '', email: '', phone: '' })
        setShowAdd(false)
        await fetchSponsors()
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error === 'Email already exists' ? t('sponsorPage.emailExists') : (d.error || t('app.error')))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function saveSponsor(id: string) {
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      showMsg('error', t('sponsorPage.requiredFields'))
      return
    }
    try {
      const res = await fetch(`/api/sponsors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditingId(null)
        await fetchSponsors()
        showMsg('success', t('app.savedSuccess'))
      } else {
        const d = await res.json()
        showMsg('error', d.error === 'Email already in use' ? t('sponsorPage.emailExists') : (d.error || t('app.error')))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const msg = currentActive ? t('sponsorPage.confirmDeactivate') : t('sponsorPage.confirmReactivate')
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/sponsors/${id}`, { method: 'PATCH' })
      if (res.ok) {
        await fetchSponsors()
        showMsg('success', t('app.savedSuccess'))
      } else {
        showMsg('error', t('app.error'))
      }
    } catch { showMsg('error', t('app.error')) }
  }

  function startEdit(s: Sponsor) {
    setEditingId(s.id)
    setEditForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, phone: s.phone || '' })
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('cs-CZ').replace(/,/g, ' ')
  }

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va = col === '_sponsorshipCount' ? (a.sponsorships?.length ?? 0) : a[col]
      let vb = col === '_sponsorshipCount' ? (b.sponsorships?.length ?? 0) : b[col]
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  // Filter sponsors
  const filtered = sponsors.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.firstName.toLowerCase().includes(q)
      || s.lastName.toLowerCase().includes(q)
      || s.email.toLowerCase().includes(q)
      || (s.phone && s.phone.toLowerCase().includes(q))
  })

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1) }, [search])

  const sorted = sortData(filtered, sortCol)
  const paginatedSponsors = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const paginationLabels = { showing: t('pagination.showing'), of: t('pagination.of'), prev: t('pagination.prev'), next: t('pagination.next') }

  const canEdit = user && ['ADMIN', 'MANAGER', 'VOLUNTEER'].includes(user.role)
  const canDeactivate = user && ['ADMIN', 'MANAGER'].includes(user.role)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {backUrl && (
            <button onClick={() => router.push(backUrl)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.sponsors')} <span className="text-sm font-normal text-gray-500">({filtered.length})</span></h1>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> {t('sponsorPage.addSponsor')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('app.search')}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white"
        />
      </div>

      {/* Add new sponsor form */}
      {showAdd && (
        <div className="bg-accent-50 rounded-xl border border-accent-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('sponsorPage.addSponsor')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newForm.firstName}
              onChange={(e) => setNewForm({ ...newForm, firstName: e.target.value })}
              placeholder={t('student.firstName') + ' *'}
              className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
            <input
              type="text"
              value={newForm.lastName}
              onChange={(e) => setNewForm({ ...newForm, lastName: e.target.value })}
              placeholder={t('student.lastName') + ' *'}
              className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
            <input
              type="email"
              value={newForm.email}
              onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
              placeholder={t('sponsors.email') + ' *'}
              className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
            <input
              type="text"
              value={newForm.phone}
              onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
              placeholder={t('sponsors.phone')}
              className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addSponsor} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
              <Check className="w-4 h-4" /> {t('app.save')}
            </button>
            <button onClick={() => { setShowAdd(false); setNewForm({ firstName: '', lastName: '', email: '', phone: '' }) }} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300">
              {t('app.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Sponsor table */}
      {filtered.length > 0 ? (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
                    <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
                    <SH col="email" className="text-left">{t('sponsors.email')}</SH>
                    <SH col="phone" className="text-left">{t('sponsors.phone')}</SH>
                    <SH col="_sponsorshipCount" className="text-left">{t('nav.students')}</SH>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('payments.title')}</th>
                    {(canEdit || canDeactivate) && <th className="py-2 px-3 text-sm font-medium text-gray-500 w-20"></th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSponsors.map((s) => (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 group ${!s.isActive ? 'bg-red-50/50' : ''}`}>
                      {editingId === s.id ? (
                        <>
                          <td className="py-2 px-3">
                            <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-500" colSpan={2}>-</td>
                          <td className="py-2 px-3">
                            <div className="flex gap-1">
                              <button onClick={() => saveSponsor(s.id)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-sm font-medium text-gray-900">
                            {s.lastName}
                            {!s.isActive && <span className="ml-2 inline-block text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{t('sponsorPage.inactive')}</span>}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{s.email}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{s.phone || '-'}</td>
                          <td className="py-2 px-3 text-sm">
                            {s.sponsorships.length > 0 ? (
                              <div className="flex flex-nowrap gap-1 overflow-hidden max-h-6">
                                {s.sponsorships.map((sp) => (
                                  <Link
                                    key={sp.id}
                                    href={`/students/${sp.student.id}?from=/sponsors`}
                                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                      sp.isActive
                                        ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                        : 'bg-gray-100 text-gray-500 line-through'
                                    }`}
                                  >
                                    {sp.student.lastName} {sp.student.firstName}
                                  </Link>
                                ))}
                              </div>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-600">
                            {Object.keys(s.paymentsByCurrency).length > 0 ? (
                              Object.entries(s.paymentsByCurrency).map(([currency, amount], i) => (
                                <span key={currency}>
                                  {i > 0 && ' | '}
                                  <span className="font-medium">{formatCurrency(amount)} {currency}</span>
                                </span>
                              ))
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          {(canEdit || canDeactivate) && (
                            <td className="py-1 px-3">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEdit && (
                                  <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {canDeactivate && (
                                  <button onClick={() => toggleActive(s.id, s.isActive)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-gray-100" title={s.isActive ? t('sponsorPage.deactivate') : t('sponsorPage.reactivate')}>
                                    {s.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} labels={paginationLabels} />
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">{search ? t('sponsorPage.noResults') : t('sponsors.noSponsors')}</p>
        </div>
      )}
    </div>
  )
}
