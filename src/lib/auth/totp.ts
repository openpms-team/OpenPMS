import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import crypto from 'crypto'

const ISSUER = 'OpenPMS'
const TOTP_PERIOD = 30
const TOTP_DIGITS = 6

export function generateTOTPSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 })
  return secret.base32
}

export function generateQRCodeURL(
  secret: string,
  email: string,
  issuer: string = ISSUER
): string {
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  return totp.toString()
}

export async function generateQRCodeDataURL(
  secret: string,
  email: string
): Promise<string> {
  const url = generateQRCodeURL(secret, email)
  return QRCode.toDataURL(url)
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  // window: 1 means ±1 step (±30 seconds)
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(5)
    const code = bytes.toString('hex').toUpperCase()
    // Format as XXXXX-XXXXX
    codes.push(`${code.slice(0, 5)}-${code.slice(5, 10)}`)
  }
  return codes
}

export function hashRecoveryCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.toUpperCase().replace(/-/g, ''))
    .digest('hex')
}

export function verifyRecoveryCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const hash = hashRecoveryCode(code)
  const index = hashedCodes.indexOf(hash)
  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes }
  }
  const remainingCodes = [...hashedCodes]
  remainingCodes.splice(index, 1)
  return { valid: true, remainingCodes }
}
