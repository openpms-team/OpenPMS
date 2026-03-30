'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type SetupStep = 'idle' | 'qr' | 'verify' | 'recovery'

export default function SecuritySettingsPage() {
  const t = useTranslations('settings')
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>('idle')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_profiles')
        .select('totp_enabled')
        .single()
      setTotpEnabled(data?.totp_enabled ?? false)
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleEnable2FA = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/auth/setup-2fa', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? tErrors('generic'))
        return
      }
      setQrDataUrl(data.qrDataUrl)
      setSecret(data.secret)
      setRecoveryCodes(data.recoveryCodes)
      setSetupStep('qr')
    } catch {
      setError(tErrors('generic'))
    }
  }, [tErrors])

  const handleVerifyAndEnable = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/auth/confirm-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode, secret }),
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? tErrors('generic'))
        return
      }
      setTotpEnabled(true)
      setSetupStep('recovery')
    } catch {
      setError(tErrors('generic'))
    }
  }, [verifyCode, secret, tErrors])

  const handleDisable2FA = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/auth/disable-2fa', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? tErrors('generic'))
        return
      }
      setTotpEnabled(false)
      setSetupStep('idle')
    } catch {
      setError(tErrors('generic'))
    }
  }, [tErrors])

  if (loading) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('security')}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t('twoFactorAuth')}</CardTitle>
          <CardDescription>
            {totpEnabled ? tAuth('twoFactor') : tAuth('twoFactorSetup')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {setupStep === 'idle' && !totpEnabled && (
            <Button onClick={handleEnable2FA}>
              {t('enableTwoFactor')}
            </Button>
          )}

          {setupStep === 'idle' && totpEnabled && (
            <Button variant="destructive" onClick={handleDisable2FA}>
              {t('disableTwoFactor')}
            </Button>
          )}

          {setupStep === 'qr' && (
            <div className="space-y-4">
              {qrDataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="mx-auto h-48 w-48"
                />
              )}
              <p className="text-center text-xs text-muted-foreground break-all">
                {secret}
              </p>
              <div className="space-y-2">
                <Label>{tAuth('twoFactorCode')}</Label>
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg"
                />
              </div>
              <Button
                onClick={handleVerifyAndEnable}
                className="w-full"
                disabled={verifyCode.length !== 6}
              >
                {t('enableTwoFactor')}
              </Button>
            </div>
          )}

          {setupStep === 'recovery' && recoveryCodes.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Save these recovery codes in a safe place:
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
                {recoveryCodes.map((code) => (
                  <span key={code}>{code}</span>
                ))}
              </div>
              <Button onClick={() => setSetupStep('idle')} className="w-full">
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
