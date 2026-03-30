import { z } from 'zod/v4'

const roles = ['admin', 'manager', 'receptionist', 'cleaner', 'owner'] as const

export const staffSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  role: z.enum(roles).default('receptionist'),
  permissions: z.record(z.string(), z.unknown()).optional(),
  phone: z.string().max(30).optional(),
  active: z.boolean().default(true),
})

export type StaffFormData = z.infer<typeof staffSchema>

export const staffInsertSchema = staffSchema
export const staffUpdateSchema = staffSchema.partial()
