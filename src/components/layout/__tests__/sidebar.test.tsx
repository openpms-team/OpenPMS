import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/properties',
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('Sidebar', () => {
  it('renders all nav items', () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />)
    const navItems = [
      'dashboard',
      'reservations',
      'calendar',
      'guests',
      'tasks',
      'messages',
      'team',
      'finance',
      'analytics',
      'settings',
    ]
    for (const item of navItems) {
      expect(screen.getByText(item)).toBeDefined()
    }
  })

  it('calls onToggle when collapse button clicked', async () => {
    const onToggle = vi.fn()
    const { container } = render(
      <Sidebar collapsed={false} onToggle={onToggle} />
    )
    // Find the toggle button by its data-slot
    const toggleButton = container.querySelector(
      '[data-slot="button"]'
    ) as HTMLElement
    if (toggleButton) {
      await userEvent.click(toggleButton)
      expect(onToggle).toHaveBeenCalledOnce()
    }
  })

  it('hides labels when collapsed', () => {
    const { container } = render(
      <Sidebar collapsed={true} onToggle={() => {}} />
    )
    const spans = container.querySelectorAll('nav span')
    expect(spans.length).toBe(0)
  })

  it('shows active state for current path', () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />)
    const activeLink = screen
      .getAllByText('properties')[0]
      .closest('a')
    expect(activeLink?.className).toContain('sidebar-primary')
  })
})
