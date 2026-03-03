import { prisma } from '@/lib/db'
import { createCodelistHandlers } from '@/lib/codelistRoute'

export const { GET, POST, PUT, DELETE } = createCodelistHandlers({
  delegate: prisma.wishType,
  pluralKey: 'wishTypes',
  singularKey: 'wishType',
  hasPrice: true,
  label: 'wish type',
})
