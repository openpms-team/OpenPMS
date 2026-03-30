import { describe, it, expect } from 'vitest'
import { calculateTouristTax, type TaxRule, type TaxExemption } from '../calculator'

const lisboaRules: TaxRule[] = [
  {
    id: 'r1',
    rate_amount: 2,
    rate_type: 'per_night_per_guest',
    season_start: null,
    season_end: null,
    max_nights: 7,
    min_guest_age: 13,
    priority: 0,
  },
]

const seasonalRules: TaxRule[] = [
  {
    id: 'r-summer',
    rate_amount: 1.5,
    rate_type: 'per_night_per_guest',
    season_start: '2025-04-01',
    season_end: '2025-10-31',
    max_nights: 7,
    min_guest_age: 13,
    priority: 1,
  },
  {
    id: 'r-winter',
    rate_amount: 1,
    rate_type: 'per_night_per_guest',
    season_start: '2025-11-01',
    season_end: '2025-03-31',
    max_nights: 7,
    min_guest_age: 13,
    priority: 0,
  },
]

const exemptions: TaxExemption[] = [
  { type: 'medical', description: 'Medical/hospital stay', condition_json: {} },
]

const baseInput = {
  reservationId: 'res-1',
  propertyId: 'prop-1',
  jurisdictionId: 'jur-1',
}

describe('calculateTouristTax', () => {
  it('Lisboa: 2 adults × 3 nights × €2 = €12', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        checkIn: '2025-06-01',
        checkOut: '2025-06-04',
        guests: [
          { age: 30, nationality: 'ESP' },
          { age: 28, nationality: 'FRA' },
        ],
      },
      lisboaRules,
      [],
      'Lisboa'
    )
    expect(result.totalAmount).toBe(12)
    expect(result.guestsTaxable).toBe(2)
    expect(result.nightsTaxable).toBe(3)
  })

  it('Lisboa: 1 adult + 1 child (10y) × 3 nights = €6 (child exempt)', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        checkIn: '2025-06-01',
        checkOut: '2025-06-04',
        guests: [
          { age: 30, nationality: 'ESP' },
          { age: 10, nationality: 'ESP' },
        ],
      },
      lisboaRules,
      [],
      'Lisboa'
    )
    expect(result.totalAmount).toBe(6)
    expect(result.guestsTaxable).toBe(1)
    expect(result.exemptionsApplied).toHaveLength(1)
    expect(result.exemptionsApplied[0].exemptionType).toBe('age')
  })

  it('Lisboa: 1 adult × 8 nights = €14 (max 7 nights)', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        checkIn: '2025-06-01',
        checkOut: '2025-06-09',
        guests: [{ age: 30, nationality: 'ESP' }],
      },
      lisboaRules,
      [],
      'Lisboa'
    )
    expect(result.totalAmount).toBe(14) // 7 × €2
    expect(result.nightsTaxable).toBe(7)
    expect(result.nightsTotal).toBe(8)
  })

  it('seasonal: summer rate applied for June', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        checkIn: '2025-06-01',
        checkOut: '2025-06-04',
        guests: [{ age: 30, nationality: 'ESP' }],
      },
      seasonalRules,
      [],
      'Faro'
    )
    expect(result.ratePerNightPerGuest).toBe(1.5)
    expect(result.totalAmount).toBe(4.5)
  })

  it('no jurisdiction: returns zero', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        jurisdictionId: null,
        checkIn: '2025-06-01',
        checkOut: '2025-06-04',
        guests: [{ age: 30, nationality: 'ESP' }],
      },
      [],
      [],
      ''
    )
    expect(result.totalAmount).toBe(0)
  })

  it('medical exemption applied when flagged', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        checkIn: '2025-06-01',
        checkOut: '2025-06-04',
        guests: [{ age: 30, nationality: 'ESP', exemptions: ['medical'] }],
      },
      lisboaRules,
      exemptions,
      'Lisboa'
    )
    expect(result.totalAmount).toBe(0)
    expect(result.guestsTaxable).toBe(0)
    expect(result.exemptionsApplied).toHaveLength(1)
    expect(result.exemptionsApplied[0].exemptionType).toBe('medical')
  })

  it('generates per-night breakdown', () => {
    const result = calculateTouristTax(
      {
        ...baseInput,
        checkIn: '2025-06-01',
        checkOut: '2025-06-04',
        guests: [{ age: 30, nationality: 'ESP' }],
      },
      lisboaRules,
      [],
      'Lisboa'
    )
    expect(result.breakdown).toHaveLength(3)
    expect(result.breakdown[0].date).toBe('2025-06-01')
    expect(result.breakdown[0].rate).toBe(2)
    expect(result.breakdown[0].subtotal).toBe(2)
  })
})
