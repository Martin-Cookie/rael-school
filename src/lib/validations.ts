import { z } from 'zod'

/** Schema pro vytvoření / aktualizaci studenta */
export const studentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'Name too long (max 100)'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Name too long (max 100)'),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  className: z.string().max(50).nullable().optional(),
  healthStatus: z.string().max(500, 'Text too long (max 500)').nullable().optional(),
  motherName: z.string().max(100).nullable().optional(),
  motherAlive: z.boolean().nullable().optional(),
  fatherName: z.string().max(100).nullable().optional(),
  fatherAlive: z.boolean().nullable().optional(),
  siblings: z.string().max(500).nullable().optional(),
  notes: z.string().max(500, 'Text too long (max 500)').nullable().optional(),
})

export type StudentInput = z.infer<typeof studentSchema>

/** Formátuje Zod chyby do čitelné zprávy */
export function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(e => e.message).join(', ')
}
