import type { Reservation, ReservationSource } from '@/types/database'
import type { ParsedEvent } from './parser'
import { parseICalString, fetchICalFeed } from './parser'
import { createClient } from '@/lib/supabase/server'
import { hasDateOverlap } from '@/lib/reservations/overlap'

export interface SyncResult {
  created: number
  updated: number
  cancelled: number
  conflicts: Array<{
    event: ParsedEvent
    existingReservation: { id: string; guest_name: string }
  }>
  errors: string[]
}

function mapSource(sourceName: string): ReservationSource {
  if (sourceName === 'airbnb') return 'airbnb'
  if (sourceName === 'booking') return 'booking'
  return 'other'
}

export async function syncICalFeed(
  propertyId: string,
  feedUrl: string,
  sourceName: string
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, cancelled: 0, conflicts: [], errors: [] }
  const source = mapSource(sourceName)

  let events: ParsedEvent[]
  try {
    const icalString = await fetchICalFeed(feedUrl)
    events = parseICalString(icalString)
  } catch (err) {
    result.errors.push(`Failed to fetch/parse feed: ${err instanceof Error ? err.message : String(err)}`)
    return result
  }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('reservations')
    .select('id, external_id, guest_name, check_in, check_out, source, status')
    .eq('property_id', propertyId)
    .in('source', ['airbnb', 'booking', 'other'])
    .neq('status', 'cancelled')

  if (fetchError) {
    result.errors.push(`Failed to fetch existing reservations: ${fetchError.message}`)
    return result
  }

  const imported = (existing ?? []) as Pick<
    Reservation, 'id' | 'external_id' | 'guest_name' | 'check_in' | 'check_out' | 'source' | 'status'
  >[]

  const { data: directReservations } = await supabase
    .from('reservations')
    .select('id, guest_name, check_in, check_out')
    .eq('property_id', propertyId)
    .eq('source', 'direct')
    .neq('status', 'cancelled')

  const directList = (directReservations ?? []) as Pick<Reservation, 'id' | 'guest_name' | 'check_in' | 'check_out'>[]
  const feedUids = new Set<string>()

  for (const event of events) {
    feedUids.add(event.uid)
    const match = imported.find((r) => r.external_id === event.uid)

    if (match) {
      if (match.check_in !== event.startDate || match.check_out !== event.endDate || match.guest_name !== event.summary) {
        try {
          const { error } = await supabase
            .from('reservations')
            .update({ check_in: event.startDate, check_out: event.endDate, guest_name: event.summary, notes: event.description })
            .eq('id', match.id)
          if (error) throw error
          result.updated++
        } catch (err) {
          result.errors.push(`Update failed for ${event.uid}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      continue
    }

    const overlap = directList.find((r) => hasDateOverlap(r.check_in, r.check_out, event.startDate, event.endDate))
    if (overlap) {
      result.conflicts.push({ event, existingReservation: { id: overlap.id, guest_name: overlap.guest_name } })
      continue
    }

    try {
      const { error } = await supabase.from('reservations').insert({
        property_id: propertyId,
        source,
        external_id: event.uid,
        guest_name: event.summary,
        check_in: event.startDate,
        check_out: event.endDate,
        notes: event.description,
        num_guests: 1,
        status: 'confirmed' as const,
        currency: 'EUR',
        paid_amount: 0,
      })
      if (error) throw error
      result.created++
    } catch (err) {
      result.errors.push(`Insert failed for ${event.uid}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const toCancel = imported.filter((r) => r.external_id && !feedUids.has(r.external_id))
  for (const reservation of toCancel) {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' as const, cancelled_at: new Date().toISOString() })
        .eq('id', reservation.id)
      if (error) throw error
      result.cancelled++
    } catch (err) {
      result.errors.push(`Cancel failed for ${reservation.external_id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}
