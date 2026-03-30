import { describe, it, expect } from 'vitest'
import { propertySchema } from '../property'

describe('propertySchema', () => {
  const validProperty = {
    name: 'Beach House',
    max_guests: 6,
    num_bedrooms: 3,
    num_bathrooms: 2,
    check_in_time: '15:00',
    check_out_time: '11:00',
  }

  it('accepts a valid property', () => {
    const result = propertySchema.safeParse(validProperty)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = propertySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects invalid check_in_time format', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      check_in_time: '25:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects max_guests < 1', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      max_guests: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects name that is too long', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      name: 'x'.repeat(201),
    })
    expect(result.success).toBe(false)
  })
})
