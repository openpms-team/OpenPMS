import { createClient } from '@/lib/supabase/server'

interface DateRange {
  propertyIds: string[]
  startDate: string
  endDate: string
}

async function getReservationsInRange(params: DateRange) {
  const supabase = await createClient()
  let query = supabase
    .from('reservations')
    .select('id, property_id, check_in, check_out, num_nights, total_amount, source, status, num_guests, created_at')
    .lte('check_in', params.endDate)
    .gte('check_out', params.startDate)

  if (params.propertyIds.length > 0) {
    query = query.in('property_id', params.propertyIds)
  }

  const { data } = await query
  return data ?? []
}

function daysBetween(start: string, end: string): number {
  return Math.max(0, Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / 86400000
  ))
}

export async function getOccupancyRate(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const active = reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')

  const supabase = await createClient()
  let propQuery = supabase.from('properties').select('id').eq('active', true)
  if (propertyIds.length > 0) propQuery = propQuery.in('id', propertyIds)
  const { data: properties } = await propQuery
  const propCount = properties?.length ?? 1

  const totalDays = daysBetween(startDate, endDate)
  const totalAvailableNights = propCount * totalDays
  if (totalAvailableNights === 0) return 0

  const bookedNights = active.reduce((sum, r) => {
    const overlapStart = r.check_in > startDate ? r.check_in : startDate
    const overlapEnd = r.check_out < endDate ? r.check_out : endDate
    return sum + daysBetween(overlapStart, overlapEnd)
  }, 0)

  return Math.round((bookedNights / totalAvailableNights) * 100)
}

export async function getADR(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const active = reservations.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'no_show' && r.total_amount
  )
  const totalRevenue = active.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
  const totalNights = active.reduce((s, r) => s + (r.num_nights ?? 0), 0)
  return totalNights > 0 ? Math.round((totalRevenue / totalNights) * 100) / 100 : 0
}

export async function getRevPAR(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const totalRevenue = await getTotalRevenue(propertyIds, startDate, endDate)

  const supabase = await createClient()
  let propQuery = supabase.from('properties').select('id').eq('active', true)
  if (propertyIds.length > 0) propQuery = propQuery.in('id', propertyIds)
  const { data: properties } = await propQuery

  const totalDays = daysBetween(startDate, endDate)
  const totalAvailable = (properties?.length ?? 1) * totalDays
  return totalAvailable > 0 ? Math.round((totalRevenue / totalAvailable) * 100) / 100 : 0
}

export async function getTotalRevenue(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  return reservations
    .filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')
    .reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
}

export async function getAverageStayLength(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const active = reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')
  if (active.length === 0) return 0
  const total = active.reduce((s, r) => s + (r.num_nights ?? 0), 0)
  return Math.round((total / active.length) * 10) / 10
}

export async function getCancellationRate(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  if (reservations.length === 0) return 0
  const cancelled = reservations.filter((r) => r.status === 'cancelled').length
  return Math.round((cancelled / reservations.length) * 100)
}

export async function getNoShowRate(
  propertyIds: string[], startDate: string, endDate: string
): Promise<number> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  if (reservations.length === 0) return 0
  const noShow = reservations.filter((r) => r.status === 'no_show').length
  return Math.round((noShow / reservations.length) * 100)
}

export async function getRevenueBySource(
  propertyIds: string[], startDate: string, endDate: string
): Promise<Array<{ source: string; revenue: number }>> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const bySource = new Map<string, number>()
  for (const r of reservations.filter((r) => r.status !== 'cancelled')) {
    const current = bySource.get(r.source) ?? 0
    bySource.set(r.source, current + (Number(r.total_amount) || 0))
  }
  return Array.from(bySource, ([source, revenue]) => ({ source, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getRevenueByProperty(
  propertyIds: string[], startDate: string, endDate: string
): Promise<Array<{ propertyId: string; name: string; revenue: number }>> {
  const supabase = await createClient()
  let query = supabase.from('properties').select('id, name').eq('active', true)
  if (propertyIds.length > 0) query = query.in('id', propertyIds)
  const { data: properties } = await query

  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const byProperty = new Map<string, number>()
  for (const r of reservations.filter((r) => r.status !== 'cancelled')) {
    const current = byProperty.get(r.property_id) ?? 0
    byProperty.set(r.property_id, current + (Number(r.total_amount) || 0))
  }

  return (properties ?? []).map((p) => ({
    propertyId: p.id,
    name: p.name,
    revenue: byProperty.get(p.id) ?? 0,
  })).sort((a, b) => b.revenue - a.revenue)
}

export async function getRevenueTimeline(
  propertyIds: string[], startDate: string, endDate: string
): Promise<Array<{ month: string; revenue: number }>> {
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const byMonth = new Map<string, number>()

  for (const r of reservations.filter((r) => r.status !== 'cancelled')) {
    const month = r.check_out.slice(0, 7)
    const current = byMonth.get(month) ?? 0
    byMonth.set(month, current + (Number(r.total_amount) || 0))
  }

  return Array.from(byMonth, ([month, revenue]) => ({ month, revenue })).sort(
    (a, b) => a.month.localeCompare(b.month)
  )
}

export async function getTopNationalities(
  propertyIds: string[], startDate: string, endDate: string, limit = 10
): Promise<Array<{ nationality: string; count: number }>> {
  const supabase = await createClient()
  const reservations = await getReservationsInRange({ propertyIds, startDate, endDate })
  const resIds = reservations.map((r) => r.id)
  if (resIds.length === 0) return []

  const { data: guests } = await supabase
    .from('guests')
    .select('nationality_icao')
    .in('reservation_id', resIds)
    .not('nationality_icao', 'is', null)

  const byNat = new Map<string, number>()
  for (const g of guests ?? []) {
    if (g.nationality_icao) {
      byNat.set(g.nationality_icao, (byNat.get(g.nationality_icao) ?? 0) + 1)
    }
  }

  return Array.from(byNat, ([nationality, count]) => ({ nationality, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
