import { prisma } from '@/lib/db'
import { createCodelistHandlers } from '@/lib/codelistRoute'

export const { GET, POST, PUT, DELETE } = createCodelistHandlers({
  delegate: prisma.paymentType,
  pluralKey: 'paymentTypes',
  singularKey: 'paymentType',
  label: 'payment type',
})
