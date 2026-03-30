import { describe, it, expect, vi } from 'vitest'

const mockReservations = [
  { id: 'r1', property_id: 'p1', check_in: '2025-06-01', check_out: '2025-06-05', num_nights: 4, total_amount: 400, source: 'airbnb', status: 'checked_out', num_guests: 2, created_at: '2025-05-20' },
  { id: 'r2', property_id: 'p2', check_in: '2025-06-03', check_out: '2025-06-06', num_nights: 3, total_amount: 300, source: 'booking', status: 'checked_out', num_guests: 1, created_at: '2025-05-25' },
  { id: 'r3', property_id: 'p1', check_in: '2025-06-08', check_out: '2025-06-10', num_nights: 2, total_amount: 200, source: 'direct', status: 'cancelled', num_guests: 1, created_at: '2025-05-28' },
  { id: 'r4', property_id: 'p3', check_in: '2025-06-01', check_out: '2025-06-10', num_nights: 9, total_amount: 900, source: 'airbnb', status: 'confirmed', num_guests: 3, created_at: '2025-05-15' },
  { id: 'r5', property_id: 'p2', check_in: '2025-06-07', check_out: '2025-06-08', num_nights: 1, total_amount: 100, source: 'direct', status: 'no_show', num_guests: 1, created_at: '2025-05-30' },
]

const mockProperties = [
  { id: 'p1', name: 'Beach House' },
  { id: 'p2', name: 'Mountain Cabin' },
  { id: 'p3', name: 'City Apartment' },
]

const mockGuests = [
  { nationality_icao: 'ESP' },
  { nationality_icao: 'FRA' },
  { nationality_icao: 'ESP' },
  { nationality_icao: 'GBR' },
]

// Chainable proxy that resolves with data regardless of method chain
function chainable(data: unknown) {
  const result = Promise.resolve({ data, error: null, count: Array.isArray(data) ? (data as unknown[]).length : 0 })
  const proxy: unknown = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') return result.then.bind(result)
      if (prop === 'catch') return result.catch.bind(result)
      return () => proxy
    },
  })
  return proxy
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'reservations') return { select: () => chainable(mockReservations) }
      if (table === 'properties') return { select: () => chainable(mockProperties) }
      if (table === 'guests') return { select: () => chainable(mockGuests) }
      return { select: () => chainable([]) }
    }),
  }),
}))

const {
  getADR,
  getTotalRevenue,
  getAverageStayLength,
  getCancellationRate,
  getNoShowRate,
  getRevenueBySource,
  getRevenueByProperty,
  getTopNationalities,
} = await import('../metrics')

describe('analytics metrics', () => {
  const start = '2025-06-01'
  const end = '2025-06-30'
  const all: string[] = []

  it('ADR = total revenue / total booked nights', async () => {
    const adr = await getADR(all, start, end)
    expect(adr).toBe(100)
  })

  it('total revenue excludes cancelled and no-show', async () => {
    const revenue = await getTotalRevenue(all, start, end)
    expect(revenue).toBe(1600)
  })

  it('average stay length', async () => {
    const avg = await getAverageStayLength(all, start, end)
    expect(avg).toBe(5.3)
  })

  it('cancellation rate', async () => {
    const rate = await getCancellationRate(all, start, end)
    expect(rate).toBe(20)
  })

  it('no-show rate', async () => {
    const rate = await getNoShowRate(all, start, end)
    expect(rate).toBe(20)
  })

  it('revenue by source sums correctly', async () => {
    const bySrc = await getRevenueBySource(all, start, end)
    const airbnb = bySrc.find((s) => s.source === 'airbnb')
    expect(airbnb?.revenue).toBe(1300)
  })

  it('revenue by property returns all properties', async () => {
    const byProp = await getRevenueByProperty(all, start, end)
    expect(byProp.length).toBe(3)
  })

  it('top nationalities returns sorted list', async () => {
    const nats = await getTopNationalities(all, start, end)
    expect(nats.length).toBeGreaterThan(0)
    expect(nats[0].nationality).toBe('ESP')
    expect(nats[0].count).toBe(2)
  })

  it('handles empty results gracefully', async () => {
    const revenue = await getTotalRevenue(all, start, end)
    expect(typeof revenue).toBe('number')
    expect(isNaN(revenue)).toBe(false)
  })
})
