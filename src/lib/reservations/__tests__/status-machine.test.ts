import { describe, it, expect } from 'vitest'
import { getAllowedTransitions, isValidTransition } from '../status-machine'

describe('status-machine', () => {
  it('confirmed → checked_in is allowed', () => {
    expect(isValidTransition('confirmed', 'checked_in')).toBe(true)
  })

  it('confirmed → cancelled is allowed', () => {
    expect(isValidTransition('confirmed', 'cancelled')).toBe(true)
  })

  it('confirmed → no_show is allowed', () => {
    expect(isValidTransition('confirmed', 'no_show')).toBe(true)
  })

  it('confirmed → checked_out is NOT allowed', () => {
    expect(isValidTransition('confirmed', 'checked_out')).toBe(false)
  })

  it('checked_in → checked_out is allowed', () => {
    expect(isValidTransition('checked_in', 'checked_out')).toBe(true)
  })

  it('checked_out → confirmed is NOT allowed', () => {
    expect(isValidTransition('checked_out', 'confirmed')).toBe(false)
  })

  it('cancelled → any is NOT allowed', () => {
    expect(getAllowedTransitions('cancelled')).toEqual([])
  })

  it('no_show → any is NOT allowed', () => {
    expect(getAllowedTransitions('no_show')).toEqual([])
  })

  it('returns correct allowed transitions for confirmed', () => {
    expect(getAllowedTransitions('confirmed')).toEqual([
      'checked_in',
      'cancelled',
      'no_show',
    ])
  })

  it('returns correct allowed transitions for checked_in', () => {
    expect(getAllowedTransitions('checked_in')).toEqual(['checked_out'])
  })
})
