'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Printer, X } from 'lucide-react'
import { formatNumber, formatDate, calculateAge } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, getLocaleName, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

interface StudentData {
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
  motherName: string | null
  motherAlive: boolean | null
  fatherName: string | null
  fatherAlive: boolean | null
  siblings: string | null
  notes: string | null
  equipment: { id: string; type: string; condition: string; acquiredAt: string | null; notes: string | null }[]
  needs: { id: string; description: string; notes: string | null }[]
  wishes: { id: string; description: string; notes: string | null; wishType: { id: string; name: string } | null }[]
  sponsorships: { sponsor: { firstName: string; lastName: string; email: string | null; phone: string | null } }[]
}

interface LookupType {
  id: string
  name: string
  price: number | null
}

export default function VisitCardsPrintPage() {
  const [students, setStudents] = useState<StudentData[]>([])
  const [needTypes, setNeedTypes] = useState<LookupType[]>([])
  const [wishTypes, setWishTypes] = useState<LookupType[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<LookupType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [locale, setLocale] = useState<Locale>('cs')
  const printContentRef = useRef<HTMLDivElement>(null)

  const t = createTranslator(msgs[locale])

  // Iframe-based print: creates isolated HTML snapshot unaffected by React lifecycle
  const handlePrint = useCallback(() => {
    const content = printContentRef.current
    if (!content) return

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument
    const iframeWin = iframe.contentWindow
    if (!iframeDoc || !iframeWin) {
      document.body.removeChild(iframe)
      return
    }

    // Copy all stylesheets from the parent document (Tailwind + globals.css)
    const parentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n')

    iframeDoc.open()
    iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
${parentStyles}
<style>
  @page { size: A4; margin: 8mm; }
  body { margin: 0; padding: 0; background: white; color: #000 !important; }
  * { color: #000 !important; }
  .no-print { display: none !important; }
  .print-page {
    page-break-after: always;
    page-break-inside: avoid;
    padding: 8mm;
    margin: 0;
  }
  .print-page:last-child { page-break-after: auto; }
  .print-page { display: flex; flex-direction: column; height: calc(297mm - 16mm); box-sizing: border-box; overflow: hidden; }
  table { font-size: 12px !important; }
  td, th { padding-top: 3px !important; padding-bottom: 3px !important; }
  h2, h3, .section-title { font-size: 13px !important; }
  .notes-fill { flex: 1; display: flex; flex-direction: column; }
  .notes-fill .notes-box { flex: 1; }
</style>
</head><body>${content.innerHTML}</body></html>`)
    iframeDoc.close()

    let printed = false
    const doPrint = () => {
      if (printed) return
      printed = true
      iframeWin.focus()
      iframeWin.print()
      // Clean up after print dialog closes
      iframeWin.addEventListener('afterprint', () => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      })
      // Fallback cleanup (e.g. if afterprint doesn't fire)
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 60000)
    }

    // Wait for external stylesheets to load in the iframe
    const links = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]'))
    if (links.length === 0) {
      doPrint()
    } else {
      let loaded = 0
      const onStyleLoad = () => {
        loaded++
        if (loaded >= links.length) doPrint()
      }
      links.forEach(link => {
        link.addEventListener('load', onStyleLoad)
        link.addEventListener('error', onStyleLoad)
      })
      // Fallback: print after 3s even if styles haven't loaded
      setTimeout(doPrint, 3000)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
  }, [])

  // Add body class for print styles (defined in globals.css)
  useEffect(() => {
    document.body.classList.add('print-visit-cards')
    return () => document.body.classList.remove('print-visit-cards')
  }, [])

  useEffect(() => {
    const idsJson = sessionStorage.getItem('visitCardIds')
    if (!idsJson) {
      setLoading(false)
      setError(true)
      return
    }

    const selectedIds: string[] = JSON.parse(idsJson)
    if (selectedIds.length === 0) {
      setLoading(false)
      setError(true)
      return
    }

    fetch('/api/reports/visit-cards')
      .then(r => r.json())
      .then(data => {
        const allStudents: StudentData[] = data.students || []
        const selectedStudents = allStudents.filter(s => selectedIds.includes(s.id))
        // Sort by class then last name
        selectedStudents.sort((a, b) => {
          const ca = a.className || ''
          const cb = b.className || ''
          if (ca !== cb) return ca.localeCompare(cb)
          return a.lastName.localeCompare(b.lastName)
        })
        setStudents(selectedStudents)
        setNeedTypes(data.needTypes || [])
        setWishTypes(data.wishTypes || [])
        setEquipmentTypes(data.equipmentTypes || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setError(true)
      })
  }, [])

  function formatOrphanStatus(status: string | null): string {
    if (status === 'total') return t('visitCards.orphanTotal')
    if (status === 'partial') return t('visitCards.orphanPartial')
    return t('visitCards.orphanNone')
  }

  function formatGender(gender: string | null): string {
    if (gender === 'M') return t('student.male')
    if (gender === 'F') return t('student.female')
    return '-'
  }

  function formatBool(val: boolean | null): string {
    if (val === true) return t('app.yes')
    if (val === false) return t('app.no')
    return '-'
  }

  function formatCondition(condition: string): string {
    if (condition === 'new') return t('visitCards.conditionNew')
    if (condition === 'satisfactory') return t('visitCards.conditionSatisfactory')
    if (condition === 'poor') return t('visitCards.conditionPoor')
    return condition
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('visitCards.loadingPrint')}</p>
        </div>
      </div>
    )
  }

  if (error || students.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">{t('visitCards.noStudentsLoaded')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar - hidden during print (styles in globals.css via body.print-visit-cards) */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">{t('visitCards.title')}</h1>
          <span className="text-sm text-gray-500">
            {t('visitCards.pageOf', { current: String(students.length * 2), total: String(students.length * 2) })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {t('visitCards.print')}
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {t('app.close')}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="no-print h-14" /> {/* Spacer for fixed toolbar */}
      <div className="bg-gray-100 min-h-screen py-4 no-print-bg">
        <div ref={printContentRef}>
        {students.map((student, idx) => (
          <div key={student.id}>
            {/* ===== PAGE 1: Header + Sponsors + Basic Info + Family + Equipment ===== */}
            <div className="print-page" style={{ height: 'calc(297mm - 16mm)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-gray-800 pb-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {student.lastName} {student.firstName}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {t('visitCards.printSubtitle')} &bull; {student.studentNo}
                    {student.className && <> &bull; {student.className}</>}
                    {student.school && <> &bull; {student.school}</>}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {idx + 1}/1
                </div>
              </div>

              {/* Sponsors */}
              <div className="mb-3">
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.sponsorSection')}
                  {student.sponsorships.length > 0 && <span className="ml-2 font-normal text-gray-500">({student.sponsorships.length})</span>}
                </h3>
                {student.sponsorships.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 italic">{t('visitCards.sponsorNone')}</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-400">
                        <th className="text-left py-1.5 px-2 font-bold text-gray-600">{t('student.lastName')}</th>
                        <th className="text-left py-1.5 px-2 font-bold text-gray-600">{t('student.firstName')}</th>
                        <th className="text-left py-1.5 px-2 font-bold text-gray-600">{t('sponsors.email')}</th>
                        <th className="text-left py-1.5 px-2 font-bold text-gray-600">{t('sponsors.phone')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.sponsorships.map((sp, i) => (
                        <tr key={i} className="border-b border-gray-300">
                          <td className="py-1.5 px-2 font-bold">{sp.sponsor.lastName}</td>
                          <td className="py-1.5 px-2">{sp.sponsor.firstName}</td>
                          <td className="py-1.5 px-2">{sp.sponsor.email || '-'}</td>
                          <td className="py-1.5 px-2">{sp.sponsor.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Basic Info */}
              <div className="mb-3">
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.basicInfo')}
                </h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-400">
                      <th className="text-left py-1.5 px-2 w-1/4 font-bold text-gray-600"></th>
                      <th className="text-left py-1.5 px-2 w-1/3 font-bold text-gray-600">{t('visitCards.currentValue')}</th>
                      <th className="text-left py-1.5 px-2 font-bold text-gray-600">{t('visitCards.newValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('student.className')}</td>
                      <td className="py-1.5 px-2">{student.className || '-'}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('visitCards.school')}</td>
                      <td className="py-1.5 px-2">{student.school || '-'}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('visitCards.dateOfBirth')}</td>
                      <td className="py-1.5 px-2">
                        {formatDate(student.dateOfBirth, locale)}
                        {student.dateOfBirth && (() => { const age = calculateAge(student.dateOfBirth); return age !== null ? ` (${age} ${t('student.age').toLowerCase()})` : '' })()}
                      </td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('student.gender')}</td>
                      <td className="py-1.5 px-2">{formatGender(student.gender)}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('visitCards.orphanStatus')}</td>
                      <td className="py-1.5 px-2">{formatOrphanStatus(student.orphanStatus)}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('student.healthStatus')}</td>
                      <td className="py-1.5 px-2">{student.healthStatus || '-'}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Family Info */}
              <div className="mb-3">
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.familyInfo')}
                </h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-400">
                      <th className="text-left py-1.5 px-2 w-1/4 font-bold text-gray-600"></th>
                      <th className="text-left py-1.5 px-2 w-1/3 font-bold text-gray-600">{t('visitCards.currentValue')}</th>
                      <th className="text-left py-1.5 px-2 font-bold text-gray-600">{t('visitCards.newValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('student.family.motherName')}</td>
                      <td className="py-1.5 px-2">{student.motherName || '-'}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('visitCards.motherAlive')}</td>
                      <td className="py-1.5 px-2">{formatBool(student.motherAlive)}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('student.family.fatherName')}</td>
                      <td className="py-1.5 px-2">{student.fatherName || '-'}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('visitCards.fatherAlive')}</td>
                      <td className="py-1.5 px-2">{formatBool(student.fatherAlive)}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-1.5 px-2 font-bold">{t('student.family.siblings')}</td>
                      <td className="py-1.5 px-2">{student.siblings || '-'}</td>
                      <td className="py-1.5 px-2 border-b border-dotted border-gray-400"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Equipment Section — compact to fit page */}
              <div>
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.equipmentSection')}
                  {student.equipment.length > 0 && <span className="ml-2 font-normal text-gray-500">({t('visitCards.currentEquipment')}: {student.equipment.length})</span>}
                </h3>
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '11px' }}>
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '55%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b-2 border-gray-400">
                      <th className="text-left py-0.5 px-1.5"></th>
                      <th className="text-left py-0.5 px-1.5 font-bold text-gray-600">{t('equipment.type')}</th>
                      <th className="text-left py-0.5 px-1.5 font-bold text-gray-600">{t('equipment.condition')}</th>
                      <th className="text-left py-0.5 px-1.5 font-bold text-gray-600">{t('visitCards.price')}</th>
                      <th className="text-left py-0.5 px-1.5 font-bold text-gray-600">{t('visitCards.notesField')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentTypes.map(eqType => {
                      const existing = student.equipment.find(e => e.type === eqType.name)
                      return (
                        <tr key={eqType.id} className="border-b border-gray-300">
                          <td className="py-0.5 px-1.5">
                            <div className={`w-3 h-3 border rounded ${existing ? 'bg-gray-800 border-gray-800' : 'border-gray-400'}`}>
                              {existing && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </td>
                          <td className={`py-0.5 px-1.5 ${existing ? 'font-bold' : ''}`}>{getLocaleName(eqType, locale)}</td>
                          <td className="py-0.5 px-1.5">{existing ? formatCondition(existing.condition) : ''}</td>
                          <td className="py-0.5 px-1.5 text-gray-400">{eqType.price ? `${formatNumber(eqType.price)}` : ''}</td>
                          <td className="py-0.5 px-1.5">{existing?.notes || ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== PAGE 2: Needs + Wishes + General Notes ===== */}
            <div className="print-page" style={{ height: 'calc(297mm - 16mm)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
              {/* Header (repeated) */}
              <div className="flex items-start justify-between border-b-2 border-gray-800 pb-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {student.lastName} {student.firstName}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {t('visitCards.printSubtitle')} &bull; {student.studentNo}
                    {student.className && <> &bull; {student.className}</>}
                    {student.school && <> &bull; {student.school}</>}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {idx + 1}/2
                </div>
              </div>

              {/* Needs Section — compact 3-column grid */}
              <div className="mb-3">
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.needsSection')}
                  {student.needs.length > 0 && <span className="ml-2 font-normal text-red-600">({t('needs.unfulfilled')}: {student.needs.length})</span>}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0' }}>
                  {needTypes.map(nt => {
                    const hasNeed = student.needs.some(n => n.description === nt.name)
                    return (
                      <div key={nt.id} className="flex items-center gap-1.5 py-1 px-2 border-b border-gray-300" style={{ fontSize: '12px' }}>
                        <div className={`w-3.5 h-3.5 border rounded flex-shrink-0 ${hasNeed ? 'bg-red-600 border-red-600' : 'border-gray-400'}`}>
                          {hasNeed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={hasNeed ? 'font-bold text-red-700' : ''}>{getLocaleName(nt, locale)}</span>
                        {nt.price && <span className="text-gray-400 ml-auto flex-shrink-0">{formatNumber(nt.price)}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Wishes Section — compact 3-column grid */}
              <div className="mb-3">
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.wishesSection')}
                  {student.wishes.length > 0 && <span className="ml-2 font-normal text-blue-600">({t('needs.unfulfilled')}: {student.wishes.length})</span>}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0' }}>
                  {wishTypes.map(wt => {
                    const hasWish = student.wishes.some(w => w.wishType?.name === wt.name)
                    return (
                      <div key={wt.id} className="flex items-center gap-1.5 py-1 px-2 border-b border-gray-300" style={{ fontSize: '12px' }}>
                        <div className={`w-3.5 h-3.5 border rounded flex-shrink-0 ${hasWish ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                          {hasWish && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={hasWish ? 'font-bold text-blue-700' : ''}>{getLocaleName(wt, locale)}</span>
                        {wt.price && <span className="text-gray-400 ml-auto flex-shrink-0">{formatNumber(wt.price)}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* General notes area - fills remaining page space */}
              <div className="notes-fill" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 bg-gray-100 px-2 py-1 rounded">
                  {t('visitCards.generalNotes')}
                </h3>
                {student.notes && (
                  <p className="text-sm text-gray-600 px-2 mb-1">{student.notes}</p>
                )}
                <div className="notes-box border border-gray-400 rounded p-2" style={{ flex: 1, minHeight: '60px' }}>
                  &nbsp;
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </>
  )
}
