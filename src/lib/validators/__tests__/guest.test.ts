import { describe, it, expect } from 'vitest'
import { guestSchema } from '../guest'

describe('guestSchema', () => {
  const validGuest = {
    reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    full_name: 'Maria Silva',
    nationality_icao: 'PRT',
    date_of_birth: '1990-05-15',
  }

  it('accepts a valid guest', () => {
    const result = guestSchema.safeParse(validGuest)
    expect(result.success).toBe(true)
  })

  it('rejects invalid ICAO code', () => {
    const result = guestSchema.safeParse({
      ...validGuest,
      nationality_icao: 'XX',
    })
    expect(result.success).toBe(false)
  })

  it('rejects future date_of_birth', () => {
    const result = guestSchema.safeParse({
      ...validGuest,
      date_of_birth: '2099-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('accepts guest with document info', () => {
    const result = guestSchema.safeParse({
      ...validGuest,
      document_type: 'passport',
      document_number: 'AB123456',
      document_country: 'PRT',
      document_expiry: '2030-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('rejects lowercase ICAO code', () => {
    const result = guestSchema.safeParse({
      ...validGuest,
      nationality_icao: 'prt',
    })
    expect(result.success).toBe(false)
  })
})
