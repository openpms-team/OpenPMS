import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleSwitcher } from '../locale-switcher'

vi.mock('next-intl', () => ({
  useLocale: () => 'pt',
}))

describe('LocaleSwitcher', () => {
  it('renders the globe trigger button', () => {
    render(<LocaleSwitcher />)
    const triggers = screen.getAllByRole('button')
    expect(triggers.length).toBeGreaterThan(0)
  })

  it('shows all 3 locale options when opened', async () => {
    render(<LocaleSwitcher />)
    const trigger = screen.getAllByRole('button')[0]
    fireEvent.click(trigger)
    expect(await screen.findByText('Português')).toBeDefined()
    expect(await screen.findByText('English')).toBeDefined()
    expect(await screen.findByText('Français')).toBeDefined()
  })
})
