import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTouristTax } from '@/lib/taxes/calculator'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      reservationId: string
      guests?: Array<{ age: number; nationality: string; exemptions?: string[] }>
    }

    if (!body.reservationId) {
      return NextResponse.json({ error: 'reservationId required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, property_id, check_in, check_out, num_guests, properties(tax_jurisdiction_id)')
      .eq('id', body.reservationId)
      .single()

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const jurisdictionId = (reservation.properties as unknown as { tax_jurisdiction_id: string | null })?.tax_jurisdiction_id

    if (!jurisdictionId) {
      return NextResponse.json({ data: { totalAmount: 0, breakdown: [], message: 'No tax jurisdiction configured' } })
    }

    const { data: jurisdiction } = await supabase
      .from('tax_jurisdictions')
      .select('name')
      .eq('id', jurisdictionId)
      .single()

    const { data: rules } = await supabase
      .from('tax_rules')
      .select('*')
      .eq('jurisdiction_id', jurisdictionId)
      .order('priority', { ascending: false })

    const { data: exemptions } = await supabase
      .from('tax_exemptions')
      .select('*')
      .eq('jurisdiction_id', jurisdictionId)

    const guests = body.guests ?? Array.from({ length: reservation.num_guests }, () => ({
      age: 30,
      nationality: 'UNK',
    }))

    const result = calculateTouristTax(
      {
        reservationId: body.reservationId,
        propertyId: reservation.property_id,
        jurisdictionId,
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        guests,
      },
      (rules ?? []).map((r) => ({
        id: r.id,
        rate_amount: Number(r.rate_amount),
        rate_type: r.rate_type,
        season_start: r.season_start,
        season_end: r.season_end,
        max_nights: r.max_nights,
        min_guest_age: r.min_guest_age,
        priority: r.priority,
      })),
      (exemptions ?? []).map((e) => ({
        type: e.type,
        description: e.description,
        condition_json: e.condition_json as Record<string, unknown>,
      })),
      jurisdiction?.name ?? ''
    )

    // Save to tax_calculations table
    await supabase.from('tax_calculations').upsert({
      reservation_id: body.reservationId,
      jurisdiction_id: jurisdictionId,
      taxable_nights: result.nightsTaxable,
      taxable_guests: result.guestsTaxable,
      tax_amount: result.totalAmount,
      breakdown: result.breakdown,
    }, { onConflict: 'reservation_id' })

    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Calculation failed' },
      { status: 500 }
    )
  }
}
