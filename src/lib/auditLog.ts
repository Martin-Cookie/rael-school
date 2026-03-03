import { prisma } from './db'

interface AuditParams {
  userId?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  detail?: string
  ip?: string
}

/** Zapíše audit log záznam. Nikdy nevyhodí výjimku — chyba se pouze loguje. */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params })
  } catch (error) {
    console.error('[AUDIT] Failed to write audit log:', error)
  }
}
