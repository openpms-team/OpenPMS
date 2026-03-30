'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CalendarDays, Users, DollarSign, Clock, Send } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAllowedTransitions } from '@/lib/reservations/status-machine'
import { changeStatusAction } from '@/app/(dashboard)/reservations/actions'
import { sendManualMessageAction } from '@/components/reservations/send-message-action'
import { createClient } from '@/lib/supabase/client'
import type { Reservation, ReservationStatus } from '@/types/database'

const statusColors: Record<ReservationStatus, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-yellow-100 text-yellow-800',
}

interface Props {
  reservation: Reservation & {
    properties: { name: string; tax_jurisdiction_id: string | null; max_guests: number }
  }
}

interface MessageTemplate {
  id: string
  name: string
}

export function ReservationDetail({ reservation }: Props) {
  const t = useTranslations('reservations')
  const tCommon = useTranslations('common')
  const tMessages = useTranslations('messages')
  const allowed = getAllowedTransitions(reservation.status)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('message_templates')
      .select('id, name')
      .eq('trigger_type', 'manual')
      .eq('active', true)
      .then(({ data }) => {
        if (data) setTemplates(data)
      })
  }, [])

  async function handleSendMessage() {
    if (!selectedTemplate) return
    setSending(true)
    try {
      const result = await sendManualMessageAction(reservation.id, selectedTemplate)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(tMessages('messageSent'))
        setSelectedTemplate('')
      }
    } catch {
      toast.error(tCommon('genericError'))
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(newStatus: ReservationStatus) {
    const result = await changeStatusAction(reservation.id, reservation.status, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('statusChangedTo', { status: t(`status.${newStatus}`) }))
    }
  }

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{t('title')}</TabsTrigger>
        <TabsTrigger value="guests">{tCommon('name')}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Badge className={statusColors[reservation.status]}>
            {t(`status.${reservation.status}`)}
          </Badge>
          {allowed.length > 0 && (
            <div className="flex gap-1">
              {allowed.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                >
                  → {t(`status.${status}`)}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('checkIn')}
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reservation.check_in}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('checkOut')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reservation.check_out}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('guests')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reservation.num_guests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalAmount')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {reservation.total_amount
                  ? `${reservation.total_amount} ${reservation.currency}`
                  : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{tCommon('notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {reservation.notes ?? '—'}
            </p>
          </CardContent>
        </Card>

        {templates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4" />
                {tMessages('sendMessage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">{tMessages('selectTemplate')}</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!selectedTemplate || sending}
                  onClick={handleSendMessage}
                >
                  {sending ? tCommon('loading') : tMessages('send')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="guests" className="pt-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {t('guestManagementComingSoon')}
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
