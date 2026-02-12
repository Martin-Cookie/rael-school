'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

type SortDir = 'asc' | 'desc'

export default function ClassesPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('cs')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(data => {
      setStudents(data.students || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortData<T>(data: T[], col: string): T[] {
    if (!col) return data
    return [...data].sort((a: any, b: any) => {
      let va = col.startsWith('_count.') ? a._count?.[col.replace('_count.', '')] ?? 0 : a[col]
      let vb = col.startsWith('_count.') ? b._count?.[col.replace('_count.', '')] ?? 0 : b[col]
      if (va == null) va = ''; if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) : String(vb).toLowerCase().localeCompare(String(va).toLowerCase())
    })
  }

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    const isA = sortCol === col
    return <th className={`py-2 px-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${className}`} onClick={() => handleSort(col)}><div className="flex items-center gap-1">{children}{isA ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div></th>
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>

  const classNames = [...new Set(students.map((s: any) => s.className).filter(Boolean))].sort() as string[]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.classOverview')}</h1>
          <p className="text-sm text-gray-500">{formatNumber(classNames.length)} {locale === 'cs' ? 'tříd' : locale === 'sw' ? 'madarasa' : 'classes'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {!selectedClass ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {classNames.map(cn => {
              const count = students.filter((s: any) => s.className === cn).length
              return (
                <button key={cn} onClick={() => { setSelectedClass(cn); setSortCol('') }} className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 text-left transition-colors">
                  <p className="text-lg font-bold text-gray-900">{cn}</p>
                  <p className="text-sm text-gray-500">{count} {locale === 'cs' ? 'studentů' : locale === 'sw' ? 'wanafunzi' : 'students'}</p>
                </button>
              )
            })}
            {classNames.length === 0 && <p className="text-gray-500 text-sm col-span-full text-center py-8">{t('app.noData')}</p>}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedClass(null)} className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4">← {t('dashboard.classOverview')}</button>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedClass} ({students.filter((s: any) => s.className === selectedClass).length})</h3>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
              <SH col="studentNo" className="text-left">{t('student.studentNo')}</SH>
              <SH col="lastName" className="text-left">{t('student.lastName')}</SH>
              <SH col="firstName" className="text-left">{t('student.firstName')}</SH>
              <SH col="gender" className="text-left">{t('student.gender')}</SH>
              <SH col="_count.needs" className="text-right">{t('needs.title')}</SH>
              <SH col="_count.sponsorships" className="text-right">{t('sponsors.title')}</SH>
            </tr></thead><tbody>
              {sortData(students.filter((s: any) => s.className === selectedClass), sortCol).map((s: any) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 text-sm text-gray-500">{s.studentNo}</td>
                  <td className="py-3 px-3 text-sm font-medium"><Link href={`/students/${s.id}?from=/classes`} className="text-primary-600 hover:underline">{s.lastName}</Link></td>
                  <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                  <td className="py-3 px-3 text-sm text-gray-900">{s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '-'}</td>
                  <td className="py-3 px-3 text-sm text-right">{s._count.needs > 0 ? <span className="badge badge-red">{s._count.needs}</span> : <span className="text-gray-400">0</span>}</td>
                  <td className="py-3 px-3 text-sm text-right">{s._count.sponsorships > 0 ? <span className="badge badge-green">{s._count.sponsorships}</span> : <span className="text-gray-400">0</span>}</td>
                </tr>
              ))}
            </tbody></table></div>
          </div>
        )}
      </div>
    </div>
  )
}
