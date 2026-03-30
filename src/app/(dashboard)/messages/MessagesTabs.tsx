'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'

interface MessageTemplate {
  id: string
  name: string
  channel: string
  trigger_type: string
  active: boolean
}

interface MessageLogEntry {
  id: string
  channel: string
  status: string
  created_at: string
  subject: string | null
  reservation: { guest_name: string } | null
  template: { name: string } | null
}

function channelVariant(channel: string) {
  switch (channel) {
    case 'email': return 'default' as const
    case 'sms': return 'secondary' as const
    case 'whatsapp': return 'outline' as const
    default: return 'secondary' as const
  }
}

function statusVariant(status: string) {
  switch (status) {
    case 'pending': return 'secondary' as const
    case 'sent': return 'default' as const
    case 'delivered': return 'default' as const
    case 'failed': return 'destructive' as const
    default: return 'secondary' as const
  }
}

interface MessagesTabsProps {
  initialTemplates: MessageTemplate[]
  logEntries: MessageLogEntry[]
}

export function MessagesTabs({ initialTemplates, logEntries }: MessagesTabsProps) {
  const t = useTranslations('messages')
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates)

  async function handleToggleActive(id: string, active: boolean) {
    try {
      const supabase = createClient()
      await supabase
        .from('message_templates')
        .update({ active: !active })
        .eq('id', id)
      setTemplates((prev) =>
        prev.map((tpl) => (tpl.id === id ? { ...tpl, active: !active } : tpl))
      )
    } catch {
      // Error toggling
    }
  }

  return (
    <Tabs defaultValue={0}>
      <TabsList>
        <TabsTrigger value={0}>{t('templates')}</TabsTrigger>
        <TabsTrigger value={1}>{t('messageLog')}</TabsTrigger>
      </TabsList>

      <TabsContent value={0}>
        <div className="flex justify-end pb-4">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('createTemplate')}
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('noTemplates')}</h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('templateName')}</TableHead>
                <TableHead>{t('channel')}</TableHead>
                <TableHead>{t('triggerType')}</TableHead>
                <TableHead>{t('active')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell>
                    <Badge variant={channelVariant(tpl.channel)}>
                      {tpl.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>{tpl.trigger_type}</TableCell>
                  <TableCell>
                    <Switch
                      checked={tpl.active}
                      onCheckedChange={() => handleToggleActive(tpl.id, tpl.active)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value={1}>
        {logEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('noLogEntries')}</h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('guest')}</TableHead>
                <TableHead>{t('template')}</TableHead>
                <TableHead>{t('channel')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {entry.reservation?.guest_name ?? '—'}
                  </TableCell>
                  <TableCell>{entry.template?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={channelVariant(entry.channel)}>
                      {entry.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(entry.status)}>
                      {t(entry.status as 'pending' | 'sent' | 'delivered' | 'failed')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  )
}
