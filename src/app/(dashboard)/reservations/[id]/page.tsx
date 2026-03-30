import { notFound } from 'next/navigation'
import { getReservation } from '@/lib/supabase/queries/reservations'
import { ReservationDetail } from '@/components/reservations/reservation-detail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params
  const reservation = await getReservation(id)

  if (!reservation) notFound()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">
        {reservation.guest_name}
      </h2>
      <ReservationDetail reservation={reservation} />
    </div>
  )
}
