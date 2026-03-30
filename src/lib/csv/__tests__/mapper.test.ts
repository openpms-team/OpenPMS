import { describe, it, expect } from 'vitest'
import { validateMapping, convertDate, mapRows } from '../mapper'
import type { ColumnMapping } from '../mapper'

describe('validateMapping', () => {
  it('validates complete mapping', () => {
    const mapping: ColumnMapping = { guestName: 0, checkIn: 1, checkOut: 2 }
    const result = validateMapping(mapping, 7)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects out of range index', () => {
    const mapping: ColumnMapping = { guestName: 0, checkIn: 1, checkOut: 10 }
    const result = validateMapping(mapping, 5)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('convertDate', () => {
  it('passes ISO dates through', () => {
    expect(convertDate('2025-06-01', 'iso')).toBe('2025-06-01')
  })

  it('converts EU dates (DD/MM/YYYY)', () => {
    expect(convertDate('01/06/2025', 'eu')).toBe('2025-06-01')
  })

  it('converts US dates (MM/DD/YYYY)', () => {
    // US format: MM/DD/YYYY → month=06, day=01
    expect(convertDate('06/01/2025', 'us')).toBe('2025-06-01')
  })
})

describe('mapRows', () => {
  const mapping: ColumnMapping = {
    guestName: 0,
    checkIn: 1,
    checkOut: 2,
    numGuests: 3,
    totalAmount: 4,
    guestEmail: 5,
    notes: 6,
  }

  const rows = [
    ['João Silva', '2025-06-01', '2025-06-05', '2', '450.00', 'joao@email.com', 'Early check-in'],
    ['María García', '2025-06-10', '2025-06-15', '3', '750.00', 'maria@email.com', ''],
  ]

  it('maps columns correctly', () => {
    const { mapped, errors } = mapRows(rows, mapping, 'iso')
    expect(mapped.length).toBe(2)
    expect(errors.length).toBe(0)
    expect(mapped[0].guest_name).toBe('João Silva')
    expect(mapped[0].check_in).toBe('2025-06-01')
    expect(mapped[0].num_guests).toBe(2)
    expect(mapped[0].total_amount).toBe(450)
    expect(mapped[0].guest_email).toBe('joao@email.com')
  })

  it('handles missing optional fields', () => {
    const { mapped } = mapRows(rows, mapping, 'iso')
    expect(mapped[1].notes).toBeUndefined()
  })

  it('skips rows with missing required fields', () => {
    const badRows = [['', '2025-06-01', '2025-06-05', '2', '', '', '']]
    const { mapped, errors } = mapRows(badRows, mapping, 'iso')
    expect(mapped.length).toBe(0)
    expect(errors.length).toBe(1)
  })

  it('converts EU date formats', () => {
    const euRows = [['Test', '01/06/2025', '05/06/2025', '', '', '', '']]
    const { mapped } = mapRows(euRows, mapping, 'eu')
    expect(mapped[0].check_in).toBe('2025-06-01')
    expect(mapped[0].check_out).toBe('2025-06-05')
  })
})
