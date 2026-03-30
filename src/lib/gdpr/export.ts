import { createClient } from '@/lib/supabase/server'

export async function exportGuestData(guestId: string) {
  const supabase = await createClient()

  const { data: guest } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single()

  if (!guest) throw new Error('Guest not found')

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, property_id, check_in, check_out, status')
    .eq('id', guest.reservation_id)
    .single()

  const { data: sefBulletins } = await supabase
    .from('sef_bulletins')
    .select('id, status, method, submitted_at, deadline')
    .eq('guest_id', guestId)

  const { data: messages } = await supabase
    .from('message_log')
    .select('id, channel, status, sent_at')
    .eq('reservation_id', guest.reservation_id)

  return {
    exportDate: new Date().toISOString(),
    guest: {
      id: guest.id,
      full_name: guest.full_name,
      email: guest.email,
      phone: guest.phone,
      date_of_birth: guest.date_of_birth,
      nationality_icao: guest.nationality_icao,
      document_type: guest.document_type,
      document_number: guest.document_number,
      document_country: guest.document_country,
      address: guest.address,
      checkin_completed_at: guest.checkin_completed_at,
      created_at: guest.created_at,
    },
    reservation,
    sefBulletins: sefBulletins ?? [],
    messages: messages ?? [],
  }
}
