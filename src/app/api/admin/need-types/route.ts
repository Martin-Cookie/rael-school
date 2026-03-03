import { prisma } from '@/lib/db'
import { createCodelistHandlers } from '@/lib/codelistRoute'

export const { GET, POST, PUT, DELETE } = createCodelistHandlers({
  delegate: prisma.needType,
  pluralKey: 'needTypes',
  singularKey: 'needType',
  hasPrice: true,
  label: 'need type',
})
