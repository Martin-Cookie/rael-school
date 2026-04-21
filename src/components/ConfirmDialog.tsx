'use client'

import { useEffect } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export type ConfirmVariant = 'danger' | 'info'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  details?: string          // volitelně dodatečný kontextový text (menší)
  variant?: ConfirmVariant  // 'danger' pro nevratné akce, 'info' pro potvrzení
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  details,
  variant = 'info',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useFocusTrap(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const isDanger = variant === 'danger'
  const iconBg = isDanger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
  const iconColor = isDanger ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
  const Icon = isDanger ? AlertTriangle : HelpCircle
  const confirmBtn = isDanger
    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
    : 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500'

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        ref={ref}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{message}</p>
            {details && <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">{details}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm focus-visible:ring-2 focus-visible:outline-none ${confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
