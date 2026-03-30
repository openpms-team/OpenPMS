import { describe, it, expect } from 'vitest'
import { MoloniAdapter } from '../moloni'

describe('MoloniAdapter', () => {
  const adapter = new MoloniAdapter()

  it('validates config — rejects missing clientId', async () => {
    const result = await adapter.validateConfig({ clientSecret: 'x', companyId: '1' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Client ID')
  })

  it('validates config — rejects missing companyId', async () => {
    const result = await adapter.validateConfig({ clientId: 'x', clientSecret: 'y' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Company ID')
  })

  it('validates complete config', async () => {
    const result = await adapter.validateConfig({
      clientId: 'x',
      clientSecret: 'y',
      companyId: '1',
    })
    expect(result.valid).toBe(true)
  })

  it('has correct id and name', () => {
    expect(adapter.id).toBe('moloni')
    expect(adapter.name).toBe('Moloni')
  })
})
