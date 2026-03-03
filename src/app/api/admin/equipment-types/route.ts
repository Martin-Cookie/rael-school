import { prisma } from '@/lib/db'
import { createCodelistHandlers } from '@/lib/codelistRoute'

export const { GET, POST, PUT, DELETE } = createCodelistHandlers({
  delegate: prisma.equipmentType,
  pluralKey: 'equipmentTypes',
  singularKey: 'equipmentType',
  hasPrice: true,
  label: 'equipment type',
})
