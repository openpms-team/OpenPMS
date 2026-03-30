import { createClient } from '@/lib/supabase/server'
import { evaluateAutomationRule, type AutomationRule } from './automation'
import type { Reservation, MessageTemplate } from '@/types/database'

export async function onReservationCreated(reservation: Reservation) {
  return processTriggersForEvent('booking_confirmed', reservation)
}

export async function onReservationStatusChanged(
  reservation: Reservation,
  newStatus: string
) {
  const triggerMap: Record<string, string> = {
    checked_in: 'checkin_day',
    checked_out: 'post_checkout',
  }
  const triggerType = triggerMap[newStatus]
  if (!triggerType) return []
  return processTriggersForEvent(triggerType, reservation)
}

async function processTriggersForEvent(
  triggerType: string,
  reservation: Reservation
) {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('message_templates')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('active', true)

  if (!templates?.length) return []

  const queued: string[] = []

  for (const template of templates as MessageTemplate[]) {
    // Evaluate conditions
    const conditions = template.conditions as unknown as AutomationRule | null
    if (conditions?.conditions?.length) {
      if (!evaluateAutomationRule(conditions, reservation)) continue
    }

    // Queue the message
    const { error } = await supabase.from('message_log').insert({
      reservation_id: reservation.id,
      template_id: template.id,
      channel: template.channel,
      recipient: reservation.guest_email ?? '',
      status: 'pending',
    })

    if (!error) queued.push(template.id)
  }

  return queued
}

export function calculateScheduledTime(
  baseDate: string,
  offsetDays: number,
  offsetHours: number
): Date {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + offsetDays)
  date.setHours(date.getHours() + offsetHours)
  return date
}
