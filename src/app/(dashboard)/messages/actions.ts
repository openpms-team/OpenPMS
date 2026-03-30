'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'

export async function createTemplateAction(data: Record<string, unknown>) {
  const auth = await requirePermission('messages.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('message_templates')
    .insert(data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { data: created }
}

export async function updateTemplateAction(id: string, data: Record<string, unknown>) {
  const auth = await requirePermission('messages.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('message_templates')
    .update(data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
}

export async function toggleTemplateActiveAction(id: string, currentActive: boolean) {
  const auth = await requirePermission('messages.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('message_templates')
    .update({ active: !currentActive })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
}
