import { validateToken } from '@/lib/checkin/generate-link'
import { CheckinWizard } from '@/components/guest-portal/checkin-wizard'
import { getTranslations } from 'next-intl/server'

export default async function GuestCheckinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const t = await getTranslations('guestPortal')
  const result = await validateToken(token)

  if (!result.valid) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm font-medium text-red-800">
            {result.reason === 'expired' ? t('expiredLink') : t('invalidLink')}
          </p>
        </div>
      </div>
    )
  }

  const reservation = result.data.reservations
  const guestName = (reservation as Record<string, unknown>).guest_name as string
  const numGuests = (reservation as Record<string, unknown>).num_guests as number

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {t('checkinTitle')}
      </h1>
      <CheckinWizard
        reservationId={result.data.reservation_id}
        guestName={guestName ?? ''}
        numGuests={numGuests ?? 1}
        token={token}
      />
    </div>
  )
}
