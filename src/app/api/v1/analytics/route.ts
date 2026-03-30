import { NextRequest } from 'next/server'
import { authenticateAPIKey, apiSuccess, apiError } from '@/lib/api/auth-middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const propertyIds = searchParams.get('properties')

  if (!start || !end) {
    return apiError('VALIDATION_ERROR', 'start and end query params are required', 400)
  }

  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('*')
    .gte('check_in', start)
    .lte('check_out', end)
    .neq('status', 'cancelled')

  if (propertyIds) {
    const ids = propertyIds.split(',')
    query = query.in('property_id', ids)
  }

  const { data: reservations, error } = await query

  if (error) {
    return apiError('INTERNAL_ERROR', error.message, 500)
  }

  const records = reservations ?? []
  let totalNights = 0
  let totalRevenue = 0
  let totalRoomNights = 0

  for (const r of records) {
    const checkIn = new Date(r.check_in as string)
    const checkOut = new Date(r.check_out as string)
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000))
    totalNights += nights
    totalRevenue += (r.total_amount as number) ?? 0
  }

  // Count distinct properties to estimate available room-nights
  const propertySet = new Set(records.map((r) => r.property_id as string))
  const daySpan = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000)
  )
  totalRoomNights = Math.max(propertySet.size, 1) * daySpan

  const occupancy = totalRoomNights > 0 ? Math.round((totalNights / totalRoomNights) * 10000) / 100 : 0
  const adr = totalNights > 0 ? Math.round((totalRevenue / totalNights) * 100) / 100 : 0
  const revpar = totalRoomNights > 0 ? Math.round((totalRevenue / totalRoomNights) * 100) / 100 : 0

  return apiSuccess({
    occupancy,
    adr,
    revpar,
    revenue: Math.round(totalRevenue * 100) / 100,
    total_nights: totalNights,
    total_reservations: records.length,
    period: { start, end },
  })
}
