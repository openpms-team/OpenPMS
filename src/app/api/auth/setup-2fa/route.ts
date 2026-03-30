import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTOTPSecret, generateQRCodeDataURL } from '@/lib/auth/totp'
import { createRecoveryCodes } from '@/lib/auth/recovery'
import { encrypt } from '@/lib/auth/encryption'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = generateTOTPSecret()
    const qrDataUrl = await generateQRCodeDataURL(secret, user.email ?? '')
    const { plainCodes, hashedCodes } = createRecoveryCodes()

    // Encrypt the TOTP secret before storing
    const encryptedSecret = encrypt(secret)

    await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        totp_secret: encryptedSecret,
        recovery_codes: hashedCodes,
      })

    return NextResponse.json({
      qrDataUrl,
      secret,
      recoveryCodes: plainCodes,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
