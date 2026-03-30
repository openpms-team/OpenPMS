import { getTranslations } from 'next-intl/server'
import { getProperties } from '@/lib/supabase/queries/properties'
import { ReservationForm } from '@/components/reservations/reservation-form'

export default async function NewReservationPage() {
  const t = await getTranslations('reservations')
  const properties = await getProperties()

  const propertyOptions = properties.map((p) => ({
    id: p.id,
    name: p.name,
    max_guests: p.max_guests,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('addNew')}</h2>
      <ReservationForm properties={propertyOptions} />
    </div>
  )
}
