import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

function flattenKeys(
  obj: Record<string, unknown>,
  prefix = ''
): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return flattenKeys(value as Record<string, unknown>, fullKey)
    }
    return [fullKey]
  })
}

const messagesDir = path.join(process.cwd(), 'src', 'messages')

function loadKeys(locale: string): Set<string> {
  const content = JSON.parse(
    fs.readFileSync(path.join(messagesDir, `${locale}.json`), 'utf-8')
  )
  return new Set(flattenKeys(content))
}

describe('check-translations', () => {
  const ptKeys = loadKeys('pt')
  const enKeys = loadKeys('en')
  const frKeys = loadKeys('fr')

  it('all PT keys exist in EN', () => {
    const missing: string[] = []
    for (const key of ptKeys) {
      if (!enKeys.has(key)) missing.push(key)
    }
    expect(missing).toEqual([])
  })

  it('all PT keys exist in FR', () => {
    const missing: string[] = []
    for (const key of ptKeys) {
      if (!frKeys.has(key)) missing.push(key)
    }
    expect(missing).toEqual([])
  })

  it('handles nested objects correctly', () => {
    expect(ptKeys.has('errors.validation.required')).toBe(true)
    expect(enKeys.has('errors.validation.required')).toBe(true)
    expect(frKeys.has('errors.validation.required')).toBe(true)
  })

  it('no extra keys in EN missing from PT', () => {
    const extra: string[] = []
    for (const key of enKeys) {
      if (!ptKeys.has(key)) extra.push(key)
    }
    expect(extra).toEqual([])
  })
})
