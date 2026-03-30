import { describe, it, expect } from 'vitest'
import { reservationSchema } from '../reservation'

describe('reservationSchema', () => {
  const validReservation = {
    property_id: '550e8400-e29b-41d4-a716-446655440000',
    guest_name: 'John Doe',
    num_guests: 2,
    check_in: '2025-06-01',
    check_out: '2025-06-05',
  }

  it('accepts a valid reservation', () => {
    const result = reservationSchema.safeParse(validReservation)
    expect(result.success).toBe(true)
  })

  it('rejects check_out before check_in', () => {
    const result = reservationSchema.safeParse({
      ...validReservation,
      check_in: '2025-06-05',
      check_out: '2025-06-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status enum', () => {
    const result = reservationSchema.safeParse({
      ...validReservation,
      status: 'invalid_status',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing guest_name', () => {
    const { guest_name: _, ...withoutName } = validReservation
    void _
    const result = reservationSchema.safeParse(withoutName)
    expect(result.success).toBe(false)
  })
})
