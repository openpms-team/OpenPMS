import { NextRequest } from 'next/server'
import { authenticateAPIKey, apiSuccess, apiError } from '@/lib/api/auth-middleware'
import { createClient } from '@/lib/supabase/server'
import { reservationInsertSchema } from '@/lib/validators/reservation'

export async function GET(request: NextRequest) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)))
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const propertyId = searchParams.get('property_id')
  const status = searchParams.get('status')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const supabase = await createClient()

  let countQuery = supabase.from('reservations').select('*', { count: 'exact', head: true })
  let query = supabase.from('reservations').select('*')

  if (propertyId) {
    countQuery = countQuery.eq('property_id', propertyId)
    query = query.eq('property_id', propertyId)
  }
  if (status) {
    countQuery = countQuery.eq('status', status)
    query = query.eq('status', status)
  }
  if (dateFrom) {
    countQuery = countQuery.gte('check_in', dateFrom)
    query = query.gte('check_in', dateFrom)
  }
  if (dateTo) {
    countQuery = countQuery.lte('check_out', dateTo)
    query = query.lte('check_out', dateTo)
  }

  const { count } = await countQuery

  const { data, error } = await query
    .order('check_in', { ascending: false })
    .range(from, to)

  if (error) {
    return apiError('INTERNAL_ERROR', error.message, 500)
  }

  return apiSuccess(data, { page, perPage, total: count ?? 0 })
}

export async function POST(request: NextRequest) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const body = await request.json()
  const parsed = reservationInsertSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return apiError('VALIDATION_ERROR', error.message, 422)
  }

  return apiSuccess(data)
}
