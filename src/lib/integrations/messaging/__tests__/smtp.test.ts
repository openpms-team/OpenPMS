import { describe, it, expect } from 'vitest'
import { SMTPProvider } from '../smtp'

describe('SMTPProvider', () => {
  it('validates config — rejects missing host', async () => {
    const provider = new SMTPProvider({})
    const result = await provider.validateConfig({ port: '587', fromEmail: 'a@b.com' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('host')
  })

  it('validates config — rejects missing port', async () => {
    const provider = new SMTPProvider({})
    const result = await provider.validateConfig({ host: 'smtp.example.com', fromEmail: 'a@b.com' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('port')
  })

  it('validates config — rejects missing fromEmail', async () => {
    const provider = new SMTPProvider({})
    const result = await provider.validateConfig({ host: 'smtp.example.com', port: '587' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('email')
  })

  it('validates complete config', async () => {
    const provider = new SMTPProvider({})
    const result = await provider.validateConfig({
      host: 'smtp.example.com',
      port: '587',
      fromEmail: 'noreply@example.com',
    })
    expect(result.valid).toBe(true)
  })

  it('has email channel', () => {
    const provider = new SMTPProvider({})
    expect(provider.channel).toBe('email')
  })
})
