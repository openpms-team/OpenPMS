import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CalendarRange, Plus } from 'lucide-react'
import { getReservations } from '@/lib/supabase/queries/reservations'
import { Button } from '@/components/ui/button'
import { ReservationTable } from '@/components/reservations/reservation-table'

export default async function ReservationsPage() {
  const t = await getTranslations('reservations')

  let reservations: Awaited<ReturnType<typeof getReservations>>['reservations'] = []
  let total = 0

  try {
    const result = await getReservations()
    reservations = result.reservations
    total = result.total
  } catch {
    // RLS or connection error — show empty state
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <Link href="/reservations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CalendarRange className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noReservations')}</h3>
          <Link href="/reservations/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addNew')}
            </Button>
          </Link>
        </div>
      ) : (
        <ReservationTable reservations={reservations} total={total} />
      )}
    </div>
  )
}
