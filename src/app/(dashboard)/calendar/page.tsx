import { getTranslations } from 'next-intl/server'
import { getProperties } from '@/lib/supabase/queries/properties'
import { getCalendarReservations } from '@/lib/supabase/queries/reservations'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import type { Property } from '@/types/database'

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const params = await searchParams
  const t = await getTranslations('calendar')
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1

  let properties: Property[] = []
  let reservations: Awaited<ReturnType<typeof getCalendarReservations>> = []

  try {
    properties = await getProperties()
    reservations = await getCalendarReservations(year, month)
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
      <CalendarGrid
        properties={properties}
        reservations={reservations}
        year={year}
        month={month}
      />
    </div>
  )
}
