import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TwoFactorPage from '../two-factor/page'

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('TwoFactorPage', () => {
  it('renders 6-digit code input', () => {
    render(<TwoFactorPage />)
    const input = screen.getByPlaceholderText('000000')
    expect(input).toBeDefined()
    expect(input.getAttribute('maxLength')).toBe('6')
  })

  it('shows recovery code input when link clicked', () => {
    render(<TwoFactorPage />)
    const recoveryLinks = screen.getAllByText('auth.recoveryCode')
    fireEvent.click(recoveryLinks[0])
    expect(screen.getByPlaceholderText('XXXXX-XXXXX')).toBeDefined()
  })

  it('only accepts numeric input in TOTP field', () => {
    render(<TwoFactorPage />)
    const inputs = screen.getAllByPlaceholderText('000000')
    const input = inputs[0] as HTMLInputElement
    fireEvent.change(input, { target: { value: 'abc123' } })
    expect(input.value).toBe('123')
  })

  it('shows trust device checkbox', () => {
    render(<TwoFactorPage />)
    expect(screen.getAllByText('auth.trustDevice').length).toBeGreaterThan(0)
  })
})
