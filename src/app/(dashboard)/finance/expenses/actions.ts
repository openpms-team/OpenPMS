'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'

export async function createExpenseAction(data: {
  property_id?: string
  category: string
  description: string
  amount: number
  date: string
}) {
  const auth = await requirePermission('finance.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').insert({
    property_id: data.property_id || null,
    category: data.category,
    description: data.description,
    amount: data.amount,
    date: data.date,
  })

  if (error) return { error: error.message }

  revalidatePath('/finance/expenses')
  return { success: true }
}
