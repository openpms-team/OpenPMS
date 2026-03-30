import { createClient } from '@/lib/supabase/server'
import { guestSchema } from '@/lib/validators/guest'
import { calculateSIBADeadline } from '@/lib/integrations/sef/deadline'
import type { GuestInsert } from '@/types/database'

interface CheckinGuestInput {
  reservation_id: string
  is_primary: boolean
  full_name: string
  email?: string
  phone?: string
  nationality_icao?: string
  date_of_birth?: string
  document_type?: string
  document_number?: string
  document_country?: string
  document_expiry?: string
  address?: string
  signature?: string
}

export async function saveCheckinGuests(
  reservationId: string,
  guests: CheckinGuestInput[],
  checkInDate: string
) {
  const supabase = await createClient()
  const savedGuests: string[] = []
  const sefBulletins: string[] = []
  const errors: string[] = []

  for (const guestInput of guests) {
    const parsed = guestSchema.safeParse({
      ...guestInput,
      reservation_id: reservationId,
    })

    if (!parsed.success) {
      errors.push(`${guestInput.full_name}: ${parsed.error.issues[0]?.message}`)
      continue
    }

    const insertData: GuestInsert = {
      ...parsed.data,
      checkin_completed_at: new Date().toISOString(),
    }

    const { data: guest, error } = await supabase
      .from('guests')
      .insert(insertData)
      .select('id, nationality_icao')
      .single()

    if (error) {
      errors.push(`${guestInput.full_name}: ${error.message}`)
      continue
    }

    savedGuests.push(guest.id)

    // Create SEF bulletin for foreign guests
    if (guest.nationality_icao && guest.nationality_icao !== 'PRT') {
      const deadline = calculateSIBADeadline(checkInDate)
      const { error: sefError } = await supabase
        .from('sef_bulletins')
        .insert({
          reservation_id: reservationId,
          guest_id: guest.id,
          status: 'pending',
          method: 'web_service',
          deadline,
        })

      if (sefError) {
        errors.push(`SEF bulletin for ${guestInput.full_name}: ${sefError.message}`)
      } else {
        sefBulletins.push(guest.id)
      }
    }
  }

  // Update reservation status to checked_in if all guests saved
  if (errors.length === 0 && savedGuests.length === guests.length) {
    await supabase
      .from('reservations')
      .update({ status: 'checked_in' })
      .eq('id', reservationId)
  }

  return { savedGuests, sefBulletins, errors }
}
