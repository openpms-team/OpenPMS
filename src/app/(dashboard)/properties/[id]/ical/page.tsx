'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

interface ICalFeed {
  id: string
  source_name: string
  url: string
  last_synced_at: string | null
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}/***`
  } catch {
    return '***'
  }
}

export default function ICalManagementPage() {
  const params = useParams<{ id: string }>()
  const propertyId = params.id
  const t = useTranslations('properties')

  const [feeds, setFeeds] = useState<ICalFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [newSourceName, setNewSourceName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadFeeds = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('ical_feeds')
      .select('id, source_name, url, last_synced_at')
      .eq('property_id', propertyId)
      .order('created_at')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setFeeds(data ?? [])
        }
        setLoading(false)
      })
  }, [propertyId])

  useEffect(() => {
    loadFeeds()
  }, [loadFeeds])

  const handleAdd = useCallback(async () => {
    if (!newSourceName.trim() || !newUrl.trim()) return
    setAdding(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('ical_feeds')
      .insert({
        property_id: propertyId,
        source_name: newSourceName.trim(),
        url: newUrl.trim(),
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setNewSourceName('')
      setNewUrl('')
      await loadFeeds()
    }
    setAdding(false)
  }, [propertyId, newSourceName, newUrl, loadFeeds])

  const handleRemove = useCallback(async (feedId: string) => {
    setError(null)
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('ical_feeds')
      .delete()
      .eq('id', feedId)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setFeeds((prev) => prev.filter((f) => f.id !== feedId))
    }
  }, [])

  const handleSync = useCallback(async (feedId: string) => {
    setSyncing(feedId)
    setError(null)

    try {
      const response = await fetch(`/api/ical/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId }),
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? t('syncFailed'))
      } else {
        await loadFeeds()
      }
    } catch {
      setError(t('syncFailed'))
    }
    setSyncing(null)
  }, [loadFeeds, t])

  if (loading) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('icalFeeds')}</h2>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {feeds.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('noIcalFeeds')}</p>
      )}

      <div className="space-y-3">
        {feeds.map((feed) => (
          <Card key={feed.id}>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{feed.source_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {maskUrl(feed.url)}
                </p>
                {feed.last_synced_at && (
                  <p className="text-xs text-muted-foreground">
                    {t('lastSynced')}: {new Date(feed.last_synced_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(feed.id)}
                  disabled={syncing === feed.id}
                >
                  {syncing === feed.id ? t('syncing') : t('syncNow')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(feed.id)}
                >
                  {t('remove')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('addIcalFeed')}</CardTitle>
          <CardDescription>{t('addIcalFeedDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('sourceName')}</Label>
            <Input
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder={t('sourceNamePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('icalUrl')}</Label>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={adding || !newSourceName.trim() || !newUrl.trim()}
          >
            {adding ? t('adding') : t('addFeed')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
