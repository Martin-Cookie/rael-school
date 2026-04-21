// Lehké typy pro API odpovědi — použité v useState na klientských stránkách.
// Striktní mapování na Prisma modely není cílem — jen pokrytí polí přistupovaných v UI.

export interface ClassRoom {
  id: string
  name: string
  nameEn?: string | null
  nameSw?: string | null
  sortOrder: number
  isActive?: boolean
}

export interface CodelistItem {
  id: string
  name: string
  nameEn?: string | null
  nameSw?: string | null
  price?: number | null
  sortOrder: number
  isActive?: boolean
}

export type PaymentType = CodelistItem
export type NeedType = CodelistItem
export type WishType = CodelistItem
export type EquipmentType = CodelistItem
export type HealthCheckType = CodelistItem

export interface VoucherRate {
  id: string
  currency: string
  rate: number
  isActive?: boolean
}

export interface SponsorListItem {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string | null
  isActive?: boolean
  role?: string
}

// Student v seznamech (/api/students, /api/dashboard, /api/reports/visit-cards).
// Některá pole jsou server-computed (age, needs_count, sponsor_names atd.) — necháme je
// volitelná, aby type guard nerozbíjel existující access vzory.
export interface StudentListItem {
  id: string
  studentNo: string
  firstName: string
  lastName: string
  className?: string | null
  gender?: string | null
  dateOfBirth?: string | Date | null
  school?: string | null
  orphanStatus?: string | null
  healthStatus?: string | null
  isActive?: boolean
  profilePhoto?: string | null

  // Relace (s `include` z API)
  needs?: Array<{ id: string; isFulfilled: boolean; description?: string }>
  sponsorships?: Array<{
    id: string
    isActive: boolean
    sponsor?: { id: string; firstName: string; lastName: string; email?: string } | null
  }>
  equipment?: Array<{ id: string; type: string; condition: string }>

  _count?: Record<string, number>

  // Server-computed (age z dateOfBirth, needCount z agregací, ...)
  age?: number
  ageDisplay?: string
  sponsorNames?: string[]
}
