'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, User, Heart, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { calculateAge } from '@/lib/format'
import Pagination from '@/components/Pagination'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type SortDir = 'asc' | 'desc'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [locale, setLocale] = useState<Locale>('cs')
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const PAGE_SIZE = 20

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    const timer = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(search)}`)
        .then(r => r.json()).then(data => { setStudents(data.students || []); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va = col.startsWith('_count.') ? a._count?.[col.replace('_count.', '')] ?? 0 : col.includes('.') ? col.split('.').reduce((o: any, k: string) => o?.[k], a) : a[col]
      let vb = col.startsWith('_count.') ? b._count?.[col.replace('_count.', '')] ?? 0 : col.includes('.') ? col.split('.').reduce((o: any, k: string) => o?.[k], b) : b[col]
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  const sorted = sortData(students, sortCol)
  const paginatedStudents = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const paginationLabels = { showing: t('pagination.showing'), of: t('pagination.of'), prev: t('pagination.prev'), next: t('pagination.next') }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('student.list')} <span className="text-sm font-normal text-gray-500">({students.length})</span></h1>
        <Link href="/students/new" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> {t('student.new')}
        </Link>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('app.search')} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white" />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><User className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>{t('app.noData')}</p></div>
      ) : (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <SH col="studentNo" className="text-left">{t('student.studentNo')}</SH>
                    <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
                    <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
                    <SH col="className" className="text-left">{t('student.className')}</SH>
                    <SH col="gender" className="text-left">{t('student.gender')}</SH>
                    <SH col="dateOfBirth" className="text-left">{t('student.age')}</SH>
                    <SH col="_count.needs" className="text-right">{t('needs.title')}</SH>
                    <SH col="_count.sponsorships" className="text-right">{t('sponsors.title')}</SH>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-500">{s.studentNo}</td>
                      <td className="py-3 px-3 text-sm font-medium">
                        <Link href={`/students/${s.id}?from=/students`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.className || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.dateOfBirth ? calculateAge(s.dateOfBirth) : '-'}</td>
                      <td className="py-3 px-3 text-sm text-right">{s._count?.needs > 0 ? <span className="badge badge-red">{s._count.needs}</span> : <span className="text-gray-400">0</span>}</td>
                      <td className="py-3 px-3 text-sm text-right">{s._count?.sponsorships > 0 ? <span className="badge badge-green">{s._count.sponsorships}</span> : <span className="text-gray-400">0</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalItems={students.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} labels={paginationLabels} />
        </div>
      )}
    </div>
  )
}
