'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, User, Heart } from 'lucide-react'
import { calculateAge, formatDate } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locale, setLocale] = useState<Locale>('cs')

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then((data) => {
          setStudents(data.students || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('student.list')}</h1>
        <Link
          href="/students/new"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('student.new')}
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('app.search')}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white"
        />
      </div>

      {/* Student cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{t('app.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {student.firstName} {student.lastName}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{student.studentNo}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {student.className && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {student.className}
                      </span>
                    )}
                    {student.dateOfBirth && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {calculateAge(student.dateOfBirth)} {locale === 'cs' ? 'let' : locale === 'sw' ? 'miaka' : 'years'}
                      </span>
                    )}
                    {student._count?.needs > 0 && (
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {student._count.needs}
                      </span>
                    )}
                    {student.sponsorships?.length > 0 && (
                      <span className="bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full">
                        {student.sponsorships[0].sponsor.firstName} {student.sponsorships[0].sponsor.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Users2(props: any) {
  return <User {...props} />
}
