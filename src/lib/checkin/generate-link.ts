import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url').slice(0, 32)
}

export async function generateCheckinLink(
  reservationId: string,
  baseUrl: string
): Promise<{ token: string; url: string; expiresAt: string }> {
  const supabase = await createClient()

  // Get reservation check-in date for expiry calculation
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('check_in')
    .eq('id', reservationId)
    .single()

  if (resError || !reservation) {
    throw new Error('Reservation not found')
  }

  // Revoke previous links for this reservation
  await supabase
    .from('checkin_links')
    .delete()
    .eq('reservation_id', reservationId)

  // Generate new link with expiry = check_in + 7 days
  const checkInDate = new Date(reservation.check_in)
  const expiresAt = new Date(checkInDate.getTime() + 7 * 24 * 60 * 60 * 1000)

  const token = generateToken()

  const { error } = await supabase.from('checkin_links').insert({
    reservation_id: reservationId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw error

  return {
    token,
    url: `${baseUrl}/guest/${token}`,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function validateToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('checkin_links')
    .select('*, reservations(*, properties(name, check_in_time, check_out_time, wifi_name, wifi_password, door_code, house_rules, guest_portal_config))')
    .eq('token', token)
    .single()

  if (error || !data) return { valid: false, reason: 'not_found' as const }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'expired' as const }
  }

  return { valid: true, data }
}
