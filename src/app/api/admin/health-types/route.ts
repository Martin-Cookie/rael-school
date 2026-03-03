import { prisma } from '@/lib/db'
import { createCodelistHandlers } from '@/lib/codelistRoute'

export const { GET, POST, PUT, DELETE } = createCodelistHandlers({
  delegate: prisma.healthCheckType,
  pluralKey: 'healthTypes',
  singularKey: 'healthType',
  label: 'health check type',
})
