import { z } from 'zod/v4'

const reservationStatuses = ['confirmed', 'cancelled', 'checked_in', 'checked_out', 'no_show'] as const
const reservationSources = ['direct', 'airbnb', 'booking', 'expedia', 'vrbo', 'other'] as const

export const reservationSchema = z.object({
  property_id: z.string().uuid(),
  source: z.enum(reservationSources).default('direct'),
  external_id: z.string().max(200).optional(),
  guest_name: z.string().min(1).max(200),
  guest_email: z.email().optional(),
  guest_phone: z.string().max(30).optional(),
  num_guests: z.number().int().min(1).max(100),
  check_in: z.string().date(),
  check_out: z.string().date(),
  nightly_rate: z.number().min(0).optional(),
  total_amount: z.number().min(0).optional(),
  paid_amount: z.number().min(0).default(0),
  currency: z.string().length(3).default('EUR'),
  door_code: z.string().max(50).optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(reservationStatuses).default('confirmed'),
}).refine(
  (data) => data.check_out > data.check_in,
  { message: 'Check-out must be after check-in', path: ['check_out'] }
)

export type ReservationFormData = z.infer<typeof reservationSchema>

export const reservationInsertSchema = reservationSchema
export const reservationUpdateSchema = z.object({
  property_id: z.string().uuid().optional(),
  source: z.enum(reservationSources).optional(),
  external_id: z.string().max(200).optional(),
  guest_name: z.string().min(1).max(200).optional(),
  guest_email: z.email().optional(),
  guest_phone: z.string().max(30).optional(),
  num_guests: z.number().int().min(1).max(100).optional(),
  check_in: z.string().date().optional(),
  check_out: z.string().date().optional(),
  nightly_rate: z.number().min(0).optional(),
  total_amount: z.number().min(0).optional(),
  paid_amount: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  door_code: z.string().max(50).optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(reservationStatuses).optional(),
})
