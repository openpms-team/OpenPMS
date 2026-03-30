'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Property, Reservation, ReservationStatus } from '@/types/database'

type CalendarReservation = Pick<
  Reservation,
  'id' | 'property_id' | 'guest_name' | 'check_in' | 'check_out' | 'status' | 'num_guests'
>

interface Props {
  properties: Property[]
  reservations: CalendarReservation[]
  year: number
  month: number
}

const statusColor: Record<ReservationStatus, string> = {
  confirmed: 'bg-blue-200 text-blue-900',
  checked_in: 'bg-green-200 text-green-900',
  checked_out: 'bg-gray-200 text-gray-900',
  cancelled: 'bg-red-200 text-red-900',
  no_show: 'bg-yellow-200 text-yellow-900',
}

export function CalendarGrid({ properties, reservations, year, month }: Props) {
  const t = useTranslations('calendar')
  const router = useRouter()

  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayStr = new Date().toISOString().split('T')[0]

  const prevMonth = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 }
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }

  const reservationsByProperty = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>()
    for (const r of reservations) {
      const list = map.get(r.property_id) ?? []
      list.push(r)
      map.set(r.property_id, list)
    }
    return map
  }, [reservations])

  function getReservationForDay(propertyId: string, day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const list = reservationsByProperty.get(propertyId) ?? []
    return list.find((r) => r.check_in <= dateStr && r.check_out > dateStr)
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            router.push(`/calendar?year=${prevMonth.y}&month=${prevMonth.m}`)
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold capitalize">{monthLabel}</h3>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            router.push(`/calendar?year=${nextMonth.y}&month=${nextMonth.m}`)
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/calendar')}
        >
          {t('today')}
        </Button>
      </div>

      {/* Desktop grid */}
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b">
            <div className="w-36 shrink-0 p-2 text-sm font-medium" />
            {days.map((day) => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              return (
                <div
                  key={day}
                  className={cn(
                    'flex-1 min-w-[30px] p-1 text-center text-xs',
                    isToday && 'bg-blue-50 font-bold'
                  )}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Property rows */}
          {properties.map((property) => (
            <div key={property.id} className="flex border-b">
              <div className="w-36 shrink-0 truncate p-2 text-sm">
                {property.name}
              </div>
              {days.map((day) => {
                const reservation = getReservationForDay(property.id, day)
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isToday = dateStr === todayStr
                const isStart = reservation?.check_in === dateStr

                return (
                  <div
                    key={day}
                    className={cn(
                      'flex-1 min-w-[30px] min-h-[28px] border-l',
                      isToday && 'bg-blue-50'
                    )}
                  >
                    {reservation && (
                      <Link href={`/reservations/${reservation.id}`}>
                        <div
                          className={cn(
                            'h-full text-[10px] leading-tight truncate px-0.5',
                            statusColor[reservation.status]
                          )}
                          title={reservation.guest_name}
                        >
                          {isStart ? reservation.guest_name : ''}
                        </div>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list */}
      <div className="space-y-2 md:hidden">
        {reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reservations this month</p>
        ) : (
          reservations.map((r) => (
            <Link key={r.id} href={`/reservations/${r.id}`}>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{r.guest_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.check_in} → {r.check_out}
                  </p>
                </div>
                <span className={cn('rounded px-2 py-1 text-xs', statusColor[r.status])}>
                  {r.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
