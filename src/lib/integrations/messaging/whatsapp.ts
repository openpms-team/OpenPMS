import type { MessageProvider } from './base'

export class WhatsAppProvider implements MessageProvider {
  readonly channel = 'whatsapp' as const
  private config: Record<string, string>

  constructor(config: Record<string, string>) {
    this.config = config
  }

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.accessToken) return { valid: false, error: 'Access token is required' }
    if (!config.phoneNumberId) return { valid: false, error: 'Phone number ID is required' }
    return { valid: true }
  }

  async send(params: {
    to: string
    body: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: params.to,
          type: 'text',
          text: { body: params.body },
        }),
      })

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>
        error?: { message: string }
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message ?? 'WhatsApp API error',
        }
      }

      return { success: true, messageId: data.messages?.[0]?.id }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'WhatsApp send failed',
      }
    }
  }
}
