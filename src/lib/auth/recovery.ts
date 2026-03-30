import { generateRecoveryCodes, hashRecoveryCode, verifyRecoveryCode } from './totp'

export function createRecoveryCodes(count: number = 10): {
  plainCodes: string[]
  hashedCodes: string[]
} {
  const plainCodes = generateRecoveryCodes(count)
  const hashedCodes = plainCodes.map(hashRecoveryCode)
  return { plainCodes, hashedCodes }
}

export function validateRecoveryCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  return verifyRecoveryCode(code, hashedCodes)
}
