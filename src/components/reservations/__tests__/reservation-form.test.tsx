import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReservationForm } from '../reservation-form'

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/app/(dashboard)/reservations/actions', () => ({
  createReservationAction: vi.fn().mockResolvedValue({ data: {} }),
  updateReservationAction: vi.fn().mockResolvedValue({ data: {} }),
}))

const properties = [
  { id: '1', name: 'Beach House', max_guests: 6 },
  { id: '2', name: 'Mountain Cabin', max_guests: 4 },
]

describe('ReservationForm', () => {
  it('renders required fields', () => {
    render(<ReservationForm properties={properties} />)
    expect(screen.getByLabelText('reservations.guestName *')).toBeDefined()
  })

  it('renders property select options', () => {
    const { container } = render(<ReservationForm properties={properties} />)
    const options = container.querySelectorAll('option')
    // Should have property options
    expect(options.length).toBeGreaterThanOrEqual(2)
  })

  it('renders save button', () => {
    render(<ReservationForm properties={properties} />)
    expect(screen.getAllByText(/common\.save|save/i).length).toBeGreaterThan(0)
  })
})
