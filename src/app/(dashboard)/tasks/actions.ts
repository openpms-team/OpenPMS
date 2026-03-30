'use server'

import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'
import { taskInsertSchema, taskUpdateSchema } from '@/lib/validators/task'
import { dispatchWebhook } from '@/lib/webhooks/dispatch'

const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled'])

export async function createTaskAction(formData: unknown) {
  const auth = await requirePermission('tasks.write')
  if (!auth.authorized) return { error: auth.error }

  const parsed = taskInsertSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  return { data }
}

export async function updateTaskAction(id: string, formData: unknown) {
  const auth = await requirePermission('tasks.write')
  if (!auth.authorized) return { error: auth.error }

  const parsed = taskUpdateSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  return { data }
}

export async function updateTaskStatusAction(
  id: string,
  status: unknown
) {
  const auth = await requirePermission('tasks.own')
  if (!auth.authorized) return { error: auth.error }

  const parsed = taskStatusSchema.safeParse(status)
  if (!parsed.success) return { error: 'Invalid status value' }

  const supabase = await createClient()
  const updateData: Record<string, unknown> = { status: parsed.data }
  if (parsed.data === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }

  const eventName = parsed.data === 'completed' ? 'task.completed' : 'task.created'
  dispatchWebhook(eventName, { taskId: id, status: parsed.data }).catch(() => {})

  revalidatePath('/tasks')
  return { success: true }
}

export async function updateChecklistItemAction(
  taskId: string,
  checklist: Array<{ item: string; done: boolean }>
) {
  const auth = await requirePermission('tasks.own')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ checklist })
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  return { success: true }
}
