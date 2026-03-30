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

type Provider = 'anthropic' | 'openai' | 'openai_compatible'

const FEATURE_KEYS = [
  'ocr', 'concierge', 'bi_chat', 'review_response',
  'listing_generator', 'smart_alerts', 'nl_automation', 'translation',
] as const

type FeatureKey = (typeof FEATURE_KEYS)[number]

interface AiConfig {
  provider: Provider
  api_key: string
  model: string
  base_url: string
  features: Record<FeatureKey, boolean>
  monthly_budget: number
}

const DEFAULT_CONFIG: AiConfig = {
  provider: 'anthropic',
  api_key: '',
  model: 'claude-sonnet-4-20250514',
  base_url: '',
  features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, false])) as Record<FeatureKey, boolean>,
  monthly_budget: 50,
}

function getDefaultModel(provider: Provider): string {
  if (provider === 'anthropic') return 'claude-sonnet-4-20250514'
  return 'gpt-4o-mini'
}

const FEATURE_I18N_MAP: Record<FeatureKey, string> = {
  ocr: 'ocr',
  concierge: 'concierge',
  bi_chat: 'biChat',
  review_response: 'reviewResponse',
  listing_generator: 'listingGenerator',
  smart_alerts: 'smartAlerts',
  nl_automation: 'nlAutomation',
  translation: 'translation',
}

export default function AISettingsPage() {
  const t = useTranslations('ai')
  const ts = useTranslations('settings')
  const tc = useTranslations('common')
  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('integration_config')
        .select('config, enabled')
        .eq('type', 'ai')
        .maybeSingle()
      if (data?.config) {
        const cfg = data.config as Record<string, unknown>
        setConfig({
          provider: (cfg.provider as Provider) ?? DEFAULT_CONFIG.provider,
          api_key: (cfg.api_key as string) ?? '',
          model: (cfg.model as string) ?? getDefaultModel((cfg.provider as Provider) ?? 'anthropic'),
          base_url: (cfg.base_url as string) ?? '',
          features: { ...DEFAULT_CONFIG.features, ...(cfg.features as Record<FeatureKey, boolean>) },
          monthly_budget: (cfg.monthly_budget as number) ?? 50,
        })
      }
    } catch {
      // RLS or connection error
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function updateProvider(provider: Provider) {
    setConfig((prev) => ({ ...prev, provider, model: getDefaultModel(provider) }))
  }

  function toggleFeature(key: FeatureKey) {
    setConfig((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('integration_config').upsert(
        { type: 'ai', config, enabled: true },
        { onConflict: 'type' }
      )
      if (error) { toast.error(ts('invoicing.saveError')); return }
      toast.success(ts('invoicing.saved'))
    } catch {
      toast.error(ts('invoicing.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, model: config.model }),
      })
      if (res.ok) toast.success(ts('invoicing.testSuccess'))
      else toast.error(ts('invoicing.testFailed'))
    } catch {
      toast.error(ts('invoicing.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('settings')}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('provider')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('provider')}</Label>
            <select
              value={config.provider}
              onChange={(e) => updateProvider(e.target.value as Provider)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="openai_compatible">OpenAI-compatible</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t('apiKey')}</Label>
            <Input
              type="password"
              value={config.api_key}
              onChange={(e) => setConfig((p) => ({ ...p, api_key: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('model')}</Label>
            <select
              value={config.model}
              onChange={(e) => setConfig((p) => ({ ...p, model: e.target.value }))}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {config.provider === 'anthropic' ? (
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
              ) : (
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              )}
            </select>
          </div>
          {config.provider === 'openai_compatible' && (
            <div className="space-y-1">
              <Label>{t('baseUrl')}</Label>
              <Input
                value={config.base_url}
                onChange={(e) => setConfig((p) => ({ ...p, base_url: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('features')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FEATURE_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={config.features[key]}
                onCheckedChange={() => toggleFeature(key)}
              />
              <span className="text-sm">{t(FEATURE_I18N_MAP[key])}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {config.features[key] ? t('featureEnabled') : t('featureDisabled')}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>{t('monthlyBudget')} (EUR)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={config.monthly_budget}
              onChange={(e) => setConfig((p) => ({ ...p, monthly_budget: Number(e.target.value) }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
          {testing ? ts('invoicing.testing') : t('testConnection')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? tc('loading') : tc('save')}
        </Button>
      </div>
    </div>
  )
}
