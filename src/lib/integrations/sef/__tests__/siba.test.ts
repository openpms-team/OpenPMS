import { describe, it, expect } from 'vitest'
import { generateSIBAXml, generateDATFile } from '../siba'
import { calculateSIBADeadline } from '../deadline'
import type { SIBABulletin, SIBACredentials } from '../types'

const testBulletin: SIBABulletin = {
  lastName: 'García',
  firstName: 'María',
  nationality: 'ESP',
  dateOfBirth: '1990-05-15',
  documentType: 'passport',
  documentNumber: 'AB123456',
  issuingCountry: 'ESP',
  checkIn: '2025-06-01',
  checkOut: '2025-06-05',
}

const testCredentials: SIBACredentials = {
  nif: '123456789',
  establishmentId: '0001',
  accessKey: 'test-key',
}

describe('SIBA XML generation', () => {
  it('generates valid XML with BAL structure', () => {
    const xml = generateSIBAXml([testBulletin])
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<Boletins_Alojamento')
    expect(xml).toContain('<Boletim_Alojamento>')
    expect(xml).toContain('</Boletins_Alojamento>')
  })

  it('contains correct ICAO nationality code', () => {
    const xml = generateSIBAXml([testBulletin])
    expect(xml).toContain('<Nacionalidade>ESP</Nacionalidade>')
  })

  it('handles special characters in names (àáâãç)', () => {
    const bulletin = { ...testBulletin, lastName: 'José', firstName: 'André' }
    const xml = generateSIBAXml([bulletin])
    expect(xml).toContain('José')
    expect(xml).toContain('André')
  })

  it('formats dates as DD-MM-YYYY for SIBA', () => {
    const xml = generateSIBAXml([testBulletin])
    expect(xml).toContain('<DataEntrada>01-06-2025</DataEntrada>')
    expect(xml).toContain('<DataSaida>05-06-2025</DataSaida>')
  })

  it('handles multiple bulletins', () => {
    const xml = generateSIBAXml([testBulletin, testBulletin])
    const matches = xml.match(/<Boletim_Alojamento>/g)
    expect(matches?.length).toBe(2)
  })
})

describe('SIBA DAT generation', () => {
  it('generates DAT file with header, data, and footer lines', () => {
    const dat = generateDATFile(testCredentials, [testBulletin])
    const lines = dat.split('\r\n')
    expect(lines[0]).toMatch(/^0/) // header
    expect(lines[1]).toMatch(/^1/) // data
    expect(lines[2]).toMatch(/^9/) // footer
  })

  it('contains correct NIF in header', () => {
    const dat = generateDATFile(testCredentials, [testBulletin])
    expect(dat).toContain('123456789')
  })
})

describe('calculateSIBADeadline', () => {
  it('adds 3 business days (Monday → Thursday)', () => {
    // 2025-06-02 is a Monday
    const deadline = calculateSIBADeadline('2025-06-02')
    expect(deadline).toBe('2025-06-05') // Thursday
  })

  it('skips weekends (Friday → Thursday)', () => {
    // 2025-06-06 is a Friday → Sat skip, Sun skip, Mon=1, Tue=2, Wed=3 → but actually:
    // Next day Sat skip, Sun skip, Mon=1, Tue=2, Wed=3? Let's check: result is 2025-06-12
    // Sat(7)skip, Sun(8)skip, Mon(9)=1, Tue(10)=holiday skip, Wed(11)=2, Thu(12)=3
    const deadline = calculateSIBADeadline('2025-06-06')
    expect(deadline).toBe('2025-06-12')
  })

  it('skips Portuguese public holidays', () => {
    // 2025-06-09 is Monday, June 10 is Dia de Portugal (holiday)
    const deadline = calculateSIBADeadline('2025-06-09')
    // Tue(10)=holiday skip, Wed(11)=1, Thu(12)=2, Fri(13)=3
    expect(deadline).toBe('2025-06-13')
  })
})
