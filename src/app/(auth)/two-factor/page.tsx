'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function TwoFactorPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCodeChange = useCallback(
    (value: string) => {
      const cleaned = value.replace(/\D/g, '').slice(0, 6)
      setCode(cleaned)
      if (cleaned.length === 6) {
        void handleVerify(cleaned)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trustDevice]
  )

  async function handleVerify(totpCode?: string) {
    setError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: useRecovery ? recoveryCode : (totpCode ?? code),
          type: useRecovery ? 'recovery' : 'totp',
          trustDevice,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? tErrors('generic'))
        setCode('')
        inputRef.current?.focus()
        return
      }

      router.push('/')
    } catch {
      setError(tErrors('generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('twoFactor')}</CardTitle>
        <CardDescription>
          {useRecovery ? t('recoveryCode') : t('twoFactorCode')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {useRecovery ? (
          <div className="space-y-2">
            <Label htmlFor="recovery">{t('recoveryCode')}</Label>
            <Input
              id="recovery"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="XXXXX-XXXXX"
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="totp">{t('twoFactorCode')}</Label>
            <Input
              ref={inputRef}
              id="totp"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              className="text-center text-2xl tracking-widest"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="trust"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(checked === true)}
          />
          <Label htmlFor="trust" className="text-sm font-normal">
            {t('trustDevice')}
          </Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {useRecovery && (
          <Button
            onClick={() => handleVerify()}
            className="w-full"
            disabled={loading || !recoveryCode}
          >
            {loading ? '...' : t('login')}
          </Button>
        )}

        <button
          type="button"
          onClick={() => {
            setUseRecovery(!useRecovery)
            setError(null)
          }}
          className="text-sm text-muted-foreground hover:underline"
        >
          {useRecovery ? t('twoFactorCode') : t('recoveryCode')}
        </button>
      </CardContent>
    </Card>
  )
}
