'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SefSettingsPage() {
  const t = useTranslations('settings')

  const [nif, setNif] = useState('')
  const [establishmentId, setEstablishmentId] = useState('')
  const [accessKey, setAccessKey] = useState('')
  const [method, setMethod] = useState<string>('web_service')
  const [autoSend, setAutoSend] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('integration_config').upsert({
        provider: 'sef',
        config: {
          nif,
          establishment_id: establishmentId,
          access_key: accessKey,
          preferred_method: method,
          auto_send: autoSend,
        },
      }, { onConflict: 'provider' })

      setMessage(error ? t('sef.saveError') : t('sef.saveSuccess'))
    } catch {
      setMessage(t('sef.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.functions.invoke('sef-test-connection', {
        body: { nif, establishment_id: establishmentId, access_key: accessKey },
      })
      setMessage(error ? t('sef.testFailed') : t('sef.testSuccess'))
    } catch {
      setMessage(t('sef.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('sef.title')}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t('sef.configuration')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nif">{t('sef.nif')}</Label>
            <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="establishment-id">{t('sef.establishmentId')}</Label>
            <Input id="establishment-id" value={establishmentId} onChange={(e) => setEstablishmentId(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-key">{t('sef.accessKey')}</Label>
            <Input id="access-key" type="password" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('sef.preferredMethod')}</Label>
            <Select value={method} onValueChange={(v) => v && setMethod(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web_service">{t('sef.methodWebService')}</SelectItem>
                <SelectItem value="dat_file">{t('sef.methodDatFile')}</SelectItem>
                <SelectItem value="portal">{t('sef.methodPortal')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-send"
              checked={autoSend}
              onCheckedChange={(checked) => setAutoSend(checked === true)}
            />
            <Label htmlFor="auto-send">{t('sef.autoSend')}</Label>
          </div>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? t('sef.testing') : t('sef.testConnection')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('sef.saving') : t('sef.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
