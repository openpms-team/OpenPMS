import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTOTPCode } from '@/lib/auth/totp'
import { validateOrigin } from '@/lib/auth/csrf'

export async function POST(request: NextRequest) {
  const csrfError = validateOrigin(request)
  if (csrfError) return csrfError
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, secret } = await request.json()

    if (!code || !secret) {
      return NextResponse.json(
        { error: 'Code and secret required' },
        { status: 400 }
      )
    }

    const valid = verifyTOTPCode(secret, code)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    await supabase
      .from('user_profiles')
      .update({ totp_enabled: true })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
