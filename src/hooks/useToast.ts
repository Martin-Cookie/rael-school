'use client'

import { useState, useCallback } from 'react'

export type ToastMessage = { type: 'success' | 'error'; text: string } | null

export function useToast() {
  const [message, setMessage] = useState<ToastMessage>(null)

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  return { message, showMsg }
}
