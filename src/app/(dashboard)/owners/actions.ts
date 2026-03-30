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

export async function updateOwnerAction(
  id: string,
  data: { name?: string; email?: string; phone?: string; nif?: string; iban?: string }
) {
  const auth = await requirePermission('owners.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('owners').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/owners')
  return { success: true }
}

export async function deleteOwnerAction(id: string) {
  const auth = await requirePermission('owners.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()

  // Remove property associations first
  await supabase.from('owner_properties').delete().eq('owner_id', id)

  const { error } = await supabase.from('owners').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/owners')
  return { success: true }
}

export async function linkPropertyAction(ownerId: string, propertyId: string, commissionType: string, commissionValue: number) {
  const auth = await requirePermission('owners.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('owner_properties').upsert({
    owner_id: ownerId,
    property_id: propertyId,
    commission_type: commissionType,
    commission_value: commissionValue,
  }, { onConflict: 'owner_id,property_id' })

  if (error) return { error: error.message }

  // Also update property's owner_id
  await supabase.from('properties').update({ owner_id: ownerId }).eq('id', propertyId)

  revalidatePath('/owners')
  revalidatePath('/properties')
  return { success: true }
}

export async function unlinkPropertyAction(ownerId: string, propertyId: string) {
  const auth = await requirePermission('owners.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  await supabase.from('owner_properties').delete().eq('owner_id', ownerId).eq('property_id', propertyId)
  await supabase.from('properties').update({ owner_id: null }).eq('id', propertyId)

  revalidatePath('/owners')
  revalidatePath('/properties')
  return { success: true }
}
