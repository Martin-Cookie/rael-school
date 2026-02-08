'use client'

import { useEffect, useState } from 'react'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

export default function ReportsPage() {
  const [locale, setLocale] = useState<Locale>('cs')
  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.reports')}</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">{t('nav.reports')} — Fáze 8</p>
        <p className="text-sm text-gray-400 mt-2">Coming in Phase 8</p>
      </div>
    </div>
  )
}
