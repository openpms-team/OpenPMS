'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { changeStatusAction } from '@/app/(dashboard)/reservations/actions'
import { getAllowedTransitions } from '@/lib/reservations/status-machine'
import type { Reservation, ReservationStatus } from '@/types/database'

interface ReservationTableProps {
  reservations: Array<Reservation & { properties: { name: string } }>
  total: number
}

const statusBadgeClass: Record<ReservationStatus, string> = {
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  checked_in: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  checked_out: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'border border-border text-foreground',
}

const statusTranslationKey: Record<ReservationStatus, string> = {
  confirmed: 'status.confirmed',
  checked_in: 'status.checkedIn',
  checked_out: 'status.checkedOut',
  cancelled: 'status.cancelled',
  no_show: 'status.noShow',
}

export function ReservationTable({ reservations, total: _total }: ReservationTableProps) {
  void _total
  const t = useTranslations('reservations')

  async function handleStatusChange(
    id: string,
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus
  ) {
    const result = await changeStatusAction(id, currentStatus, newStatus)
    if (result.error) {
      toast.error(t('statusChangeError'))
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">{t('property')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('guestName')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('checkIn')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('checkOut')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('nights')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('amount')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('source')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('statusLabel')}</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const allowed = getAllowedTransitions(reservation.status)
              return (
                <tr
                  key={reservation.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/reservations/${reservation.id}`}
                      className="font-medium hover:underline"
                    >
                      {reservation.properties.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/reservations/${reservation.id}`}
                      className="hover:underline"
                    >
                      {reservation.guest_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{reservation.check_in}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{reservation.check_out}</td>
                  <td className="px-4 py-3 text-right">{reservation.num_nights}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {reservation.total_amount != null
                      ? `${reservation.total_amount.toFixed(2)} ${reservation.currency}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{reservation.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {allowed.length > 0 ? (
                      <select
                        className="rounded border bg-transparent px-2 py-1 text-xs"
                        value={reservation.status}
                        onChange={(e) =>
                          handleStatusChange(
                            reservation.id,
                            reservation.status,
                            e.target.value as ReservationStatus
                          )
                        }
                      >
                        <option value={reservation.status}>
                          {t(statusTranslationKey[reservation.status])}
                        </option>
                        {allowed.map((s) => (
                          <option key={s} value={s}>
                            {t(statusTranslationKey[s])}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge className={statusBadgeClass[reservation.status]}>
                        {t(statusTranslationKey[reservation.status])}
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
