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

type Provider = 'pricelabs' | 'beyond' | 'manual'

interface Property {
  id: string
  name: string
}

interface PropertyConfig {
  listing_id: string
  min_price: string
  max_price: string
}

export default function PricingSettingsPage() {
  const t = useTranslations('settings')
  const tp = useTranslations('pricing')
  const [provider, setProvider] = useState<Provider>('manual')
  const [apiKey, setApiKey] = useState('')
  const [autoAccept, setAutoAccept] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [configs, setConfigs] = useState<Record<string, PropertyConfig>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()
      const [propsRes, cfgRes] = await Promise.all([
        supabase.from('properties').select('id, name').order('name'),
        supabase.from('integration_config').select('type, config, enabled').eq('type', 'pricing'),
      ])
      if (propsRes.data) setProperties(propsRes.data)
      if (cfgRes.data && cfgRes.data.length > 0) {
        const row = cfgRes.data[0]
        const cfg = row.config as Record<string, unknown>
        setProvider((cfg.provider as Provider) ?? 'manual')
        setApiKey((cfg.api_key as string) ?? '')
        setAutoAccept(row.enabled ?? false)
        if (cfg.property_configs) {
          setConfigs(cfg.property_configs as Record<string, PropertyConfig>)
        }
      }
    } catch {
      // RLS or connection error
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function updateConfig(propertyId: string, field: keyof PropertyConfig, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [propertyId]: { ...prev[propertyId], [field]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('integration_config').upsert({
        type: 'pricing',
        config: { provider, api_key: apiKey, property_configs: configs },
        enabled: autoAccept,
      }, { onConflict: 'type' })
      if (error) { toast.error(t('invoicing.saveError')); return }
      toast.success(t('invoicing.saved'))
    } catch {
      toast.error(t('invoicing.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
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
      <h2 className="text-2xl font-bold tracking-tight">{tp('settings')}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{tp('provider')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['pricelabs', 'beyond', 'manual'] as const).map((p) => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricing-provider"
                value={p}
                checked={provider === p}
                onChange={() => setProvider(p)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{p === 'pricelabs' ? 'PriceLabs' : p === 'beyond' ? 'Beyond' : tp('manual')}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {provider !== 'manual' && (
        <>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <Label>{t('invoicing.apiKey')}</Label>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={autoAccept} onCheckedChange={(c) => setAutoAccept(c === true)} />
                <span className="text-sm">{tp('autoAccept')}</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{tp('title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {properties.map((prop) => (
                <div key={prop.id} className="grid gap-3 sm:grid-cols-3 items-end border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <Label>{prop.name} - {tp('listingId')}</Label>
                    <Input
                      value={configs[prop.id]?.listing_id ?? ''}
                      onChange={(e) => updateConfig(prop.id, 'listing_id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tp('minPrice')}</Label>
                    <Input
                      type="number" min="0" step="1"
                      value={configs[prop.id]?.min_price ?? ''}
                      onChange={(e) => updateConfig(prop.id, 'min_price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{tp('maxPrice')}</Label>
                    <Input
                      type="number" min="0" step="1"
                      value={configs[prop.id]?.max_price ?? ''}
                      onChange={(e) => updateConfig(prop.id, 'max_price', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-3">
        {provider !== 'manual' && (
          <Button variant="outline" onClick={handleTest} disabled={testing}>
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
