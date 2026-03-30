import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarGrid } from '@/components/calendar/calendar-grid'

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

const mockProperties = [
  { id: 'p1', name: 'Beach House' },
  { id: 'p2', name: 'Mountain Cabin' },
]

const mockReservations = [
  {
    id: 'r1',
    property_id: 'p1',
    guest_name: 'John Doe',
    check_in: '2025-06-03',
    check_out: '2025-06-07',
    status: 'confirmed' as const,
    num_guests: 2,
  },
]

describe('CalendarGrid', () => {
  it('renders month grid with property names', () => {
    render(
      <CalendarGrid
        properties={mockProperties as never[]}
        reservations={mockReservations}
        year={2025}
        month={6}
      />
    )
    expect(screen.getAllByText('Beach House').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mountain Cabin').length).toBeGreaterThan(0)
  })

  it('shows reservation guest name', () => {
    render(
      <CalendarGrid
        properties={mockProperties as never[]}
        reservations={mockReservations}
        year={2025}
        month={6}
      />
    )
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
  })

  it('renders navigation buttons', () => {
    render(
      <CalendarGrid
        properties={mockProperties as never[]}
        reservations={[]}
        year={2025}
        month={6}
      />
    )
    expect(screen.getAllByText('calendar.today').length).toBeGreaterThan(0)
  })
})
