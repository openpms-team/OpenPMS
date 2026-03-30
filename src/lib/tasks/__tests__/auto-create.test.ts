import { describe, it, expect, vi } from 'vitest'

const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'task-1' }, error: null }),
  }),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({ insert: mockInsert }),
  }),
}))

const { createAutoTasks } = await import('../auto-create')

const mockReservation = {
  id: 'res-1',
  property_id: 'prop-1',
  source: 'direct' as const,
  external_id: null,
  guest_name: 'John Doe',
  guest_email: null,
  guest_phone: null,
  num_guests: 2,
  check_in: '2025-06-01',
  check_out: '2025-06-05',
  num_nights: 4,
  nightly_rate: null,
  total_amount: null,
  paid_amount: 0,
  currency: 'EUR',
  door_code: null,
  extras: {},
  notes: null,
  status: 'confirmed' as const,
  cancelled_at: null,
  created_at: '2025-01-01',
  updated_at: null,
}

describe('createAutoTasks', () => {
  it('creates cleaning task on checked_in event', async () => {
    const result = await createAutoTasks(mockReservation, 'checked_in')
    expect(result.length).toBe(1)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('creates preparation task on new_reservation event', async () => {
    const result = await createAutoTasks(mockReservation, 'new_reservation')
    expect(result.length).toBe(1)
  })

  it('creates inspection task on checked_out event', async () => {
    const result = await createAutoTasks(mockReservation, 'checked_out')
    expect(result.length).toBe(1)
  })

  it('inserts task with correct property_id', async () => {
    await createAutoTasks(mockReservation, 'checked_in')
    const insertCall = mockInsert.mock.calls[mockInsert.mock.calls.length - 1][0]
    expect(insertCall.property_id).toBe('prop-1')
  })

  it('includes default checklist items', async () => {
    await createAutoTasks(mockReservation, 'checked_in')
    const insertCall = mockInsert.mock.calls[mockInsert.mock.calls.length - 1][0]
    expect(insertCall.checklist.length).toBeGreaterThan(0)
    expect(insertCall.checklist[0]).toHaveProperty('item')
    expect(insertCall.checklist[0]).toHaveProperty('done', false)
  })
})
