'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GuestRow {
  id: string
  full_name: string
  nationality_icao: string | null
  reservations: {
    id: string
    guest_name: string
    check_in: string
  } | null
}

interface SefBulletinRow {
  id: string
  status: string
  deadline: string
  guests: {
    id: string
    full_name: string
    nationality_icao: string | null
  } | null
  reservations: {
    id: string
    check_in: string
  } | null
}

interface GuestsTabsProps {
  guests: GuestRow[]
  bulletins: SefBulletinRow[]
}

export function GuestsTabs({ guests, bulletins }: GuestsTabsProps) {
  const t = useTranslations('guests')

  const getStatusBadge = useMemo(() => {
    return function StatusBadge(status: string, deadline: string) {
      if (status === 'submitted' || status === 'accepted') {
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {t(`sefStatus.${status}`)}
          </Badge>
        )
      }

      if (status === 'error') {
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {t('sefStatus.error')}
          </Badge>
        )
      }

      const hoursRemaining = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60)

      if (hoursRemaining <= 24) {
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {t('sefStatus.pending')}
          </Badge>
        )
      }

      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          {t('sefStatus.pending')}
        </Badge>
      )
    }
  }, [t])

  return (
    <Tabs defaultValue="all-guests">
      <TabsList>
        <TabsTrigger value="all-guests">{t('tabAllGuests')}</TabsTrigger>
        <TabsTrigger value="sef-compliance">{t('tabSefCompliance')}</TabsTrigger>
      </TabsList>

      <TabsContent value="all-guests" className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('tabAllGuests')}</CardTitle>
          </CardHeader>
          <CardContent>
            {guests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noGuests')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">{t('columnName')}</th>
                      <th className="pb-2 font-medium">{t('columnNationality')}</th>
                      <th className="pb-2 font-medium">{t('columnReservation')}</th>
                      <th className="pb-2 font-medium">{t('columnCheckIn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((guest) => (
                      <tr key={guest.id} className="border-b last:border-0">
                        <td className="py-2">{guest.full_name}</td>
                        <td className="py-2">{guest.nationality_icao ?? '-'}</td>
                        <td className="py-2">{guest.reservations?.guest_name ?? '-'}</td>
                        <td className="py-2">{guest.reservations?.check_in ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sef-compliance" className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('tabSefCompliance')}</CardTitle>
          </CardHeader>
          <CardContent>
            {bulletins.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noBulletins')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">{t('columnName')}</th>
                      <th className="pb-2 font-medium">{t('columnNationality')}</th>
                      <th className="pb-2 font-medium">{t('columnCheckIn')}</th>
                      <th className="pb-2 font-medium">{t('columnDeadline')}</th>
                      <th className="pb-2 font-medium">{t('columnStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletins.map((bulletin) => (
                      <tr key={bulletin.id} className="border-b last:border-0">
                        <td className="py-2">{bulletin.guests?.full_name ?? '-'}</td>
                        <td className="py-2">{bulletin.guests?.nationality_icao ?? '-'}</td>
                        <td className="py-2">{bulletin.reservations?.check_in ?? '-'}</td>
                        <td className="py-2">{new Date(bulletin.deadline).toLocaleDateString()}</td>
                        <td className="py-2">{getStatusBadge(bulletin.status, bulletin.deadline)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
