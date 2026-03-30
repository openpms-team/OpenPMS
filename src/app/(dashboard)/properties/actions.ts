'use server'

import { revalidatePath } from 'next/cache'
import { propertyInsertSchema, propertyUpdateSchema } from '@/lib/validators/property'
import { requirePermission } from '@/lib/auth/require-permission'
import {
  createProperty as createPropertyQuery,
  updateProperty as updatePropertyQuery,
  deleteProperty as deletePropertyQuery,
} from '@/lib/supabase/queries/properties'

export async function createPropertyAction(formData: unknown) {
  const auth = await requirePermission('properties.write')
  if (!auth.authorized) return { error: auth.error }

  const parsed = propertyInsertSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  try {
    const property = await createPropertyQuery(parsed.data)
    revalidatePath('/properties')
    return { data: property }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create property'
    return { error: message }
  }
}

export async function updatePropertyAction(id: string, formData: unknown) {
  const auth = await requirePermission('properties.write')
  if (!auth.authorized) return { error: auth.error }

  const parsed = propertyUpdateSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  try {
    const property = await updatePropertyQuery(id, parsed.data)
    revalidatePath('/properties')
    revalidatePath(`/properties/${id}`)
    return { data: property }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update property'
    return { error: message }
  }
}

export async function deletePropertyAction(id: string) {
  const auth = await requirePermission('properties.write')
  if (!auth.authorized) return { error: auth.error }

  try {
    await deletePropertyQuery(id)
    revalidatePath('/properties')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete property'
    return { error: message }
  }
}
