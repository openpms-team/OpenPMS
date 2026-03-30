import { z } from 'zod/v4'

const icaoCodeRegex = /^[A-Z]{3}$/

export const guestSchema = z.object({
  reservation_id: z.string().uuid(),
  is_primary: z.boolean().default(false),
  full_name: z.string().min(1).max(200),
  date_of_birth: z.string().date().optional().refine(
    (val) => {
      if (!val) return true
      return new Date(val) < new Date()
    },
    { message: 'Date of birth must be in the past' }
  ),
  nationality_icao: z.string().regex(icaoCodeRegex, 'Must be a 3-letter ICAO code').optional(),
  document_type: z.string().max(50).optional(),
  document_number: z.string().max(50).optional(),
  document_country: z.string().regex(icaoCodeRegex).optional(),
  document_expiry: z.string().date().optional(),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  signature: z.string().optional(),
})

export type GuestFormData = z.infer<typeof guestSchema>

export const guestInsertSchema = guestSchema
export const guestUpdateSchema = guestSchema.partial().extend({
  reservation_id: z.string().uuid().optional(),
})
