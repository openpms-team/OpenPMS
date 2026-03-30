import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../login/page'

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

const mockSignIn = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({ data: { totp_enabled: false } }),
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
    from: () => ({ select: mockSelect }),
  }),
}))

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('auth.email')).toBeDefined()
    expect(screen.getByLabelText('auth.password')).toBeDefined()
  })

  it('shows validation errors for empty submit', async () => {
    render(<LoginPage />)
    const buttons = screen.getAllByRole('button', { name: 'auth.login' })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(
        screen.getAllByText(/errors\.validation/).length
      ).toBeGreaterThan(0)
    })
  })

  it('has email input with correct type', () => {
    render(<LoginPage />)
    const emailInput = screen.getByLabelText('auth.email')
    expect(emailInput.getAttribute('type')).toBe('email')
  })
})
