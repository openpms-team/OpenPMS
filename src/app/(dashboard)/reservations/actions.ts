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
