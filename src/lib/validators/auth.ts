import { z } from 'zod/v4'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const setupStep1Schema = z.object({
  businessName: z.string().min(1).max(200),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  language: z.enum(['pt', 'en', 'fr']),
})

export type SetupStep1Data = z.infer<typeof setupStep1Schema>

export const setupStep2Schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords must match', path: ['confirmPassword'] }
)

export type SetupStep2Data = z.infer<typeof setupStep2Schema>

export const totpVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
})

export type TotpVerifyData = z.infer<typeof totpVerifySchema>

export const recoveryCodeSchema = z.object({
  code: z.string().min(8).max(20),
})

// Keep backward compat
export const setupSchema = setupStep1Schema
export type SetupFormData = SetupStep1Data
