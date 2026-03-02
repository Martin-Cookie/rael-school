import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <FileQuestion className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Stránka nenalezena
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Hledaná stránka neexistuje nebo byla přesunuta.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors"
      >
        Zpět na přehled
      </Link>
    </div>
  )
}
