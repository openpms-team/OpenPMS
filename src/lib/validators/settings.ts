import { z } from 'zod/v4'

export const businessSettingsSchema = z.object({
  businessName: z.string().min(1).max(200),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  locale: z.enum(['pt', 'en', 'fr']),
})

export type BusinessSettings = z.infer<typeof businessSettingsSchema>
