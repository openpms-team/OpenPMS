import { createClient } from '@/lib/supabase/server'
import type { Reservation } from '@/types/database'

export interface OverlapCheck {
  propertyId: string
  checkIn: string
  checkOut: string
  excludeReservationId?: string
}

export interface OverlapResult {
  hasOverlap: boolean
  conflicts: Pick<Reservation, 'id' | 'guest_name' | 'check_in' | 'check_out'>[]
}

/**
 * Check if a date range overlaps with existing reservations for a property.
 * Same-day turnover is allowed: guest A checks out on day X, guest B checks in on day X.
 * So overlap is: existing.check_in < newCheckOut AND existing.check_out > newCheckIn
 */
export async function checkOverlap(params: OverlapCheck): Promise<OverlapResult> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('id, guest_name, check_in, check_out')
    .eq('property_id', params.propertyId)
    .neq('status', 'cancelled')
    .neq('status', 'no_show')
    .lt('check_in', params.checkOut)
    .gt('check_out', params.checkIn)

  if (params.excludeReservationId) {
    query = query.neq('id', params.excludeReservationId)
  }

  const { data, error } = await query

  if (error) throw error

  const conflicts = (data ?? []) as Pick<
    Reservation,
    'id' | 'guest_name' | 'check_in' | 'check_out'
  >[]

  return {
    hasOverlap: conflicts.length > 0,
    conflicts,
  }
}

/**
 * Pure function version for testing without database
 */
export function hasDateOverlap(
  existingCheckIn: string,
  existingCheckOut: string,
  newCheckIn: string,
  newCheckOut: string
): boolean {
  return existingCheckIn < newCheckOut && existingCheckOut > newCheckIn
}
