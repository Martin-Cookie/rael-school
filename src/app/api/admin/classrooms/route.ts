import { prisma } from '@/lib/db'
import { createCodelistHandlers } from '@/lib/codelistRoute'

export const { GET, POST, PUT, DELETE } = createCodelistHandlers({
  delegate: prisma.classRoom,
  pluralKey: 'classrooms',
  singularKey: 'classroom',
  label: 'classroom',
})
