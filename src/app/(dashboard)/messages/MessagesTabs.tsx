'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, MessageSquare, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface MessageTemplate {
  id: string
  name: string
  channel: string
  trigger_type: string
  active: boolean
  subject: Record<string, string>
  body: Record<string, string>
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

const CHANNELS = ['email', 'sms', 'whatsapp'] as const
const TRIGGERS = [
  'booking_confirmed', 'pre_checkin', 'checkin_day',
  'during_stay', 'pre_checkout', 'post_checkout', 'manual',
] as const

const TRIGGER_LABELS: Record<string, string> = {
  booking_confirmed: 'Reserva confirmada',
  pre_checkin: 'Antes do check-in',
  checkin_day: 'Dia do check-in',
  during_stay: 'Durante a estadia',
  pre_checkout: 'Antes do check-out',
  post_checkout: 'Após check-out',
  manual: 'Manual',
}

const TIME_TRIGGERS = ['pre_checkin', 'pre_checkout', 'post_checkout']

const VARIABLES = [
  '{{guest_name}}', '{{property_name}}', '{{check_in_date}}',
  '{{check_out_date}}', '{{num_nights}}', '{{door_code}}',
  '{{wifi_ssid}}', '{{wifi_password}}', '{{checkin_link}}',
]

interface MessagesTabsProps {
  initialTemplates: MessageTemplate[]
  logEntries: MessageLogEntry[]
}

