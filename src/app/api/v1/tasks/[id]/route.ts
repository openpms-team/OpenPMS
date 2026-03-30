import { NextRequest } from 'next/server'
import { authenticateAPIKey, apiSuccess, apiError } from '@/lib/api/auth-middleware'
import { createClient } from '@/lib/supabase/server'
import { taskUpdateSchema } from '@/lib/validators/task'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return apiError('NOT_FOUND', 'Task not found', 404)
  }

  return apiSuccess(data)
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const result = await authenticateAPIKey(request)
  if ('error' in result) return result.error

  const { id } = await params
  const body = await request.json()
  const parsed = taskUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return apiError('NOT_FOUND', 'Task not found', 404)
  }

  return apiSuccess(data)
}
