'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'

export async function createOwnerAction(data: {
  name: string
  email: string
  phone?: string
  nif?: string
  iban?: string
}) {
  const auth = await requirePermission('owners.write')
  if (!auth.authorized) return { error: auth.error }

  if (!data.name?.trim()) return { error: 'O nome é obrigatório' }
  if (!data.email?.trim()) return { error: 'O email é obrigatório' }

  const supabase = await createClient()
  const { error } = await supabase.from('owners').insert({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    nif: data.nif || null,
    iban: data.iban || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/owners')
  return { success: true }
}