export function MessagesTabs({ initialTemplates, logEntries }: MessagesTabsProps) {
  const t = useTranslations('messages')
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formChannel, setFormChannel] = useState<string>('email')
  const [formTrigger, setFormTrigger] = useState<string>('manual')
  const [formSubjectPt, setFormSubjectPt] = useState('')
  const [formSubjectEn, setFormSubjectEn] = useState('')
  const [formBodyPt, setFormBodyPt] = useState('')
  const [formBodyEn, setFormBodyEn] = useState('')
  const [formLang, setFormLang] = useState<'pt' | 'en'>('pt')
  const [formOffsetDays, setFormOffsetDays] = useState(0)
  const [formOffsetHours, setFormOffsetHours] = useState(0)

  function resetForm() {
    setFormName('')
    setFormChannel('email')
    setFormTrigger('manual')
    setFormSubjectPt('')
    setFormSubjectEn('')
    setFormBodyPt('')
    setFormBodyEn('')
    setFormLang('pt')
    setFormOffsetDays(0)
    setFormOffsetHours(0)
  }

  function openCreate() {
    resetForm()
    setEditing(null)
    setCreating(true)
  }

  function openEdit(tpl: MessageTemplate) {
    setFormName(tpl.name)
    setFormChannel(tpl.channel)
    setFormTrigger(tpl.trigger_type)
    setFormSubjectPt(tpl.subject?.pt ?? '')
    setFormSubjectEn(tpl.subject?.en ?? '')
    setFormBodyPt(tpl.body?.pt ?? '')
    setFormBodyEn(tpl.body?.en ?? '')
    const conditions = tpl.body as unknown as Record<string, unknown>
    setFormOffsetDays(Number(conditions?.offset_days) || 0)
    setFormOffsetHours(Number(conditions?.offset_hours) || 0)
    setEditing(tpl)
    setCreating(true)
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
  }

  const handleSave = useCallback(async () => {
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return }
    if (!formBodyPt.trim() && !formBodyEn.trim()) { toast.error('Corpo da mensagem é obrigatório'); return }

    setSaving(true)
    const supabase = createClient()
    const conditions = TIME_TRIGGERS.includes(formTrigger)
      ? { offset_days: formOffsetDays, offset_hours: formOffsetHours }
      : {}

    const data = {
      name: formName,
      channel: formChannel,
      trigger_type: formTrigger,
      subject: { pt: formSubjectPt, en: formSubjectEn },
      body: { pt: formBodyPt, en: formBodyEn },
      conditions,
      active: true,
    }

    if (editing) {
      const { error } = await supabase
        .from('message_templates')
        .update(data)
        .eq('id', editing.id)
      if (error) { toast.error('Erro ao guardar'); setSaving(false); return }
      setTemplates(prev => prev.map(tpl => tpl.id === editing.id ? { ...tpl, ...data } : tpl))
      toast.success('Modelo atualizado')
    } else {
      const { data: created, error } = await supabase
        .from('message_templates')
        .insert(data)
        .select()
        .single()
      if (error) { toast.error('Erro ao criar'); setSaving(false); return }
      setTemplates(prev => [created as MessageTemplate, ...prev])
      toast.success('Modelo criado')
    }

    setSaving(false)
    closeForm()
  }, [formName, formChannel, formTrigger, formSubjectPt, formSubjectEn, formBodyPt, formBodyEn, editing])

  async function handleToggleActive(id: string, active: boolean) {
    const supabase = createClient()
    await supabase.from('message_templates').update({ active: !active }).eq('id', id)
    setTemplates(prev => prev.map(tpl => tpl.id === id ? { ...tpl, active: !active } : tpl))
  }

  function insertVariable(variable: string) {
    if (formLang === 'pt') setFormBodyPt(prev => prev + variable)
    else setFormBodyEn(prev => prev + variable)
  }

  return (
    <Tabs defaultValue={0}>
      <TabsList>
        <TabsTrigger value={0}>{t('templates')}</TabsTrigger>
        <TabsTrigger value={1}>{t('messageLog')}</TabsTrigger>
      </TabsList>

      <TabsContent value={0}>
        {creating ? (
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editing ? 'Editar modelo' : 'Novo modelo de mensagem'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Confirmação de reserva" />
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <select value={formChannel} onChange={e => setFormChannel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Gatilho</Label>
                  <select value={formTrigger} onChange={e => setFormTrigger(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base">
                    {TRIGGERS.map(tr => <option key={tr} value={tr}>{TRIGGER_LABELS[tr]}</option>)}
                  </select>
                </div>
              </div>

              {TIME_TRIGGERS.includes(formTrigger) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      {formTrigger.startsWith('pre_') ? 'Dias antes' : 'Dias depois'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={formOffsetDays}
                      onChange={e => setFormOffsetDays(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {formTrigger.startsWith('pre_') ? 'Horas antes' : 'Horas depois'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={formOffsetHours}
                      onChange={e => setFormOffsetHours(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {formChannel === 'email' && (
                <div className="space-y-2">
                  <Label>Assunto ({formLang.toUpperCase()})</Label>
                  <Input
                    value={formLang === 'pt' ? formSubjectPt : formSubjectEn}
                    onChange={e => formLang === 'pt' ? setFormSubjectPt(e.target.value) : setFormSubjectEn(e.target.value)}
                    placeholder="Assunto do email"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Corpo da mensagem ({formLang.toUpperCase()})</Label>
                  <div className="flex gap-1">
                    <Button size="sm" variant={formLang === 'pt' ? 'default' : 'outline'} onClick={() => setFormLang('pt')}>PT</Button>
                    <Button size="sm" variant={formLang === 'en' ? 'default' : 'outline'} onClick={() => setFormLang('en')}>EN</Button>
                  </div>
                </div>
                <Textarea
                  rows={5}
                  value={formLang === 'pt' ? formBodyPt : formBodyEn}
                  onChange={e => formLang === 'pt' ? setFormBodyPt(e.target.value) : setFormBodyEn(e.target.value)}
                  placeholder="Escreva a sua mensagem aqui..."
                />
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-1">Variáveis:</span>
                  {VARIABLES.map(v => (
                    <button key={v} onClick={() => insertVariable(v)}
                      className="rounded bg-muted px-2 py-0.5 text-xs hover:bg-muted-foreground/20 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'A guardar...' : editing ? 'Guardar alterações' : 'Criar modelo'}
                </Button>
                <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-end pb-4">
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createTemplate')}
            </Button>
          </div>
        )}

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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(tpl => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell>
                    <Badge variant={tpl.channel === 'email' ? 'default' : 'secondary'}>{tpl.channel}</Badge>
                  </TableCell>
                  <TableCell>{TRIGGER_LABELS[tpl.trigger_type] ?? tpl.trigger_type}</TableCell>
                  <TableCell>
                    <Switch checked={tpl.active} onCheckedChange={() => handleToggleActive(tpl.id, tpl.active)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>Editar</Button>
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
              {logEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.reservation?.guest_name ?? '—'}</TableCell>
                  <TableCell>{entry.template?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={entry.channel === 'email' ? 'default' : 'secondary'}>{entry.channel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'failed' ? 'destructive' : 'secondary'}>
                      {entry.status}
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
