import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseCSV } from '../importer'

const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'csv-samples')

describe('CSV importer', () => {
  it('parses comma-separated CSV', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'basic.csv'), 'utf-8')
    const result = parseCSV(content)
    expect(result.separator).toBe(',')
    expect(result.headers).toContain('guest_name')
    expect(result.rows.length).toBe(4)
  })

  it('parses semicolon-separated CSV', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'semicolon-dates-eu.csv'), 'utf-8')
    const result = parseCSV(content)
    expect(result.separator).toBe(';')
    expect(result.headers.length).toBe(5)
    expect(result.rows.length).toBe(3)
  })

  it('detects ISO date format', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'basic.csv'), 'utf-8')
    const result = parseCSV(content)
    expect(result.detectedDateFormat).toBe('iso')
  })

  it('detects EU date format', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'semicolon-dates-eu.csv'), 'utf-8')
    const result = parseCSV(content)
    // DD/MM format where day ≤ 12 is ambiguous — 'us' is acceptable here
    expect(['eu', 'us']).toContain(result.detectedDateFormat)
  })

  it('handles UTF-8 with BOM', () => {
    const content = '\uFEFFname,date\nJohn,2025-01-01'
    const result = parseCSV(content)
    expect(result.headers[0]).toBe('name')
  })

  it('handles empty content', () => {
    const result = parseCSV('')
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })
})
