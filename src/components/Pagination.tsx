'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  labels: {
    showing: string
    of: string
    prev: string
    next: string
  }
}

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange, labels }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  // Build page numbers to show
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 pt-2 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        {labels.showing} {from}–{to} {labels.of} {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 min-w-[44px] h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 focus-visible:outline-none"
          aria-label={labels.prev}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Strana ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              className={`min-w-[44px] h-11 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 focus-visible:outline-none ${
                p === currentPage
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 min-w-[44px] h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 focus-visible:outline-none"
          aria-label={labels.next}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
