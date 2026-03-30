import type { ReservationInsert } from '@/types/database'
import type { ChannelManagerBridge, ExternalReservation } from './base'

export class Beds24Adapter implements ChannelManagerBridge {
  readonly name = 'Beds24'
  readonly id = 'beds24'

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    if (!config.propertyId)
      return { valid: false, error: 'Property ID is required' }
    return { valid: true }
  }

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch(
        'https://beds24.com/api/v2/properties',
        {
          headers: {
            token: config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      )
      return response.ok
    } catch {
      return false
    }
  }

  async fetchReservations(
    config: Record<string, string>,
    since: Date
  ): Promise<ExternalReservation[]> {
    const response = await fetch(
      `https://beds24.com/api/v2/bookings?propertyId=${config.propertyId}&arrivalFrom=${since.toISOString().split('T')[0]}`,
      {
        headers: {
          token: config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) throw new Error(`Beds24 API error: ${response.status}`)

    const data = (await response.json()) as Array<{
      id: string
      guestFirstName?: string
      guestName?: string
      guestEmail?: string
      guestPhone?: string
      arrival: string
      departure: string
      numAdult?: number
      price?: number
      status?: string
    }>

    return data.map((booking) => ({
      externalId: String(booking.id),
      guestName:
        [booking.guestFirstName, booking.guestName].filter(Boolean).join(' ') ||
        'Guest',
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkIn: new Date(booking.arrival),
      checkOut: new Date(booking.departure),
      numGuests: booking.numAdult,
      totalAmount: booking.price,
      currency: 'EUR',
      status: booking.status ?? 'confirmed',
      rawData: booking as unknown as Record<string, unknown>,
    }))
  }

  mapToReservation(external: ExternalReservation): Partial<ReservationInsert> {
    return {
      source: 'other',
      external_id: external.externalId,
      guest_name: external.guestName,
      guest_email: external.guestEmail ?? undefined,
      guest_phone: external.guestPhone ?? undefined,
      check_in: external.checkIn.toISOString().split('T')[0],
      check_out: external.checkOut.toISOString().split('T')[0],
      num_guests: external.numGuests ?? 1,
      total_amount: external.totalAmount,
      currency: external.currency ?? 'EUR',
      status: 'confirmed',
    }
  }
}
