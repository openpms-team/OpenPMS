import { describe, it, expect } from 'vitest'
import { evaluateAutomationRule, type AutomationRule } from '../automation'
import type { Reservation } from '@/types/database'

const mockReservation: Reservation = {
  id: '1',
  property_id: 'prop-1',
  source: 'airbnb',
  external_id: null,
  guest_name: 'John Doe',
  guest_email: 'john@example.com',
  guest_phone: null,
  num_guests: 3,
  check_in: '2025-06-01',
  check_out: '2025-06-06',
  num_nights: 5,
  nightly_rate: null,
  total_amount: 750,
  paid_amount: 0,
  currency: 'EUR',
  door_code: null,
  extras: {},
  notes: null,
  status: 'confirmed',
  cancelled_at: null,
  created_at: '2025-01-01',
  updated_at: null,
}

describe('evaluateAutomationRule', () => {
  it('num_nights > 3 passes for 5-night stay', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [{ field: 'num_nights', operator: 'gt', value: 3 }],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })

  it('num_nights > 7 fails for 5-night stay', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [{ field: 'num_nights', operator: 'gt', value: 7 }],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(false)
  })

  it('source eq airbnb passes', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [{ field: 'source', operator: 'eq', value: 'airbnb' }],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })

  it('source neq direct passes for airbnb reservation', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [{ field: 'source', operator: 'neq', value: 'direct' }],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })

  it('multiple conditions with all require all true', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [
        { field: 'num_nights', operator: 'gt', value: 3 },
        { field: 'total_amount', operator: 'gte', value: 500 },
      ],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })

  it('multiple conditions with all fails if one false', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [
        { field: 'num_nights', operator: 'gt', value: 3 },
        { field: 'total_amount', operator: 'lt', value: 500 },
      ],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(false)
  })

  it('multiple conditions with any passes if one true', () => {
    const rule: AutomationRule = {
      match: 'any',
      conditions: [
        { field: 'num_nights', operator: 'gt', value: 10 },
        { field: 'source', operator: 'eq', value: 'airbnb' },
      ],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })

  it('source in array passes', () => {
    const rule: AutomationRule = {
      match: 'all',
      conditions: [
        { field: 'source', operator: 'in', value: ['airbnb', 'booking'] },
      ],
    }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })

  it('empty conditions passes', () => {
    const rule: AutomationRule = { match: 'all', conditions: [] }
    expect(evaluateAutomationRule(rule, mockReservation)).toBe(true)
  })
})
