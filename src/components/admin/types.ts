import type { Locale } from '@/lib/i18n'

export type CodelistItem = {
  id: string
  name: string
  nameEn?: string | null
  nameSw?: string | null
  sortOrder: number
  isActive: boolean
  price?: number | null
}

export type VoucherRateItem = {
  id: string
  currency: string
  rate: number
  isActive: boolean
}

export type TuitionRateItem = {
  id: string
  name: string
  nameEn?: string | null
  nameSw?: string | null
  gradeFrom: number
  gradeTo: number
  annualFee: number
  currency: string
  isActive: boolean
}

export type TranslateFn = (key: string) => string

export type ShowMsgFn = (type: 'success' | 'error', text: string) => void

export type CodelistSectionProps = {
  title: string
  icon: any
  items: CodelistItem[]
  newName: string
  setNewName: (v: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
  placeholder: string
  t: TranslateFn
  locale: Locale
  showPrice?: boolean
  newPrice?: string
  setNewPrice?: (v: string) => void
  onPriceChange?: (id: string, price: number | null) => void
  newNameEn: string
  setNewNameEn: (v: string) => void
  newNameSw: string
  setNewNameSw: (v: string) => void
  translating: boolean
  onTranslate: () => void
  onUpdateTranslations: (id: string, nameEn: string | null, nameSw: string | null) => void
  onNameChange: (id: string, name: string) => void
}

export type VoucherRateSectionProps = {
  items: VoucherRateItem[]
  newCurrency: string
  setNewCurrency: (v: string) => void
  newRate: string
  setNewRate: (v: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, rate: number) => void
  t: TranslateFn
}

export type TuitionRateSectionProps = {
  items: TuitionRateItem[]
  onUpdate: (id: string, annualFee: number) => void
  onDelete: (id: string) => void
  t: TranslateFn
}

export type BackupSectionProps = {
  t: TranslateFn
  showMsg: ShowMsgFn
}
