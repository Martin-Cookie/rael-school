'use client'

import type { ToastMessage } from '@/hooks/useToast'

export function Toast({ message }: { message: ToastMessage }) {
  if (!message) return null
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium ${message.type === 'success' ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
      {message.text}
    </div>
  )
}
