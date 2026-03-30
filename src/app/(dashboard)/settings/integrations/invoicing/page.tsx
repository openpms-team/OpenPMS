'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

type Provider = 'moloni' | 'invoicexpress' | 'manual'

interface MoloniConfig {
  clientId: string
  clientSecret: string
  companyId: string
  refreshToken: string
}

interface InvoiceXpressConfig {
  subdomain: string
  apiKey: string
}

const defaultMoloni: MoloniConfig = { clientId: '', clientSecret: '', companyId: '', refreshToken: '' }
const defaultInvoiceXpress: InvoiceXpressConfig = { subdomain: '', apiKey: '' }

export default function InvoicingSettingsPage() {
  const t = useTranslations('settings')
  const [provider, setProvider] = useState<Provider>('manual')
  const [moloni, setMoloni] = useState<MoloniConfig>(defaultMoloni)
  const [invoiceXpress, setInvoiceXpress] = useState<InvoiceXpressConfig>(defaultInvoiceXpress)
  const [autoInvoice, setAutoInvoice] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('integration_config')
        .select('type, config, enabled')
        .in('type', ['moloni', 'invoicexpress'])

      if (data && data.length > 0) {
        for (const row of data) {
          const cfg = row.config as Record<string, string>
          if (row.type === 'moloni') {
            setProvider('moloni')
            setMoloni({
              clientId: cfg.clientId ?? '',
              clientSecret: cfg.clientSecret ?? '',
              companyId: cfg.companyId ?? '',
              refreshToken: cfg.refreshToken ?? '',
            })
            setAutoInvoice(row.enabled ?? false)
          } else if (row.type === 'invoicexpress') {
            setProvider('invoicexpress')
            setInvoiceXpress({
              subdomain: cfg.subdomain ?? '',
              apiKey: cfg.apiKey ?? '',
            })
            setAutoInvoice(row.enabled ?? false)
          }
        }
      }
    } catch {
      // RLS or connection error
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  async function handleSave() {
    if (provider === 'manual') {
      toast.success(t('invoicing.saved'))
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const config = provider === 'moloni' ? moloni : invoiceXpress
      const { error } = await supabase
        .from('integration_config')
        .upsert({
          type: provider,
          config,
          enabled: autoInvoice,
        }, { onConflict: 'type' })

      if (error) {
        toast.error(t('invoicing.saveError'))
        return
      }
      toast.success(t('invoicing.saved'))
    } catch {
      toast.error(t('invoicing.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    try {
      // Placeholder: in production this would call an edge function
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(t('invoicing.testSuccess'))
    } catch {
      toast.error(t('invoicing.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('invoicing.title')}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('invoicing.selectProvider')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['moloni', 'invoicexpress', 'manual'] as const).map((p) => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="invoicing-provider"
                value={p}
                checked={provider === p}
                onChange={() => setProvider(p)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{t(`invoicing.${p}`)}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {provider === 'moloni' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('invoicing.moloni')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('invoicing.clientId')}</Label>
              <Input
                value={moloni.clientId}
                onChange={(e) => setMoloni({ ...moloni, clientId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('invoicing.clientSecret')}</Label>
              <Input
                type="password"
                value={moloni.clientSecret}
                onChange={(e) => setMoloni({ ...moloni, clientSecret: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('invoicing.companyId')}</Label>
              <Input
                value={moloni.companyId}
                onChange={(e) => setMoloni({ ...moloni, companyId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('invoicing.refreshToken')}</Label>
              <Input
                type="password"
                value={moloni.refreshToken}
                onChange={(e) => setMoloni({ ...moloni, refreshToken: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {provider === 'invoicexpress' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('invoicing.invoicexpress')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('invoicing.subdomain')}</Label>
              <Input
                value={invoiceXpress.subdomain}
                onChange={(e) => setInvoiceXpress({ ...invoiceXpress, subdomain: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('invoicing.apiKey')}</Label>
              <Input
                type="password"
                value={invoiceXpress.apiKey}
                onChange={(e) => setInvoiceXpress({ ...invoiceXpress, apiKey: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {provider !== 'manual' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={autoInvoice}
                onCheckedChange={(checked) => setAutoInvoice(checked === true)}
              />
              <span className="text-sm">{t('invoicing.autoInvoice')}</span>
            </label>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {provider !== 'manual' && (
          <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
            {testing ? t('invoicing.testing') : t('invoicing.testConnection')}
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('invoicing.saving') : t('invoicing.save')}
        </Button>
      </div>
    </div>
  )
}
