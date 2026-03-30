import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseICalString } from '../parser'

const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'ical-samples')

describe('iCal parser', () => {
  it('parses valid iCal with multiple events', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'airbnb.ics'), 'utf-8')
    const events = parseICalString(content)
    expect(events.length).toBe(3)
  })

  it('extracts correct fields from events', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'airbnb.ics'), 'utf-8')
    const events = parseICalString(content)
    const first = events.find((e) => e.uid === 'airbnb-abc123@airbnb.com')
    expect(first).toBeDefined()
    expect(first!.summary).toContain('João Silva')
    expect(first!.startDate).toBe('2025-06-01')
    expect(first!.endDate).toBe('2025-06-05')
  })

  it('handles special characters in SUMMARY', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'airbnb.ics'), 'utf-8')
    const events = parseICalString(content)
    const muller = events.find((e) => e.uid === 'airbnb-ghi789@airbnb.com')
    expect(muller).toBeDefined()
    expect(muller!.summary).toContain('Müller')
  })

  it('parses Booking.com format', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'booking.ics'), 'utf-8')
    const events = parseICalString(content)
    expect(events.length).toBe(2)
    expect(events[0].startDate).toBe('2025-07-01')
  })

  it('handles missing optional fields', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'airbnb.ics'), 'utf-8')
    const events = parseICalString(content)
    const last = events.find((e) => e.uid === 'airbnb-ghi789@airbnb.com')
    // Empty description in iCal may parse as empty string or null
    expect(last!.description === null || last!.description === '').toBe(true)
  })

  it('rejects invalid iCal format gracefully', () => {
    const events = parseICalString('not valid ical data')
    expect(events).toEqual([])
  })
})
