'use client'

import { AlertTriangle } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Něco se pokazilo
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        {error.message || 'Došlo k neočekávané chybě. Zkuste to prosím znovu.'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors"
      >
        Zkusit znovu
      </button>
    </div>
  )
}
