'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, User, Download } from 'lucide-react'
import { calculateAge } from '@/lib/format'
import { downloadCSV } from '@/lib/csv'
import { useLocale } from '@/hooks/useLocale'
import { useSorting } from '@/hooks/useSorting'
import { useStickyTop } from '@/hooks/useStickyTop'
import { SortHeader } from '@/components/SortHeader'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { locale, t } = useLocale()
  const { sortCol, sortDir, handleSort, sortData } = useSorting()
  const { stickyRef, theadTop } = useStickyTop([])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(search)}`)
        .then(r => r.json()).then(data => { setStudents(data.students || []); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const sorted = sortData(students, sortCol)

  function SH({ col, children, className = '' }: { col: string; children: React.ReactNode; className?: string }) {
    return <SortHeader col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className={className}>{children}</SortHeader>
  }

  function exportStudents() {
    const headers = [t('student.studentNo'), t('student.lastName'), t('student.firstName'), t('student.className'), t('student.gender'), t('student.age'), t('needs.title'), t('sponsors.title')]
    const rows = sorted.map((s: any) => [
      s.studentNo,
      s.lastName,
      s.firstName,
      s.className || '',
      s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '',
      s.dateOfBirth ? calculateAge(s.dateOfBirth) : '',
      s._count?.needs || 0,
      s.sponsorships?.map((sp: any) => `${sp.sponsor.lastName} ${sp.sponsor.firstName}`).join('; ') || '0',
    ])
    downloadCSV('students.csv', headers, rows)
  }

  return (
    <div>
      <div ref={stickyRef} className="sticky top-16 lg:top-0 z-30 bg-[#fafaf8] dark:bg-gray-900 pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('student.list')} <span className="text-sm font-normal text-gray-500">({students.length})</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={exportStudents} className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> {t('app.exportCSV')}
            </button>
            <Link href="/students/new" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> {t('student.new')}
            </Link>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('app.search')} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white" />
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><User className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>{t('app.noData')}</p></div>
      ) : (
        <div>
          <div className="bg-white rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky z-20" style={{ top: theadTop }}>
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
                  {sorted.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-500">{s.studentNo}</td>
                      <td className="py-3 px-3 text-sm font-medium">
                        <Link href={`/students/${s.id}?from=/students`} className="text-primary-600 hover:underline">{s.lastName}</Link>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.firstName}</td>
                      <td className="py-3 px-3 text-sm">{s.className ? <Link href={`/classes?class=${encodeURIComponent(s.className)}&from=/students`} className="text-primary-600 hover:underline">{s.className}</Link> : '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.gender === 'M' ? t('student.male') : s.gender === 'F' ? t('student.female') : '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-900">{s.dateOfBirth ? calculateAge(s.dateOfBirth) : '-'}</td>
                      <td className="py-3 px-3 text-sm text-right">{s._count?.needs > 0 ? <span className="badge badge-red">{s._count.needs}</span> : <span className="text-gray-400">0</span>}</td>
                      <td className="py-3 px-3 text-sm text-right">
                        {s.sponsorships?.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {s.sponsorships.map((sp: any) => (
                              <Link key={sp.id} href={`/sponsors?search=${encodeURIComponent(sp.sponsor.lastName)}&from=/students`} className="badge badge-green hover:opacity-80">{sp.sponsor.lastName} {sp.sponsor.firstName}</Link>
                            ))}
                          </div>
                        ) : <span className="text-gray-400">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
      )}
    </div>
  )
}
