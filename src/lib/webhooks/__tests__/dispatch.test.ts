import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

describe('webhook signature', () => {
  it('generates valid HMAC-SHA256 signature', () => {
    const secret = 'test-secret-key'
    const body = JSON.stringify({ event: 'reservation.created', data: { id: '123' } })
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')

    expect(signature).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same body + secret produces same signature', () => {
    const secret = 'consistent-secret'
    const body = '{"event":"test"}'

    const sig1 = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const sig2 = crypto.createHmac('sha256', secret).update(body).digest('hex')

    expect(sig1).toBe(sig2)
  })

  it('different secrets produce different signatures', () => {
    const body = '{"event":"test"}'

    const sig1 = crypto.createHmac('sha256', 'secret1').update(body).digest('hex')
    const sig2 = crypto.createHmac('sha256', 'secret2').update(body).digest('hex')

    expect(sig1).not.toBe(sig2)
  })

  it('different bodies produce different signatures', () => {
    const secret = 'same-secret'

    const sig1 = crypto.createHmac('sha256', secret).update('body1').digest('hex')
    const sig2 = crypto.createHmac('sha256', secret).update('body2').digest('hex')

    expect(sig1).not.toBe(sig2)
  })
})
