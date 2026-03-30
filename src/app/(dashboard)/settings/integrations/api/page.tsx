'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
}

const WEBHOOK_EVENTS = [
  'reservation.created',
  'reservation.updated',
  'reservation.status_changed',
  'guest.checked_in',
  'task.created',
  'task.completed',
  'invoice.created',
] as const

export default function ApiSettingsPage() {
  const t = useTranslations('settings')
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const fetchApiKeys = useCallback(async () => {
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at, revoked_at')
      .order('created_at', { ascending: false })
    if (data) setApiKeys(data)
  }, [supabase])

  const fetchWebhooks = useCallback(async () => {
    const { data } = await supabase
      .from('webhooks')
      .select('id, url, events, active, created_at')
      .order('created_at', { ascending: false })
    if (data) setWebhooks(data)
  }, [supabase])

  useEffect(() => {
    fetchApiKeys()
    fetchWebhooks()
  }, [fetchApiKeys, fetchWebhooks])

  async function handleCreateKey() {
    if (!newKeyName.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const json = await res.json() as { data?: { plain_key: string } }
      if (json.data?.plain_key) {
        setCreatedKey(json.data.plain_key)
        setNewKeyName('')
        await fetchApiKeys()
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false)
    }
  }

  async function handleRevokeKey(id: string) {
    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) await fetchApiKeys()
  }

  async function handleAddWebhook() {
    if (!webhookUrl.trim() || selectedEvents.length === 0 || loading) return
    setLoading(true)
    try {
      const { error } = await supabase.from('webhooks').insert({
        url: webhookUrl.trim(),
        events: selectedEvents,
        active: true,
      })
      if (!error) {
        setWebhookUrl('')
        setSelectedEvents([])
        await fetchWebhooks()
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveWebhook(id: string) {
    const { error } = await supabase.from('webhooks').delete().eq('id', id)
    if (!error) await fetchWebhooks()
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return t('api.never')
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('api.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('api.description')}</p>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">{t('api.apiKeys')}</TabsTrigger>
          <TabsTrigger value="webhooks">{t('api.webhooks')}</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {createdKey && (
            <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm dark:border-green-700 dark:bg-green-950">
              <p className="font-medium">{t('api.keyCreated')}</p>
              <code className="mt-1 block break-all font-mono text-xs">{createdKey}</code>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium">{t('api.keyName')}</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={t('api.keyName')}
              />
            </div>
            <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || loading}>
              {t('api.createKey')}
            </Button>
          </div>

          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('api.noKeys')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('api.keyName')}</TableHead>
                  <TableHead>{t('api.keyPrefix')}</TableHead>
                  <TableHead>{t('api.lastUsed')}</TableHead>
                  <TableHead>{t('api.status')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{key.key_prefix}...</code>
                    </TableCell>
                    <TableCell>{formatDate(key.last_used_at)}</TableCell>
                    <TableCell>
                      <Badge variant={key.revoked_at ? 'destructive' : 'default'}>
                        {key.revoked_at ? t('api.revoked') : t('api.active')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!key.revoked_at && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          {t('api.revoke')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{t('api.webhookUrl')}</label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('api.events')}</label>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={handleAddWebhook}
              disabled={!webhookUrl.trim() || selectedEvents.length === 0 || loading}
            >
              {t('api.addWebhook')}
            </Button>
          </div>

          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('api.noWebhooks')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('api.webhookUrl')}</TableHead>
                  <TableHead>{t('api.events')}</TableHead>
                  <TableHead>{t('api.status')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">
                      {wh.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map((ev) => (
                          <Badge key={ev} variant="secondary" className="text-xs">
                            {ev}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wh.active ? 'default' : 'secondary'}>
                        {wh.active ? t('api.active') : t('api.revoked')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveWebhook(wh.id)}
                      >
                        {t('api.removeWebhook')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
