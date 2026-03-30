import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PropertySearch } from '@/components/properties/property-search'

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
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
  {
    id: '1',
    name: 'Beach House',
    address: '123 Coast Rd',
    max_guests: 6,
    num_bedrooms: 3,
    al_license: 'AL-123',
    check_in_time: '15:00',
    check_out_time: '11:00',
  },
  {
    id: '2',
    name: 'Mountain Cabin',
    address: '456 Hill St',
    max_guests: 4,
    num_bedrooms: 2,
    al_license: null,
    check_in_time: '14:00',
    check_out_time: '10:00',
  },
]

describe('PropertySearch (properties page)', () => {
  it('renders property cards', () => {
    render(<PropertySearch properties={mockProperties as never[]} />)
    expect(screen.getAllByText('Beach House').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mountain Cabin').length).toBeGreaterThan(0)
  })

  it('shows search input', () => {
    render(<PropertySearch properties={mockProperties as never[]} />)
    const inputs = screen.getAllByPlaceholderText('properties.searchProperties')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('filters cards by search query', () => {
    render(<PropertySearch properties={mockProperties as never[]} />)
    const input = screen.getAllByPlaceholderText(
      'properties.searchProperties'
    )[0]
    fireEvent.change(input, { target: { value: 'Beach' } })
    expect(screen.getAllByText('Beach House').length).toBeGreaterThan(0)
    // Mountain Cabin should not appear in the filtered grid
    const grid = document.querySelector('.grid')
    expect(grid?.textContent).not.toContain('Mountain Cabin')
  })
})
