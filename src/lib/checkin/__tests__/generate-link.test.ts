import { describe, it, expect } from 'vitest'
import { generateToken } from '../generate-link'

describe('generateToken', () => {
  it('generates a 32-char URL-safe token', () => {
    const token = generateToken()
    expect(token.length).toBe(32)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(tokens.size).toBe(100)
  })
})
