import { z } from 'zod/v4'

const channels = ['email', 'sms', 'whatsapp', 'push'] as const
const triggerTypes = ['booking_confirmed', 'pre_checkin', 'checkin_day', 'during_stay', 'pre_checkout', 'post_checkout', 'review_request', 'manual'] as const

export const messageTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  channel: z.enum(channels).default('email'),
  subject: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.string()),
  trigger_type: z.enum(triggerTypes).default('manual'),
  conditions: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().default(true),
})

export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>

export const messageTemplateInsertSchema = messageTemplateSchema
export const messageTemplateUpdateSchema = messageTemplateSchema.partial()
