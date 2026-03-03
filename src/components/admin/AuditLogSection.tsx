'use client'

import { useState, useEffect } from 'react'
import { Shield, RefreshCw } from 'lucide-react'

interface AuditLogEntry {
  id: string
  userId: string | null
  userEmail: string | null
  action: string
  resource: string
  resourceId: string | null
  detail: string | null
  createdAt: string
}

interface AuditLogSectionProps {
  t: (key: string) => string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  LOGIN_FAILED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SPLIT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export function AuditLogSection({ t }: AuditLogSectionProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/audit-log')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) {
      console.error('Failed to load audit log:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (expanded && logs.length === 0) fetchLogs()
  }, [expanded])

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('admin.auditLog')}</h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-4">
          <div className="flex justify-end mb-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('app.refresh')}
            </button>
          </div>

          {loading && logs.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t('app.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.auditTime')}</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.auditUser')}</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.auditAction')}</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.auditResource')}</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.auditDetail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-2 px-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTime(log.createdAt)}</td>
                      <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{log.userEmail || '-'}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{log.resource}</td>
                      <td className="py-2 px-2 text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.detail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
