import { describe, it, expect } from 'vitest'
import {
  generateTOTPSecret,
  generateQRCodeURL,
  verifyTOTPCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '../totp'
import * as OTPAuth from 'otpauth'

describe('TOTP', () => {
  it('generates a valid base32 secret', () => {
    const secret = generateTOTPSecret()
    expect(secret).toMatch(/^[A-Z2-7]+=*$/)
    expect(secret.length).toBeGreaterThanOrEqual(16)
  })

  it('generates a valid otpauth URL', () => {
    const secret = generateTOTPSecret()
    const url = generateQRCodeURL(secret, 'test@example.com')
    expect(url).toMatch(/^otpauth:\/\/totp\//)
    expect(url).toContain('secret=')
  })

  it('verifies a valid TOTP code', () => {
    const secret = generateTOTPSecret()
    const totp = new OTPAuth.TOTP({
      issuer: 'OpenPMS',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })
    const code = totp.generate()
    expect(verifyTOTPCode(secret, code)).toBe(true)
  })

  it('rejects an invalid TOTP code', () => {
    const secret = generateTOTPSecret()
    expect(verifyTOTPCode(secret, '000000')).toBe(false)
  })

  it('rejects a wrong code', () => {
    const secret = generateTOTPSecret()
    expect(verifyTOTPCode(secret, '123456')).toBe(false)
  })
})

describe('Recovery Codes', () => {
  it('generates 10 unique codes by default', () => {
    const codes = generateRecoveryCodes()
    expect(codes).toHaveLength(10)
    expect(new Set(codes).size).toBe(10)
  })

  it('generates codes in XXXXX-XXXXX format', () => {
    const codes = generateRecoveryCodes()
    for (const code of codes) {
      expect(code).toMatch(/^[A-F0-9]{5}-[A-F0-9]{5}$/)
    }
  })

  it('hashes and verifies a recovery code', () => {
    const codes = generateRecoveryCodes(3)
    const hashedCodes = codes.map(hashRecoveryCode)

    const { valid, remainingCodes } = verifyRecoveryCode(codes[1], hashedCodes)
    expect(valid).toBe(true)
    expect(remainingCodes).toHaveLength(2)
  })

  it('rejects invalid recovery code', () => {
    const codes = generateRecoveryCodes(3)
    const hashedCodes = codes.map(hashRecoveryCode)

    const { valid, remainingCodes } = verifyRecoveryCode(
      'INVALID-CODE1',
      hashedCodes
    )
    expect(valid).toBe(false)
    expect(remainingCodes).toHaveLength(3)
  })

  it('used recovery code is invalidated', () => {
    const codes = generateRecoveryCodes(2)
    const hashedCodes = codes.map(hashRecoveryCode)

    const { remainingCodes } = verifyRecoveryCode(codes[0], hashedCodes)
    const { valid } = verifyRecoveryCode(codes[0], remainingCodes)
    expect(valid).toBe(false)
  })
})
