import { NextRequest } from 'next/server'
import { authenticateAPIKey, apiSuccess, apiError } from '@/lib/api/auth-middleware'
import { createClient } from '@/lib/supabase/server'
import { propertyUpdateSchema } from '@/lib/validators/property'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return apiError('NOT_FOUND', 'Property not found', 404)
  }

  return apiSuccess(data)
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { id } = await params
  const body = await request.json()
  const parsed = propertyUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return apiError('NOT_FOUND', 'Property not found', 404)
  }

  return apiSuccess(data)
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) {
    return apiError('DELETE_FAILED', error.message, 422)
  }

  return apiSuccess({ deleted: true })
}
