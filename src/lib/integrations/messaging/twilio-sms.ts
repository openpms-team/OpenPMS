import type { MessageProvider } from './base'

export class TwilioSMSProvider implements MessageProvider {
  readonly channel = 'sms' as const
  private config: Record<string, string>

  constructor(config: Record<string, string>) {
    this.config = config
  }

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.accountSid) return { valid: false, error: 'Account SID is required' }
    if (!config.authToken) return { valid: false, error: 'Auth token is required' }
    if (!config.fromNumber) return { valid: false, error: 'From number is required' }
    return { valid: true }
  }

  async send(params: {
    to: string
    body: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`
      const auth = Buffer.from(
        `${this.config.accountSid}:${this.config.authToken}`
      ).toString('base64')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: params.to,
          From: this.config.fromNumber,
          Body: params.body,
        }),
      })

      const data = (await response.json()) as { sid?: string; message?: string }

      if (!response.ok) {
        return { success: false, error: data.message ?? 'Twilio API error' }
      }

      return { success: true, messageId: data.sid }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'SMS send failed',
      }
    }
  }
}
