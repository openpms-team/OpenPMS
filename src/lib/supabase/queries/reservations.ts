import { createClient } from '@/lib/supabase/server'
import type { Reservation, ReservationInsert, ReservationUpdate } from '@/types/database'

export interface ReservationFilters {
  propertyId?: string
  status?: string[]
  dateFrom?: string
  dateTo?: string
  source?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getReservations(filters: ReservationFilters = {}) {
  const supabase = await createClient()
  const { page = 1, perPage = 20, sortBy = 'check_in', sortOrder = 'desc' } = filters

  let query = supabase
    .from('reservations')
    .select('*, properties(name)', { count: 'exact' })

  if (filters.propertyId) {
    query = query.eq('property_id', filters.propertyId)
  }
  if (filters.status?.length) {
    query = query.in('status', filters.status)
  }
  if (filters.dateFrom) {
    query = query.gte('check_in', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('check_out', filters.dateTo)
  }
  if (filters.source) {
    query = query.eq('source', filters.source)
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (error) throw error

  return {
    reservations: (data ?? []) as (Reservation & { properties: { name: string } })[],
    total: count ?? 0,
    page,
    perPage,
  }
}

export async function getReservation(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, properties(name, tax_jurisdiction_id, max_guests)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Reservation & { properties: { name: string; tax_jurisdiction_id: string | null; max_guests: number } }
}

export async function createReservation(data: ReservationInsert) {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('reservations')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return result as Reservation
}

export async function updateReservation(id: string, data: ReservationUpdate) {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('reservations')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result as Reservation
}

export async function getCalendarReservations(
  year: number,
  month: number,
  propertyIds?: string[]
) {
  const supabase = await createClient()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  let query = supabase
    .from('reservations')
    .select('id, property_id, guest_name, check_in, check_out, status, num_guests')
    .neq('status', 'cancelled')
    .lte('check_in', endDate)
    .gte('check_out', startDate)

  if (propertyIds?.length) {
    query = query.in('property_id', propertyIds)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Pick<Reservation, 'id' | 'property_id' | 'guest_name' | 'check_in' | 'check_out' | 'status' | 'num_guests'>[]
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = `${today.slice(0, 7)}-01`
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const [
    propertiesResult,
    activeResult,
    checkinsResult,
    checkedInResult,
    upcomingCheckinsResult,
    upcomingCheckoutsResult,
    revenueResult,
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'checked_in']),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('check_in', today).eq('status', 'confirmed'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'checked_in'),
    supabase.from('reservations').select('id, guest_name, check_in, properties(name)').eq('status', 'confirmed').gte('check_in', today).lte('check_in', weekFromNow).order('check_in').limit(5),
    supabase.from('reservations').select('id, guest_name, check_out, properties(name)').eq('status', 'checked_in').gte('check_out', today).lte('check_out', weekFromNow).order('check_out').limit(5),
    supabase.from('reservations').select('total_amount').eq('status', 'checked_out').gte('check_out', monthStart).lte('check_out', today),
  ])

  const totalProperties = propertiesResult.count ?? 0
  const checkedInCount = checkedInResult.count ?? 0
  const occupancyRate = totalProperties > 0
    ? Math.round((checkedInCount / totalProperties) * 100)
    : 0

  const revenueThisMonth = (revenueResult.data ?? []).reduce(
    (sum, r) => sum + (Number((r as { total_amount: number | null }).total_amount) || 0),
    0
  )

  return {
    totalProperties,
    activeReservations: activeResult.count ?? 0,
    checkinsToday: checkinsResult.count ?? 0,
    occupancyRate,
    upcomingCheckins: upcomingCheckinsResult.data ?? [],
    upcomingCheckouts: upcomingCheckoutsResult.data ?? [],
    revenueThisMonth,
  }
}
