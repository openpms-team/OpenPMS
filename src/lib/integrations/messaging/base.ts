export interface MessageProvider {
  readonly channel: 'email' | 'sms' | 'whatsapp'
  validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }>
  send(params: {
    to: string
    subject?: string
    body: string
    html?: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }>
}
