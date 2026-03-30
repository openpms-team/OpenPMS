import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { MessagesTabs } from './MessagesTabs'

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

export default async function MessagesPage() {
  const t = await getTranslations('messages')

  let templates: MessageTemplate[] = []
  let logEntries: MessageLogEntry[] = []

  try {
    const supabase = await createClient()
    const [templatesRes, logRes] = await Promise.all([
      supabase
        .from('message_templates')
        .select('id, name, channel, trigger_type, active, subject, body')
        .order('created_at', { ascending: false }),
      supabase
        .from('message_log')
        .select(`
          id, channel, status, created_at, subject,
          reservation:reservations(guest_name),
          template:message_templates(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    if (templatesRes.data) templates = templatesRes.data
    if (logRes.data) logEntries = logRes.data as unknown as MessageLogEntry[]
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
      </div>
      <MessagesTabs initialTemplates={templates} logEntries={logEntries} />
    </div>
  )
}
