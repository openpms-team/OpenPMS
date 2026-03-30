import { describe, it, expect } from 'vitest'
import { PriceLabsAdapter } from '../pricelabs'

describe('PriceLabsAdapter', () => {
  const adapter = new PriceLabsAdapter()

  it('validates config — rejects missing apiKey', async () => {
    const result = await adapter.validateConfig({})
    expect(result.valid).toBe(false)
    expect(result.error).toContain('API key')
  })

  it('validates complete config', async () => {
    const result = await adapter.validateConfig({ apiKey: 'test-key' })
    expect(result.valid).toBe(true)
  })

  it('has correct id and name', () => {
    expect(adapter.id).toBe('pricelabs')
    expect(adapter.name).toBe('PriceLabs')
  })
})
