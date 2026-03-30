'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'

export async function updateStaffRoleAction(staffId: string, newRole: string) {
  const auth = await requirePermission('team.read')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('staff').update({ role: newRole }).eq('id', staffId)
  if (error) return { error: error.message }

  revalidatePath('/team')
  return { success: true }
}

export async function toggleStaffActiveAction(staffId: string, currentActive: boolean) {
  const auth = await requirePermission('team.read')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('staff').update({ active: !currentActive }).eq('id', staffId)
  if (error) return { error: error.message }

  revalidatePath('/team')
  return { success: true }
}
