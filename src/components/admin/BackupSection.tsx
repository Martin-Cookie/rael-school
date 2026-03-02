'use client'

import { useState, useRef } from 'react'
import { Database, Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, ChevronDown } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { BackupSectionProps } from './types'

export function BackupSection({ t, showMsg }: BackupSectionProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const restoreModalRef = useFocusTrap(showRestoreConfirm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleDownload(endpoint: string, key: string) {
    setDownloading(key)
    try {
      const res = await fetch(endpoint)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showMsg('error', data.error || t('app.error'))
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="(.+?)"/)
      const fileName = match ? match[1] : 'backup'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showMsg('success', t('app.savedSuccess'))
    } catch {
      showMsg('error', t('app.error'))
    } finally {
      setDownloading(null)
    }
  }

  async function handleRestore() {
    if (!selectedFile) return
    setRestoring(true)
    setShowRestoreConfirm(false)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('success', t('admin.restoreSuccess'))
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        // Redirect to dashboard after short delay to allow Prisma to reconnect
        setTimeout(() => { window.location.href = '/dashboard' }, 2000)
      } else {
        showMsg('error', data.error || t('admin.restoreError'))
      }
    } catch {
      showMsg('error', t('admin.restoreError'))
    } finally {
      setRestoring(false)
    }
  }

  const downloadButtons = [
    { key: 'db', label: t('admin.downloadDb'), desc: t('admin.downloadDbDesc'), icon: Database, endpoint: '/api/admin/backup/database' },
    { key: 'json', label: t('admin.downloadJson'), desc: t('admin.downloadJsonDesc'), icon: FileJson, endpoint: '/api/admin/backup/json' },
    { key: 'csv-students', label: t('admin.exportStudentsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=students' },
    { key: 'csv-sponsors', label: t('admin.exportSponsorsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=sponsors' },
    { key: 'csv-payments', label: t('admin.exportPaymentsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=payments' },
    { key: 'csv-codelists', label: t('admin.exportCodelistsCsv'), desc: t('admin.csvDesc'), icon: FileSpreadsheet, endpoint: '/api/admin/backup/csv?type=codelists' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Database className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight" title={t('admin.backup')}>{t('admin.backup')}</h3>
          <p className="text-sm text-gray-600">{t('admin.backupDesc')}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
          {/* Download buttons */}
          {downloadButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleDownload(btn.endpoint, btn.key)}
              disabled={downloading !== null}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
            >
              <btn.icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 block">{btn.label}</span>
                <span className="text-xs text-gray-600">{btn.desc}</span>
              </div>
              {downloading === btn.key ? (
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
          ))}

          {/* Restore section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-semibold text-gray-900">{t('admin.restoreBackup')}</h4>
            </div>
            <p className="text-xs text-gray-600 mb-3">{t('admin.restoreDesc')}</p>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
              />
              <button
                onClick={() => setShowRestoreConfirm(true)}
                disabled={!selectedFile || restoring}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('admin.restoring')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('admin.restoreConfirm')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Restore confirmation modal */}
          {showRestoreConfirm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" ref={restoreModalRef} onKeyDown={(e) => e.key === 'Escape' && setShowRestoreConfirm(false)}>
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('admin.restoreBackup')}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{t('admin.restoreWarning')}</p>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRestoreConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                  >
                    {t('app.cancel')}
                  </button>
                  <button
                    onClick={handleRestore}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600"
                  >
                    {t('admin.restoreConfirm')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
