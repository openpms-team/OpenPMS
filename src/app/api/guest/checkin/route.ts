import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveCheckinGuests } from '@/lib/guests/save-checkin'

interface GuestPayload {
  full_name: string
  email?: string
  phone?: string
  nationality_icao?: string
  date_of_birth?: string
  document_type?: string
  document_number?: string
  document_country?: string
  document_expiry?: string
  is_primary: boolean
}

interface CheckinBody {
  token: string
  guests: GuestPayload[]
}

// Simple in-memory rate limiter (per token, 5 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(token: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(token)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(token, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= 5
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckinBody

    if (!body.token || !Array.isArray(body.guests) || body.guests.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Rate limit per token
    if (!checkRateLimit(body.token)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()

    const { data: link, error: linkError } = await supabase
      .from('checkin_links')
      .select('id, reservation_id, expires_at, reservations(check_in)')
      .eq('token', body.token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 401 })
    }

    // Safely extract check_in from joined reservation
    const reservationData = link.reservations
    const checkInDate = reservationData &&
      typeof reservationData === 'object' &&
      'check_in' in reservationData
      ? String((reservationData as { check_in: string }).check_in)
      : new Date().toISOString().split('T')[0]

    const guestsWithReservation = body.guests.map((g) => ({
      ...g,
      reservation_id: link.reservation_id,
      is_primary: g.is_primary,
    }))

    const { savedGuests, sefBulletins, errors } = await saveCheckinGuests(
      link.reservation_id,
      guestsWithReservation,
      checkInDate,
    )

    if (errors.length > 0 && savedGuests.length === 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 422 })
    }

    return NextResponse.json({ success: true, savedGuests, sefBulletins })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
