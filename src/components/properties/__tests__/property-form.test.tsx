import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PropertyForm } from '../property-form'

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/app/(dashboard)/properties/actions', () => ({
  createPropertyAction: vi.fn().mockResolvedValue({ data: {} }),
  updatePropertyAction: vi.fn().mockResolvedValue({ data: {} }),
}))

const defaultProps = { jurisdictions: [] }

describe('PropertyForm', () => {
  it('renders all required fields', () => {
    render(<PropertyForm {...defaultProps} />)
    expect(screen.getByLabelText(/properties\.name/)).toBeDefined()
    expect(screen.getByLabelText(/properties\.maxGuests/)).toBeDefined()
    expect(screen.getByLabelText(/properties\.checkInTime/)).toBeDefined()
    expect(screen.getByLabelText(/properties\.checkOutTime/)).toBeDefined()
  })

  it('renders address and city fields', () => {
    render(<PropertyForm {...defaultProps} />)
    expect(screen.getByLabelText(/properties\.address/)).toBeDefined()
    expect(screen.getByLabelText(/properties\.city/)).toBeDefined()
  })

  it('renders advanced section trigger', () => {
    render(<PropertyForm {...defaultProps} />)
    const triggers = screen.getAllByText('properties.advanced')
    expect(triggers.length).toBeGreaterThan(0)
  })

  it('renders save and cancel buttons', () => {
    render(<PropertyForm {...defaultProps} />)
    expect(screen.getAllByText('common.save').length).toBeGreaterThan(0)
    expect(screen.getAllByText('common.cancel').length).toBeGreaterThan(0)
  })

  it('renders description field', () => {
    render(<PropertyForm {...defaultProps} />)
    expect(screen.getByLabelText(/common\.description/)).toBeDefined()
  })
})
