'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Upload, FileText, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/format'
import cs from '@/messages/cs.json'
import en from '@/messages/en.json'
import sw from '@/messages/sw.json'
import { createTranslator, type Locale } from '@/lib/i18n'

const msgs: Record<string, any> = { cs, en, sw }

interface PaymentImportItem {
  id: string
  fileName: string
  fileType: string
  totalRows: number
  matchedRows: number
  status: string
  createdAt: string
  importedBy: { firstName: string; lastName: string }
  _count: { rows: number }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  PROCESSING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  READY: { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', icon: XCircle },
}

export default function PaymentImportPage() {
  const router = useRouter()
  const [imports, setImports] = useState<PaymentImportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [locale, setLocale] = useState<Locale>('cs')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = createTranslator(msgs[locale])

  useEffect(() => {
    const saved = localStorage.getItem('rael-locale') as Locale
    if (saved) setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('locale-change', handler)
    return () => window.removeEventListener('locale-change', handler)
  }, [])

  useEffect(() => {
    fetchImports()
  }, [])

  async function fetchImports() {
    try {
      const res = await fetch('/api/payment-imports')
      if (res.ok) {
        const data = await res.json()
        setImports(data.imports || [])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  async function uploadFile(file: File) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showMsg('error', t('paymentImport.invalidFile'))
      return
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      showMsg('error', t('paymentImport.fileTooLarge'))
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/payment-imports', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        showMsg('success', t('paymentImport.uploadSuccess'))
        await fetchImports()
        // Navigate to detail page
        router.push(`/payments/import/${data.import.id}`)
      } else {
        const err = await res.json()
        showMsg('error', err.error || t('paymentImport.uploadError'))
      }
    } catch {
      showMsg('error', t('paymentImport.uploadError'))
    }
    setUploading(false)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset input so re-selecting the same file works
    e.target.value = ''
  }, [])

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      PROCESSING: t('paymentImport.statusProcessing'),
      READY: t('paymentImport.statusReady'),
      COMPLETED: t('paymentImport.statusCompleted'),
      CANCELLED: t('paymentImport.statusCancelled'),
    }
    return map[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/payments" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('paymentImport.title')}</h1>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative mb-8 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-primary-600">{t('paymentImport.uploading')}</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{t('paymentImport.upload')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('paymentImport.uploadHint')}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import history */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentImport.importHistory')}</h2>

        {imports.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">{t('paymentImport.noImports')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('paymentImport.importDate')}</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('paymentImport.fileName')}</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('paymentImport.totalRows')}</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('paymentImport.matchedRows')}</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('paymentImport.status')}</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">{t('paymentImport.importedBy')}</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => {
                  const style = STATUS_STYLES[imp.status] || STATUS_STYLES.PROCESSING
                  const StatusIcon = style.icon
                  return (
                    <tr key={imp.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                      <td className="py-3 px-3 text-sm text-gray-900">{formatDate(imp.createdAt, locale)}</td>
                      <td className="py-3 px-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{imp.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-900">{formatNumber(imp.totalRows)}</td>
                      <td className="py-3 px-3 text-sm">
                        <span className="font-medium text-green-700">{formatNumber(imp.matchedRows)}</span>
                        <span className="text-gray-400"> / {formatNumber(imp.totalRows)}</span>
                      </td>
                      <td className="py-3 px-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusLabel(imp.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {imp.importedBy ? `${imp.importedBy.firstName} ${imp.importedBy.lastName}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/payments/import/${imp.id}`}
                          className="text-sm text-primary-600 hover:text-primary-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t('paymentImport.detail')} →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
