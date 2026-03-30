import type { ReservationInsert } from '@/types/database'
import type { ChannelManagerBridge, ExternalReservation } from './base'

export class CloudbedsAdapter implements ChannelManagerBridge {
  readonly name = 'Cloudbeds'
  readonly id = 'cloudbeds'

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.accessToken)
      return { valid: false, error: 'Access token is required' }
    if (!config.propertyId)
      return { valid: false, error: 'Property ID is required' }
    return { valid: true }
  }

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch(
        'https://hotels.cloudbeds.com/api/v1.1/getHotelDetails',
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
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
      `https://hotels.cloudbeds.com/api/v1.1/getReservations?propertyID=${config.propertyId}&checkInFrom=${since.toISOString().split('T')[0]}`,
      {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      }
    )

    if (!response.ok) throw new Error(`Cloudbeds API error: ${response.status}`)

    const json = (await response.json()) as {
      data: Array<{
        reservationID: string
        guestName: string
        guestEmail?: string
        guestPhone?: string
        startDate: string
        endDate: string
        adults?: number
        total?: number
        status?: string
      }>
    }

    return json.data.map((res) => ({
      externalId: res.reservationID,
      guestName: res.guestName,
      guestEmail: res.guestEmail,
      guestPhone: res.guestPhone,
      checkIn: new Date(res.startDate),
      checkOut: new Date(res.endDate),
      numGuests: res.adults,
      totalAmount: res.total,
      currency: 'EUR',
      status: res.status ?? 'confirmed',
      rawData: res as unknown as Record<string, unknown>,
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
