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

  // Try to send to configured external invoicing provider
  try {
    const { data: config } = await supabase
      .from('integration_config')
      .select('type, config, enabled')
      .in('type', ['moloni', 'invoicexpress'])
      .eq('enabled', true)
      .single()

    if (config) {
      const providerConfig = typeof config.config === 'string'
        ? JSON.parse(config.config) as Record<string, string>
        : config.config as Record<string, string>

      if (config.type === 'moloni') {
        const { MoloniAdapter } = await import('@/lib/integrations/invoicing/moloni')
        const adapter = new MoloniAdapter()
        const result = await adapter.createInvoice(providerConfig, {
          clientName: reservation.guest_name,
          clientNIF: '',
          clientCountry: 'PT',
          date: new Date(),
          lines: [
            { description: `Alojamento — ${reservation.check_in} a ${reservation.check_out}`, quantity: 1, unitPrice: accommodationAmount, taxRate: 0.06 },
            { description: 'Taxa Turística Municipal', quantity: 1, unitPrice: taxAmount, taxRate: 0, taxExemptionCode: 'M07' },
          ],
          reservationRef: reservationId,
        })
        await supabase
          .from('invoices')
          .update({
            external_id: result.externalId,
            provider: 'moloni',
            status: result.status === 'draft' ? 'draft' : 'issued',
          })
          .eq('id', invoice.id)
      } else if (config.type === 'invoicexpress') {
        const { InvoiceXpressAdapter } = await import('@/lib/integrations/invoicing/invoicexpress')
        const adapter = new InvoiceXpressAdapter()
        const result = await adapter.createInvoice(providerConfig, {
          clientName: reservation.guest_name,
          clientCountry: 'PT',
          date: new Date(),
          lines: [
            { description: `Alojamento — ${reservation.check_in} a ${reservation.check_out}`, quantity: 1, unitPrice: accommodationAmount, taxRate: 0.06 },
            { description: 'Taxa Turística Municipal', quantity: 1, unitPrice: taxAmount, taxRate: 0, taxExemptionCode: 'M07' },
          ],
          reservationRef: reservationId,
        })
        await supabase
          .from('invoices')
          .update({
            external_id: result.externalId,
            provider: 'invoicexpress',
          })
          .eq('id', invoice.id)
      }
    }
  } catch {
    // External provider is best-effort, local invoice already saved
  }

  revalidatePath('/finance/invoices')
  return { data: invoice }
}
