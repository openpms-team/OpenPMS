'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/require-permission'
import { reservationInsertSchema, reservationUpdateSchema } from '@/lib/validators/reservation'
import {
  createReservation as createReservationQuery,
  updateReservation as updateReservationQuery,
} from '@/lib/supabase/queries/reservations'
import { isValidTransition } from '@/lib/reservations/status-machine'
import { onReservationCreated, onReservationStatusChanged } from '@/lib/messaging/triggers'
import { createAutoTasks } from '@/lib/tasks/auto-create'
import { dispatchWebhook } from '@/lib/webhooks/dispatch'
import { createClient } from '@/lib/supabase/server'
import { calculateTouristTax } from '@/lib/taxes/calculator'
import type { ReservationStatus } from '@/types/database'

export async function createReservationAction(formData: unknown) {
  const auth = await requirePermission('reservations.write')
  if (!auth.authorized) return { error: auth.error }

  const parsed = reservationInsertSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  try {
    const reservation = await createReservationQuery(parsed.data)

    // Fire message triggers (non-blocking)
    onReservationCreated(reservation).catch(() => {})
    // Create auto-tasks for new reservation
    createAutoTasks(reservation, 'new_reservation').catch(() => {})
    // Dispatch webhooks
    dispatchWebhook('reservation.created', { reservation }).catch(() => {})

    // Auto-calculate tourist tax (non-blocking)
    try {
      const supabase = await createClient()
      const { data: property } = await supabase
        .from('properties')
        .select('tax_jurisdiction_id')
        .eq('id', reservation.property_id)
        .single()

      if (property?.tax_jurisdiction_id) {
        const { data: rules } = await supabase
          .from('tax_rules')
          .select('*')
          .eq('jurisdiction_id', property.tax_jurisdiction_id)
        const { data: exemptions } = await supabase
          .from('tax_exemptions')
          .select('*')
          .eq('jurisdiction_id', property.tax_jurisdiction_id)
        const { data: jurisdiction } = await supabase
          .from('tax_jurisdictions')
          .select('name')
          .eq('id', property.tax_jurisdiction_id)
          .single()

        const guests = Array.from({ length: reservation.num_guests }, () => ({
          age: 30,
          nationality: 'UNK',
        }))

        const result = calculateTouristTax(
          {
            reservationId: reservation.id,
            propertyId: reservation.property_id,
            jurisdictionId: property.tax_jurisdiction_id,
            checkIn: reservation.check_in,
            checkOut: reservation.check_out,
            guests,
          },
          (rules ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            rate_amount: Number(r.rate_amount),
            rate_type: r.rate_type as string,
            season_start: r.season_start as string | null,
            season_end: r.season_end as string | null,
            max_nights: r.max_nights as number | null,
            min_guest_age: r.min_guest_age as number,
            priority: r.priority as number,
          })),
          (exemptions ?? []).map((e: Record<string, unknown>) => ({
            type: e.type as string,
            description: e.description as string | null,
            condition_json: e.condition_json as Record<string, unknown>,
          })),
          jurisdiction?.name ?? ''
        )

        await supabase.from('tax_calculations').upsert(
          {
            reservation_id: reservation.id,
            jurisdiction_id: property.tax_jurisdiction_id,
            taxable_nights: result.nightsTaxable,
            taxable_guests: result.guestsTaxable,
            tax_amount: result.totalAmount,
            breakdown: result.breakdown,
          },
          { onConflict: 'reservation_id' }
        )
      }
    } catch {
      // Tax calculation is non-critical
    }

    revalidatePath('/reservations')
    revalidatePath('/calendar')
    revalidatePath('/')
    return { data: reservation }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create reservation'
    return { error: message }
  }
}

export async function updateReservationAction(id: string, formData: unknown) {
  const auth = await requirePermission('reservations.write')
  if (!auth.authorized) return { error: auth.error }

  const parsed = reservationUpdateSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  try {
    const reservation = await updateReservationQuery(id, parsed.data)
    revalidatePath('/reservations')
    revalidatePath(`/reservations/${id}`)
    revalidatePath('/calendar')
    revalidatePath('/')
    return { data: reservation }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update reservation'
    return { error: message }
  }
}

export async function changeStatusAction(
  id: string,
  currentStatus: ReservationStatus,
  newStatus: ReservationStatus
) {
  const auth = await requirePermission('reservations.write')
  if (!auth.authorized) return { error: auth.error }

  if (!isValidTransition(currentStatus, newStatus)) {
    return { error: `Invalid transition from ${currentStatus} to ${newStatus}` }
  }

  try {
    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    const reservation = await updateReservationQuery(id, updateData)

    // Fire message triggers (non-blocking)
    onReservationStatusChanged(reservation, newStatus).catch(() => {})
    // Create auto-tasks on status change (non-blocking)
    if (newStatus === 'checked_in' || newStatus === 'checked_out') {
      createAutoTasks(reservation, newStatus).catch(() => {})
    }
    // Dispatch webhooks
    dispatchWebhook('reservation.status_changed', { reservation, newStatus }).catch(() => {})

    revalidatePath('/reservations')
    revalidatePath(`/reservations/${id}`)
    revalidatePath('/calendar')
    revalidatePath('/')
    return { data: reservation }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to change status'
    return { error: message }
  }
}
