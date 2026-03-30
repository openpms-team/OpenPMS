import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { verifyTOTPCode } from '@/lib/auth/totp'
import { validateRecoveryCode } from '@/lib/auth/recovery'
import { decrypt } from '@/lib/auth/encryption'

// Rate limit: 5 attempts per minute per user
const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = attempts.get(userId)
  if (!entry || now > entry.resetAt) {
    attempts.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= 5
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 1 minute.' },
        { status: 429 }
      )
    }

    const { code, type, trustDevice } = await request.json()

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('totp_secret, recovery_codes, trusted_devices')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (type === 'totp') {
      if (!profile.totp_secret) {
        return NextResponse.json(
          { error: '2FA not configured' },
          { status: 400 }
        )
      }
      const decryptedSecret = decrypt(profile.totp_secret)
      const valid = verifyTOTPCode(decryptedSecret, code)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
      }
    } else if (type === 'recovery') {
      const hashedCodes = (profile.recovery_codes ?? []) as string[]
      const { valid, remainingCodes } = validateRecoveryCode(code, hashedCodes)
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid recovery code' },
          { status: 400 }
        )
      }
      await supabase
        .from('user_profiles')
        .update({ recovery_codes: remainingCodes })
        .eq('id', user.id)
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Handle trusted device
    if (trustDevice) {
      const deviceHash = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString()

      const trustedDevices = [
        ...((profile.trusted_devices ?? []) as Array<{
          hash: string
          expires_at: string
        }>),
        { hash: deviceHash, expires_at: expiresAt },
      ]

      await supabase
        .from('user_profiles')
        .update({ trusted_devices: trustedDevices })
        .eq('id', user.id)

      const cookieStore = await cookies()
      cookieStore.set('trusted_device', deviceHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
