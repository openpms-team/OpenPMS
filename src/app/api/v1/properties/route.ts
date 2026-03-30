import { NextRequest } from 'next/server'
import { authenticateAPIKey, apiSuccess, apiError } from '@/lib/api/auth-middleware'
import { createClient } from '@/lib/supabase/server'
import { propertyInsertSchema } from '@/lib/validators/property'

export async function GET(request: NextRequest) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)))
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
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
  const parsed = propertyInsertSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return apiError('VALIDATION_ERROR', error.message, 422)
  }

  return apiSuccess(data)
}
