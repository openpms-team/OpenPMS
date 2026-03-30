import { getConfiguredProvider, canUseAI, trackUsage } from '../core'

export async function handleConciergeMessage(
  message: string,
  guestLanguage: string,
  propertyConfig: { name: string; address?: string; wifi_name?: string; wifi_password?: string; door_code?: string; house_rules?: string; check_in_time?: string; check_out_time?: string },
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!(await canUseAI('concierge'))) {
    return 'AI concierge is not available at the moment.'
  }

  const provider = await getConfiguredProvider()
  if (!provider) return 'AI concierge is not configured.'

  const systemPrompt = `You are a friendly concierge for ${propertyConfig.name}${propertyConfig.address ? ` located at ${propertyConfig.address}` : ''}.
Answer guest questions using ONLY the following property information:
${JSON.stringify(propertyConfig, null, 2)}
Rules:
- Respond in ${guestLanguage}
- Be warm, helpful, and concise
- If you don't have the information, say you'll forward the question to the host
- NEVER invent information not in the provided data
- Keep responses under 200 words`

  const historyText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const response = await provider.chat({
    system: systemPrompt,
    user: historyText ? `${historyText}\nuser: ${message}` : message,
  })

  await trackUsage('concierge', { input: response.inputTokens, output: response.outputTokens })
  return response.text
}
