'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'

export async function createWebhookAction(url: string, events: string[]) {
  const auth = await requirePermission('settings.manage')
  if (!auth.authorized) return { error: auth.error }

  const secret = crypto.randomBytes(32).toString('hex')
  const supabase = await createClient()

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', auth.userId)
    .single()

  const { error } = await supabase.from('webhooks').insert({
    staff_id: staff?.id,
    url,
    events,
    secret,
    active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings/integrations/api')
  return { success: true }
}

export async function deleteWebhookAction(id: string) {
  const auth = await requirePermission('settings.manage')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('webhooks').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings/integrations/api')
  return { success: true }
}
