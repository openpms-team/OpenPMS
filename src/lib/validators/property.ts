import { z } from 'zod/v4'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const propertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country_code: z.string().length(3).default('PRT'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  max_guests: z.number().int().min(1).max(100),
  num_bedrooms: z.number().int().min(0).max(50),
  num_bathrooms: z.number().int().min(0).max(50),
  al_license: z.string().max(50).optional(),
  check_in_time: z.string().regex(timeRegex),
  check_out_time: z.string().regex(timeRegex),
  ical_urls: z.array(z.object({ name: z.string(), url: z.url() })).optional(),
  sef_property_id: z.string().optional(),
  sef_establishment_id: z.string().optional(),
  guest_portal_config: z.record(z.string(), z.unknown()).optional(),
  wifi_name: z.string().max(100).optional(),
  wifi_password: z.string().max(100).optional(),
  door_code: z.string().max(50).optional(),
  house_rules: z.string().max(5000).optional(),
  description: z.string().max(5000).optional(),
  owner_id: z.string().uuid().optional(),
  tax_jurisdiction_id: z.string().uuid().optional(),
  active: z.boolean().default(true),
})

export type PropertyFormData = z.infer<typeof propertySchema>

export const propertyInsertSchema = propertySchema
export const propertyUpdateSchema = propertySchema.partial()
