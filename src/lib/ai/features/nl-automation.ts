import { getConfiguredProvider, canUseAI, trackUsage } from '../core'
import type { AutomationCondition } from '@/lib/messaging/automation'

export interface ParsedRule {
  triggers: Array<{ event: string; conditions: AutomationCondition[] }>
  actions: Array<{ type: string; config: Record<string, unknown> }>
  explanation: string
}

const SYSTEM_PROMPT = `Parse this automation rule into structured JSON. Available triggers: booking_confirmed, pre_checkin, checkin_day, during_stay, pre_checkout, post_checkout, review_request. Available conditions: num_guests (gt/lt/eq), num_nights (gt/lt/eq), guest_language (eq/neq), source (eq/in), total_amount (gt/lt), property_id (eq/in). Available actions: send_email, send_sms, send_whatsapp, create_task.

Return JSON: { triggers: [{ event, conditions: [{ field, operator, value }] }], actions: [{ type, config: { ... } }], explanation: "human readable summary" }`

export async function parseAutomationRule(naturalLanguageRule: string): Promise<ParsedRule> {
  if (!(await canUseAI('nl_automation'))) {
    throw new Error('NL automation feature is not enabled')
  }

  const provider = await getConfiguredProvider()
  if (!provider) throw new Error('AI provider not configured')

  const response = await provider.chat({
    system: SYSTEM_PROMPT,
    user: naturalLanguageRule,
  })

  await trackUsage('nl_automation', { input: response.inputTokens, output: response.outputTokens })

  const jsonMatch = response.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse automation rule')

  return JSON.parse(jsonMatch[0])
}
