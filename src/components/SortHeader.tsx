'use client'

import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'

interface SortHeaderProps {
  col: string
  sortCol: string
  sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
  children: React.ReactNode
  className?: string
}

export function SortHeader({ col, sortCol, sortDir, onSort, children, className = '' }: SortHeaderProps) {
  const isActive = sortCol === col
  return (
    <th
      className={`py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none ${className}`}
      onClick={() => onSort(col)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive
          ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ArrowUpDown className="w-3 h-3 opacity-30" />
        }
      </div>
    </th>
  )
}
