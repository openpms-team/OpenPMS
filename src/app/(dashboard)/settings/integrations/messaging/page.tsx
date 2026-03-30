'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface SmtpConfig {
  host: string
  port: string
  secure: boolean
  username: string
  password: string
  fromName: string
  fromEmail: string
}

interface TwilioConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
}

type IntegrationType = 'smtp' | 'twilio' | 'whatsapp'

const defaultSmtp: SmtpConfig = {
  host: '', port: '587', secure: true, username: '',
  password: '', fromName: '', fromEmail: '',
}
const defaultTwilio: TwilioConfig = { accountSid: '', authToken: '', fromNumber: '' }
const defaultWhatsApp: WhatsAppConfig = { accessToken: '', phoneNumberId: '' }

export default function MessagingSettingsPage() {
  const t = useTranslations('settings.messaging')

  const [smtp, setSmtp] = useState<SmtpConfig>(defaultSmtp)
  const [smtpEnabled, setSmtpEnabled] = useState(false)
  const [twilio, setTwilio] = useState<TwilioConfig>(defaultTwilio)
  const [twilioEnabled, setTwilioEnabled] = useState(false)
  const [whatsapp, setWhatsapp] = useState<WhatsAppConfig>(defaultWhatsApp)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)

  const [saving, setSaving] = useState<IntegrationType | null>(null)
  const [testing, setTesting] = useState<IntegrationType | null>(null)
  const [message, setMessage] = useState('')

  async function handleSave(type: IntegrationType) {
    setSaving(type)
    setMessage('')
    try {
      const supabase = createClient()
      const configMap = { smtp, twilio, whatsapp }
      const enabledMap = { smtp: smtpEnabled, twilio: twilioEnabled, whatsapp: whatsappEnabled }
      const { error } = await supabase.from('integration_config').upsert(
        {
          type,
          config: JSON.stringify(configMap[type]),
          enabled: enabledMap[type],
        },
        { onConflict: 'type' }
      )
      setMessage(error ? t('saveError') : t('saveSuccess'))
    } catch {
      setMessage(t('saveError'))
    } finally {
      setSaving(null)
    }
  }

  async function handleTest(type: IntegrationType) {
    setTesting(type)
    setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.functions.invoke('test-messaging', {
        body: { type },
      })
      setMessage(error ? t('testFailed') : t('testSuccess'))
    } catch {
      setMessage(t('testFailed'))
    } finally {
      setTesting(null)
    }
  }

  function updateSmtp(field: keyof SmtpConfig, value: string | boolean) {
    setSmtp((prev) => ({ ...prev, [field]: value }))
  }

  function updateTwilio(field: keyof TwilioConfig, value: string) {
    setTwilio((prev) => ({ ...prev, [field]: value }))
  }

  function updateWhatsApp(field: keyof WhatsAppConfig, value: string) {
    setWhatsapp((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      {/* Email (SMTP) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('email')}</CardTitle>
          <CardDescription>{t('emailDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">{t('host')}</Label>
              <Input
                id="smtp-host"
                value={smtp.host}
                onChange={(e) => updateSmtp('host', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">{t('port')}</Label>
              <Input
                id="smtp-port"
                value={smtp.port}
                onChange={(e) => updateSmtp('port', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="smtp-secure"
              checked={smtp.secure}
              onCheckedChange={(checked) => updateSmtp('secure', checked === true)}
            />
            <Label htmlFor="smtp-secure">{t('secure')}</Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-username">{t('username')}</Label>
              <Input
                id="smtp-username"
                value={smtp.username}
                onChange={(e) => updateSmtp('username', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">{t('password')}</Label>
              <Input
                id="smtp-password"
                type="password"
                value={smtp.password}
                onChange={(e) => updateSmtp('password', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-from-name">{t('fromName')}</Label>
              <Input
                id="smtp-from-name"
                value={smtp.fromName}
                onChange={(e) => updateSmtp('fromName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-from-email">{t('fromEmail')}</Label>
              <Input
                id="smtp-from-email"
                type="email"
                value={smtp.fromEmail}
                onChange={(e) => updateSmtp('fromEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="smtp-enabled"
              checked={smtpEnabled}
              onCheckedChange={(checked) => setSmtpEnabled(checked === true)}
            />
            <Label htmlFor="smtp-enabled">{t('enabled')}</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleTest('smtp')}
              disabled={testing === 'smtp'}
            >
              {testing === 'smtp' ? t('testing') : t('testConnection')}
            </Button>
            <Button
              onClick={() => handleSave('smtp')}
              disabled={saving === 'smtp'}
            >
              {saving === 'smtp' ? t('saving') : t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS (Twilio) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sms')}</CardTitle>
          <CardDescription>{t('smsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twilio-sid">{t('accountSid')}</Label>
            <Input
              id="twilio-sid"
              value={twilio.accountSid}
              onChange={(e) => updateTwilio('accountSid', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-token">{t('authToken')}</Label>
            <Input
              id="twilio-token"
              type="password"
              value={twilio.authToken}
              onChange={(e) => updateTwilio('authToken', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-number">{t('fromNumber')}</Label>
            <Input
              id="twilio-number"
              value={twilio.fromNumber}
              onChange={(e) => updateTwilio('fromNumber', e.target.value)}
              placeholder="+351..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="twilio-enabled"
              checked={twilioEnabled}
              onCheckedChange={(checked) => setTwilioEnabled(checked === true)}
            />
            <Label htmlFor="twilio-enabled">{t('enabled')}</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleTest('twilio')}
              disabled={testing === 'twilio'}
            >
              {testing === 'twilio' ? t('testing') : t('testConnection')}
            </Button>
            <Button
              onClick={() => handleSave('twilio')}
              disabled={saving === 'twilio'}
            >
              {saving === 'twilio' ? t('saving') : t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp (Meta) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('whatsapp')}</CardTitle>
          <CardDescription>{t('whatsappDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-token">{t('accessToken')}</Label>
            <Input
              id="wa-token"
              type="password"
              value={whatsapp.accessToken}
              onChange={(e) => updateWhatsApp('accessToken', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-phone-id">{t('phoneNumberId')}</Label>
            <Input
              id="wa-phone-id"
              value={whatsapp.phoneNumberId}
              onChange={(e) => updateWhatsApp('phoneNumberId', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="wa-enabled"
              checked={whatsappEnabled}
              onCheckedChange={(checked) => setWhatsappEnabled(checked === true)}
            />
            <Label htmlFor="wa-enabled">{t('enabled')}</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleTest('whatsapp')}
              disabled={testing === 'whatsapp'}
            >
              {testing === 'whatsapp' ? t('testing') : t('testConnection')}
            </Button>
            <Button
              onClick={() => handleSave('whatsapp')}
              disabled={saving === 'whatsapp'}
            >
              {saving === 'whatsapp' ? t('saving') : t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
