import nodemailer from 'nodemailer'
import type { MessageProvider } from './base'

export class SMTPProvider implements MessageProvider {
  readonly channel = 'email' as const
  private config: Record<string, string> = {}

  constructor(config: Record<string, string>) {
    this.config = config
  }

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.host) return { valid: false, error: 'SMTP host is required' }
    if (!config.port) return { valid: false, error: 'SMTP port is required' }
    if (!config.fromEmail) return { valid: false, error: 'From email is required' }
    return { valid: true }
  }

  async send(params: {
    to: string
    subject?: string
    body: string
    html?: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: parseInt(this.config.port),
        secure: this.config.secure === 'true',
        auth: this.config.user
          ? { user: this.config.user, pass: this.config.password }
          : undefined,
      })

      const result = await transporter.sendMail({
        from: `"${this.config.fromName ?? 'OpenPMS'}" <${this.config.fromEmail}>`,
        to: params.to,
        subject: params.subject ?? '',
        text: params.body,
        html: params.html ?? params.body,
      })

      return { success: true, messageId: result.messageId }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'SMTP send failed',
      }
    }
  }
}
