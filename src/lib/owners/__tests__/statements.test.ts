import { describe, it, expect, vi } from 'vitest'

const mockOwnerProperties = [
  {
    property_id: 'prop-1',
    commission_type: 'percentage',
    commission_value: 20,
    properties: { name: 'Beach House' },
  },
]

const mockReservations = [
  {
    id: 'res-1',
    property_id: 'prop-1',
    guest_name: 'John Doe',
    check_in: '2025-06-01',
    check_out: '2025-06-05',
    total_amount: 500,
  },
  {
    id: 'res-2',
    property_id: 'prop-1',
    guest_name: 'Jane Smith',
    check_in: '2025-06-10',
    check_out: '2025-06-15',
    total_amount: 750,
  },
]

const mockExpenses = [
  { property_id: 'prop-1', amount: 100 },
]

const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'owner_properties') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOwnerProperties }),
          }),
        }
      }
      if (table === 'reservations') {
        return {
          select: () => ({
            in: () => ({
              gte: () => ({
                lte: () => ({
                  in: () => Promise.resolve({ data: mockReservations }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'expenses') {
        return {
          select: () => ({
            in: () => ({
              gte: () => ({
                lte: () => Promise.resolve({ data: mockExpenses }),
              }),
            }),
          }),
        }
      }
      return { select: mockSelect }
    }),
  }),
}))

const { generateStatement } = await import('../statements')

describe('generateStatement', () => {
  it('calculates correct gross revenue', async () => {
    const result = await generateStatement('owner-1', '2025-06-01', '2025-06-30')
    expect(result.totalRevenue).toBe(1250)
  })

  it('applies percentage commission correctly', async () => {
    const result = await generateStatement('owner-1', '2025-06-01', '2025-06-30')
    // 20% of 500 = 100, 20% of 750 = 150, total = 250
    expect(result.totalCommission).toBe(250)
  })

  it('deducts expenses correctly', async () => {
    const result = await generateStatement('owner-1', '2025-06-01', '2025-06-30')
    // 100 total expenses / 2 reservations = 50 each
    expect(result.totalExpenses).toBe(100)
  })

  it('calculates correct net amount', async () => {
    const result = await generateStatement('owner-1', '2025-06-01', '2025-06-30')
    // 1250 - 100 - 250 = 900
    expect(result.netAmount).toBe(900)
  })

  it('generates per-reservation breakdown', async () => {
    const result = await generateStatement('owner-1', '2025-06-01', '2025-06-30')
    expect(result.breakdown).toHaveLength(2)
    expect(result.breakdown[0].guestName).toBe('John Doe')
    expect(result.breakdown[0].revenue).toBe(500)
  })

  it('includes property name in breakdown', async () => {
    const result = await generateStatement('owner-1', '2025-06-01', '2025-06-30')
    expect(result.breakdown[0].propertyName).toBe('Beach House')
  })
})
