import { describe, it, expect } from 'vitest'
import { InvoiceXpressAdapter } from '../invoicexpress'

describe('InvoiceXpressAdapter', () => {
  const adapter = new InvoiceXpressAdapter()

  it('validates config — rejects missing subdomain', async () => {
    const result = await adapter.validateConfig({ apiKey: 'x' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Subdomain')
  })

  it('validates config — rejects missing apiKey', async () => {
    const result = await adapter.validateConfig({ subdomain: 'test' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('API key')
  })

  it('validates complete config', async () => {
    const result = await adapter.validateConfig({
      subdomain: 'test',
      apiKey: 'key-123',
    })
    expect(result.valid).toBe(true)
  })

  it('has correct id and name', () => {
    expect(adapter.id).toBe('invoicexpress')
    expect(adapter.name).toBe('InvoiceXpress')
  })
})
