import { createClient } from '@/lib/supabase/server'
import {
  resolveTemplate,
  selectLanguageVersion,
  buildTemplateContext,
} from './template-engine'
import { SMTPProvider } from './smtp'
import { TwilioSMSProvider } from './twilio-sms'
import { WhatsAppProvider } from './whatsapp'

export async function queueMessage(
  reservationId: string,
  templateId: string,
  recipient: string,
  channel: string,
  scheduledAt?: Date
) {
  const supabase = await createClient()

  const { error } = await supabase.from('message_log').insert({
    reservation_id: reservationId,
    template_id: templateId,
    channel,
    recipient,
    status: 'pending',
    sent_at: scheduledAt?.toISOString(),
  })

  if (error) throw error
}

export async function processMessageQueue() {
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from('message_log')
    .select('*, message_templates(*), reservations(*, properties(name, address, wifi_name, wifi_password))')
    .eq('status', 'pending')
    .limit(50)

  if (error || !messages?.length) return []

  // Load provider configs
  const { data: configs } = await supabase
    .from('integration_config')
    .select('type, config, enabled')
    .in('type', ['smtp', 'twilio', 'whatsapp'])

  const configMap = new Map<string, Record<string, string>>()
  for (const c of configs ?? []) {
    if (c.enabled && c.config) {
      configMap.set(c.type, c.config as unknown as Record<string, string>)
    }
  }

  const results: Array<{ id: string; success: boolean; error?: string }> = []

  for (const message of messages) {
    try {
      const template = message.message_templates as {
        body: Record<string, string>
        subject?: Record<string, string>
        channel: string
      } | null
      const reservation = message.reservations as {
        guest_name: string
        check_in: string
        check_out: string
        num_nights: number | null
        total_amount: number | null
        currency: string
        door_code: string | null
        properties: { name: string; address: string | null; wifi_name: string | null; wifi_password: string | null }
      } | null

      if (!template || !reservation) {
        await markFailed(supabase, message.id, 'Missing template or reservation data')
        results.push({ id: message.id, success: false, error: 'Missing data' })
        continue
      }

      const context = buildTemplateContext(
        reservation,
        reservation.properties,
        '',
        'pt'
      )
      const bodyTemplate = selectLanguageVersion(template.body, 'pt')
      const body = resolveTemplate(bodyTemplate, context)
      const subject = template.subject
        ? resolveTemplate(selectLanguageVersion(template.subject, 'pt'), context)
        : undefined

      let sendResult: { success: boolean; messageId?: string; error?: string } = {
        success: false,
        error: 'No provider configured',
      }

      if (template.channel === 'email') {
        const smtpConfig = configMap.get('smtp')
        if (smtpConfig) {
          const provider = new SMTPProvider(smtpConfig)
          sendResult = await provider.send({ to: message.recipient, subject, body })
        }
      } else if (template.channel === 'sms') {
        const twilioConfig = configMap.get('twilio')
        if (twilioConfig) {
          const provider = new TwilioSMSProvider(twilioConfig)
          sendResult = await provider.send({ to: message.recipient, body })
        }
      } else if (template.channel === 'whatsapp') {
        const waConfig = configMap.get('whatsapp')
        if (waConfig) {
          const provider = new WhatsAppProvider(waConfig)
          sendResult = await provider.send({ to: message.recipient, body })
        }
      }

      if (sendResult.success) {
        await supabase
          .from('message_log')
          .update({ status: 'sent', sent_at: new Date().toISOString(), body })
          .eq('id', message.id)
      } else {
        await markFailed(supabase, message.id, sendResult.error ?? 'Send failed')
      }

      results.push({ id: message.id, ...sendResult })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      await markFailed(supabase, message.id, errMsg)
      results.push({ id: message.id, success: false, error: errMsg })
    }
  }

  return results
}

async function markFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  messageId: string,
  errorMessage: string
) {
  await supabase
    .from('message_log')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', messageId)
}
