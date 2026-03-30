import type { ReservationInsert } from '@/types/database'

export interface ExternalReservation {
  externalId: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  checkIn: Date
  checkOut: Date
  numGuests?: number
  totalAmount?: number
  currency?: string
  status: string
  rawData: Record<string, unknown>
}

export interface ChannelManagerBridge {
  readonly name: string
  readonly id: string
  validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }>
  testConnection(config: Record<string, string>): Promise<boolean>
  fetchReservations(
    config: Record<string, string>,
    since: Date
  ): Promise<ExternalReservation[]>
  mapToReservation(external: ExternalReservation): Partial<ReservationInsert>
}
