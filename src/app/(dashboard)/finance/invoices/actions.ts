'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'

export async function createInvoiceAction(reservationId: string) {
  const auth = await requirePermission('finance.write')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()

  // Get reservation data
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, guest_name, guest_email, total_amount, currency, check_in, check_out, num_nights, property_id, properties(name, tax_jurisdiction_id)')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reservation not found' }

  // Get tax calculation if exists
  const { data: taxCalc } = await supabase
    .from('tax_calculations')
    .select('tax_amount')
    .eq('reservation_id', reservationId)
    .single()

  const accommodationAmount = Number(reservation.total_amount) || 0
  const taxAmount = Number(taxCalc?.tax_amount) || 0

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      reservation_id: reservationId,
      provider: 'manual',
      customer_name: reservation.guest_name,
      customer_nif: '',
      net_amount: accommodationAmount,
      tax_amount: taxAmount,
      total_amount: accommodationAmount + taxAmount,
      currency: reservation.currency,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/finance/invoices')
  return { data: invoice }
}
