import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { GuestsTabs } from './GuestsTabs'

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

export default async function GuestsPage() {
  const t = await getTranslations('guests')

  let guests: GuestRow[] = []
  let bulletins: SefBulletinRow[] = []

  try {
    const supabase = await createClient()
    const [guestsResult, bulletinsResult] = await Promise.all([
      supabase
        .from('guests')
        .select('id, full_name, nationality_icao, reservations(id, guest_name, check_in)')
        .order('created_at', { ascending: false }),
      supabase
        .from('sef_bulletins')
        .select('id, status, deadline, guests(id, full_name, nationality_icao), reservations(id, check_in)')
        .order('deadline', { ascending: true }),
    ])

    if (guestsResult.data) guests = guestsResult.data as unknown as GuestRow[]
    if (bulletinsResult.data) bulletins = bulletinsResult.data as unknown as SefBulletinRow[]
  } catch {
    // RLS or connection error — empty state shown
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
      <GuestsTabs guests={guests} bulletins={bulletins} />
    </div>
  )
}
