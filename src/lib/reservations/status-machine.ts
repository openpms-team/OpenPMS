import type { ReservationStatus } from '@/types/database'

const transitions: Record<ReservationStatus, ReservationStatus[]> = {
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
}

export function getAllowedTransitions(
  currentStatus: ReservationStatus
): ReservationStatus[] {
  return transitions[currentStatus] ?? []
}

export function isValidTransition(
  from: ReservationStatus,
  to: ReservationStatus
): boolean {
  return transitions[from]?.includes(to) ?? false
}
