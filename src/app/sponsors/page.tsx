'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Heart, Plus, Search, Pencil, X, Check, UserX, UserCheck,
  Mail, Phone, Users, CreditCard
} from 'lucide-react'
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

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [locale, setLocale] = useState<Locale>('cs')
  const [user, setUser] = useState<any>(null)

  // Form state for new sponsor
  const [newForm, setNewForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  // Form state for editing
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  const t = createTranslator(msgs[locale])

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

  // Filter sponsors
  const filtered = sponsors.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.firstName.toLowerCase().includes(q)
      || s.lastName.toLowerCase().includes(q)
      || s.email.toLowerCase().includes(q)
      || (s.phone && s.phone.toLowerCase().includes(q))
  })

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.sponsors')}</h1>
          <span className="text-sm text-gray-500">({filtered.length})</span>
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
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('app.search')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          />
        </div>
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

      {/* Sponsor cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className={`bg-white rounded-xl border ${s.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'} p-5 group`}>
              {editingId === s.id ? (
                /* Edit mode */
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      placeholder={t('student.firstName')}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      placeholder={t('student.lastName')}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder={t('sponsors.email')}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder={t('sponsors.phone')}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveSponsor(s.id)} className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700">
                      <Check className="w-3 h-3" /> {t('app.save')}
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300">
                      <X className="w-3 h-3" /> {t('app.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.isActive ? 'bg-accent-100' : 'bg-red-100'}`}>
                        <span className={`text-sm font-bold ${s.isActive ? 'text-accent-700' : 'text-red-700'}`}>
                          {s.firstName[0]}{s.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.lastName} {s.firstName}</h3>
                        {!s.isActive && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            {t('sponsorPage.inactive')}
                          </span>
                        )}
                      </div>
                    </div>
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
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1 mb-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {s.email}
                    </div>
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {s.phone}
                      </div>
                    )}
                  </div>

                  {/* Students */}
                  {s.sponsorships.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">{t('sponsorPage.students')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.sponsorships.map((sp) => (
                          <Link
                            key={sp.id}
                            href={`/students/${sp.student.id}`}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                              sp.isActive
                                ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                : 'bg-gray-100 text-gray-500 line-through'
                            }`}
                          >
                            {sp.student.lastName} {sp.student.firstName}
                            {sp.student.className && <span className="text-gray-400">({sp.student.className})</span>}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payments summary */}
                  {Object.keys(s.paymentsByCurrency).length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {Object.entries(s.paymentsByCurrency).map(([currency, amount], i) => (
                          <span key={currency}>
                            {i > 0 && ' | '}
                            <span className="font-medium text-gray-700">{formatCurrency(amount)} {currency}</span>
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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
