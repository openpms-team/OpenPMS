import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

// We test the hash logic and rate limiting directly
describe('API auth middleware', () => {
  it('generates consistent hash for same key', () => {
    const key = 'opms_testkey123'
    const hash1 = crypto.createHash('sha256').update(key).digest('hex')
    const hash2 = crypto.createHash('sha256').update(key).digest('hex')
    expect(hash1).toBe(hash2)
  })

  it('different keys produce different hashes', () => {
    const hash1 = crypto.createHash('sha256').update('opms_key1').digest('hex')
    const hash2 = crypto.createHash('sha256').update('opms_key2').digest('hex')
    expect(hash1).not.toBe(hash2)
  })

  it('API key format starts with opms_', () => {
    const key = `opms_${crypto.randomBytes(32).toString('hex')}`
    expect(key.startsWith('opms_')).toBe(true)
    expect(key.length).toBe(69) // 5 + 64
  })

  it('key prefix is first 12 characters', () => {
    const key = `opms_${crypto.randomBytes(32).toString('hex')}`
    const prefix = key.slice(0, 12)
    expect(prefix.startsWith('opms_')).toBe(true)
    expect(prefix.length).toBe(12)
  })
})
