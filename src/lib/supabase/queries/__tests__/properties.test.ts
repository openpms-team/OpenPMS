import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockIn = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}))

// Must import after mocks
const { getProperties, getProperty, createProperty, deleteProperty } = await import('../properties')

beforeEach(() => {
  vi.clearAllMocks()

  // Default chain
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  })
  mockEq.mockReturnValue({
    order: mockOrder,
    single: mockSingle,
    in: mockIn,
  })
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockIn.mockResolvedValue({ count: 0, error: null })
})

describe('getProperties', () => {
  it('returns array of properties', async () => {
    const mockData = [{ id: '1', name: 'Beach House' }]
    mockOrder.mockResolvedValue({ data: mockData, error: null })

    const result = await getProperties()
    expect(result).toEqual(mockData)
    expect(mockFrom).toHaveBeenCalledWith('properties')
  })
})

describe('getProperty', () => {
  it('returns single property with joins', async () => {
    const mockData = { id: '1', name: 'Beach House' }
    mockSingle.mockResolvedValue({ data: mockData, error: null })

    const result = await getProperty('1')
    expect(result).toEqual(mockData)
  })

  it('returns null when not found', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    })

    const result = await getProperty('nonexistent')
    expect(result).toBeNull()
  })
})

describe('createProperty', () => {
  it('calls insert with correct data', async () => {
    const input = {
      name: 'New Property',
      max_guests: 4,
      num_bedrooms: 2,
      num_bathrooms: 1,
      check_in_time: '15:00',
      check_out_time: '11:00',
      active: true,
      country_code: 'PRT',
    }

    mockSingle.mockResolvedValue({ data: { id: '1', ...input }, error: null })

    const result = await createProperty(input)
    expect(result).toHaveProperty('name', 'New Property')
    expect(mockFrom).toHaveBeenCalledWith('properties')
  })
})

describe('deleteProperty', () => {
  it('checks for active reservations before deleting', async () => {
    mockIn.mockResolvedValue({ count: 0, error: null })
    mockEq.mockReturnValue({
      single: mockSingle,
      in: mockIn,
    })
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    await deleteProperty('1')
    // Should have queried reservations
    expect(mockFrom).toHaveBeenCalledWith('reservations')
  })
})
