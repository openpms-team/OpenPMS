'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Mail, MessageSquare, Send } from 'lucide-react'

// Gmail/Outlook presets
const EMAIL_PRESETS: Record<string, { host: string; port: string; secure: boolean }> = {
  gmail: { host: 'smtp.gmail.com', port: '587', secure: true },
  outlook: { host: 'smtp-mail.outlook.com', port: '587', secure: true },
  yahoo: { host: 'smtp.mail.yahoo.com', port: '587', secure: true },
  custom: { host: '', port: '587', secure: true },
}

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

type IntegrationType = 'smtp' | 'twilio' | 'whatsapp'

export default function MessagingSettingsPage() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')

  // Email state
  const [emailProvider, setEmailProvider] = useState('gmail')
  const [smtp, setSmtp] = useState<SmtpConfig>({
    ...EMAIL_PRESETS.gmail,
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
  })
  const [smtpEnabled, setSmtpEnabled] = useState(false)

  // SMS state
  const [twilio, setTwilio] = useState<TwilioConfig>({
    accountSid: '',
    authToken: '',
    fromNumber: '',
  })
  const [twilioEnabled, setTwilioEnabled] = useState(false)

  // WhatsApp state
  const [waPhone, setWaPhone] = useState('')
  const [waEnabled, setWaEnabled] = useState(false)

  const [saving, setSaving] = useState<IntegrationType | null>(null)

  function handleProviderChange(provider: string) {
    setEmailProvider(provider)
    const preset = EMAIL_PRESETS[provider] ?? EMAIL_PRESETS.custom
    setSmtp((prev) => ({ ...prev, ...preset }))
  }

  async function handleSave(type: IntegrationType) {
    setSaving(type)
    try {
      const supabase = createClient()
      let config: Record<string, unknown> = {}
      let enabled = false

      if (type === 'smtp') {
        config = { ...smtp }
        enabled = smtpEnabled
      } else if (type === 'twilio') {
        config = { ...twilio }
        enabled = twilioEnabled
      } else if (type === 'whatsapp') {
        config = { phone: waPhone }
        enabled = waEnabled
      }

      const { error } = await supabase.from('integration_config').upsert(
        { type, config: JSON.stringify(config), enabled },
        { onConflict: 'type' }
      )

      if (error) {
        toast.error('Erro ao guardar')
      } else {
        toast.success('Guardado com sucesso')
      }
    } catch {
      toast.error('Erro ao guardar')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mensagens</h2>
        <p className="text-muted-foreground mt-1">
          Configure como o OpenPMS envia mensagens aos seus hóspedes.
        </p>
      </div>

      {/* EMAIL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email</CardTitle>
              <CardDescription>
                Envie confirmações de reserva, instruções de check-in e lembretes por email.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Qual o seu serviço de email?</Label>
            <select
              value={emailProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base"
            >
              <option value="gmail">Gmail (Google)</option>
              <option value="outlook">Outlook / Hotmail (Microsoft)</option>
              <option value="yahoo">Yahoo Mail</option>
              <option value="custom">Outro (configuração manual)</option>
            </select>
          </div>

          {emailProvider === 'gmail' && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium">Como configurar com Gmail:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Vá a myaccount.google.com → Segurança</li>
                <li>Active a "Verificação em 2 passos" (se ainda não tiver)</li>
                <li>Procure "Passwords de aplicações" e crie uma nova</li>
                <li>Copie a password gerada e cole no campo abaixo</li>
              </ol>
            </div>
          )}

          {emailProvider === 'outlook' && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium">Como configurar com Outlook:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Use o seu email Outlook normal como utilizador</li>
                <li>Use a sua password do Outlook</li>
                <li>Se tiver 2FA, crie uma password de aplicação em account.microsoft.com</li>
              </ol>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-email">O seu email</Label>
              <Input
                id="smtp-email"
                type="email"
                placeholder="exemplo@gmail.com"
                value={smtp.fromEmail}
                onChange={(e) => setSmtp((p) => ({ ...p, fromEmail: e.target.value, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Password de aplicação</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="••••••••"
                value={smtp.password}
                onChange={(e) => setSmtp((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-name">Nome que aparece nos emails</Label>
            <Input
              id="smtp-name"
              placeholder="O nome da sua empresa de AL"
              value={smtp.fromName}
              onChange={(e) => setSmtp((p) => ({ ...p, fromName: e.target.value }))}
            />
          </div>

          {emailProvider === 'custom' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Servidor SMTP</Label>
                <Input id="smtp-host" value={smtp.host} onChange={(e) => setSmtp((p) => ({ ...p, host: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Porta</Label>
                <Input id="smtp-port" value={smtp.port} onChange={(e) => setSmtp((p) => ({ ...p, port: e.target.value }))} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox id="smtp-secure" checked={smtp.secure} onCheckedChange={(c) => setSmtp((p) => ({ ...p, secure: c === true }))} />
                <Label htmlFor="smtp-secure">Ligação segura (TLS)</Label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox id="email-enabled" checked={smtpEnabled} onCheckedChange={(c) => setSmtpEnabled(c === true)} />
            <Label htmlFor="email-enabled">Activar envio de emails</Label>
          </div>

          <Button onClick={() => handleSave('smtp')} disabled={saving === 'smtp'}>
            {saving === 'smtp' ? 'A guardar...' : 'Guardar configuração de email'}
          </Button>
        </CardContent>
      </Card>

      {/* SMS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>SMS</CardTitle>
              <CardDescription>
                Envie lembretes de check-in e códigos de acesso por SMS. Requer conta Twilio (pago por mensagem).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium">Como configurar SMS:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Crie uma conta gratuita em twilio.com</li>
              <li>No painel Twilio, copie o "Account SID" e "Auth Token"</li>
              <li>Compre um número de telefone (~€1/mês)</li>
              <li>Cada SMS custa ~€0.05 a enviar</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-sid">Account SID</Label>
            <Input id="twilio-sid" placeholder="AC..." value={twilio.accountSid} onChange={(e) => setTwilio((p) => ({ ...p, accountSid: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilio-token">Auth Token</Label>
            <Input id="twilio-token" type="password" value={twilio.authToken} onChange={(e) => setTwilio((p) => ({ ...p, authToken: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilio-number">Número de envio</Label>
            <Input id="twilio-number" placeholder="+351..." value={twilio.fromNumber} onChange={(e) => setTwilio((p) => ({ ...p, fromNumber: e.target.value }))} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="sms-enabled" checked={twilioEnabled} onCheckedChange={(c) => setTwilioEnabled(c === true)} />
            <Label htmlFor="sms-enabled">Activar envio de SMS</Label>
          </div>

          <Button onClick={() => handleSave('twilio')} disabled={saving === 'twilio'}>
            {saving === 'twilio' ? 'A guardar...' : 'Guardar configuração de SMS'}
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>
                Envie links de check-in e mensagens de boas-vindas pelo WhatsApp.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              O envio automático via WhatsApp Business API requer aprovação da Meta e é indicado para volumes altos.
              Para uso simples, o OpenPMS pode gerar links <code>wa.me</code> que abrem uma conversa pré-escrita no seu WhatsApp pessoal.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-phone">O seu número de WhatsApp (com indicativo)</Label>
            <Input id="wa-phone" placeholder="+351 912 345 678" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="wa-enabled" checked={waEnabled} onCheckedChange={(c) => setWaEnabled(c === true)} />
            <Label htmlFor="wa-enabled">Activar WhatsApp</Label>
          </div>

          <Button onClick={() => handleSave('whatsapp')} disabled={saving === 'whatsapp'}>
            {saving === 'whatsapp' ? 'A guardar...' : 'Guardar configuração WhatsApp'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
