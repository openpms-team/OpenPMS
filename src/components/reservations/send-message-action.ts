'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'
import { revalidatePath } from 'next/cache'

export async function sendManualMessageAction(reservationId: string, templateId: string) {
  const auth = await requirePermission('messages.send')
  if (!auth.authorized) return { error: auth.error }

  const supabase = await createClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('guest_email')
    .eq('id', reservationId)
    .single()

  if (!reservation?.guest_email) return { error: 'Hóspede sem email' }

  const { data: template } = await supabase
    .from('message_templates')
    .select('channel')
    .eq('id', templateId)
    .single()

  if (!template) return { error: 'Modelo não encontrado' }

  const { error } = await supabase.from('message_log').insert({
    reservation_id: reservationId,
    template_id: templateId,
    channel: template.channel,
    recipient: reservation.guest_email,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath(`/reservations/${reservationId}`)
  return { success: true }
}
