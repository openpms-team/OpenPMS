import { describe, it, expect } from 'vitest'
import { hasDateOverlap } from '../overlap'

describe('overlap detection', () => {
  it('no overlap: A (1-5), B (6-10)', () => {
    expect(hasDateOverlap('2025-06-01', '2025-06-05', '2025-06-06', '2025-06-10')).toBe(false)
  })

  it('same-day turnover: A checkout = B checkin (day 5) → OK', () => {
    expect(hasDateOverlap('2025-06-01', '2025-06-05', '2025-06-05', '2025-06-10')).toBe(false)
  })

  it('overlap: A (1-5), B (3-7)', () => {
    expect(hasDateOverlap('2025-06-01', '2025-06-05', '2025-06-03', '2025-06-07')).toBe(true)
  })

  it('contained: A (1-10), B (3-7)', () => {
    expect(hasDateOverlap('2025-06-01', '2025-06-10', '2025-06-03', '2025-06-07')).toBe(true)
  })

  it('exact same dates → conflict', () => {
    expect(hasDateOverlap('2025-06-01', '2025-06-05', '2025-06-01', '2025-06-05')).toBe(true)
  })

  it('B ends before A starts → no overlap', () => {
    expect(hasDateOverlap('2025-06-05', '2025-06-10', '2025-06-01', '2025-06-04')).toBe(false)
  })

  it('1-day overlap at start', () => {
    expect(hasDateOverlap('2025-06-01', '2025-06-05', '2025-06-04', '2025-06-08')).toBe(true)
  })
})
