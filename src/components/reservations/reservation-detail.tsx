'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CalendarDays, Users, DollarSign, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAllowedTransitions } from '@/lib/reservations/status-machine'
import { changeStatusAction } from '@/app/(dashboard)/reservations/actions'
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

export function ReservationDetail({ reservation }: Props) {
  const t = useTranslations('reservations')
  const tCommon = useTranslations('common')
  const allowed = getAllowedTransitions(reservation.status)

  async function handleStatusChange(newStatus: ReservationStatus) {
    const result = await changeStatusAction(reservation.id, reservation.status, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Status changed to ${newStatus}`)
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
      </TabsContent>

      <TabsContent value="guests" className="pt-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Guest management will be available in the check-in module.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
