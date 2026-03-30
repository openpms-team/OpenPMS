'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod/v4'
import { reservationInsertSchema } from '@/lib/validators/reservation'
import { createReservationAction, updateReservationAction } from '@/app/(dashboard)/reservations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Reservation } from '@/types/database'

type ReservationFormData = z.input<typeof reservationInsertSchema>

interface ReservationFormProps {
  reservation?: Reservation
  properties: Array<{ id: string; name: string; max_guests: number }>
}

const SOURCES = ['direct', 'airbnb', 'booking', 'expedia', 'vrbo', 'other'] as const
const STATUSES = ['confirmed', 'cancelled', 'checked_in', 'checked_out', 'no_show'] as const

export function ReservationForm({ reservation, properties }: ReservationFormProps) {
  const t = useTranslations('reservations')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!reservation

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationInsertSchema),
    defaultValues: reservation
      ? {
          property_id: reservation.property_id,
          guest_name: reservation.guest_name,
          guest_email: reservation.guest_email ?? '',
          guest_phone: reservation.guest_phone ?? '',
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          num_guests: reservation.num_guests,
          total_amount: reservation.total_amount ?? undefined,
          source: reservation.source,
          status: reservation.status,
          notes: reservation.notes ?? '',
          door_code: reservation.door_code ?? '',
        }
      : {
          num_guests: 1,
          source: 'direct',
          status: 'confirmed',
        },
  })

  const checkIn = watch('check_in')
  const checkOut = watch('check_out')

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const n = Math.round(diff / (1000 * 60 * 60 * 24))
    return n > 0 ? n : 0
  }, [checkIn, checkOut])

  async function onSubmit(data: ReservationFormData) {
    setLoading(true)
    try {
      const result = isEdit
        ? await updateReservationAction(reservation.id, data)
        : await createReservationAction(data)

      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? t('updated') : t('created'))
      router.push('/reservations')
    } catch {
      toast.error(tErrors('generic'))
    } finally {
      setLoading(false)
    }
  }

  const selectClass = 'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="property_id">{t('property')} *</Label>
          <select id="property_id" {...register('property_id')} className={selectClass}>
            <option value="">{tCommon('select')}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.property_id && (
            <p className="text-sm text-destructive">{tErrors('validation.required')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="guest_name">{t('guestName')} *</Label>
          <Input id="guest_name" {...register('guest_name')} />
          {errors.guest_name && (
            <p className="text-sm text-destructive">{tErrors('validation.required')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="guest_email">{t('guestEmail')}</Label>
          <Input id="guest_email" type="email" {...register('guest_email')} />
          {errors.guest_email && (
            <p className="text-sm text-destructive">{tErrors('validation.email')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="guest_phone">{t('guestPhone')}</Label>
          <Input id="guest_phone" {...register('guest_phone')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_in">{t('checkIn')} *</Label>
          <Input id="check_in" type="date" {...register('check_in')} />
          {errors.check_in && (
            <p className="text-sm text-destructive">{tErrors('validation.required')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_out">{t('checkOut')} *</Label>
          <Input id="check_out" type="date" {...register('check_out')} />
          {errors.check_out && (
            <p className="text-sm text-destructive">{errors.check_out.message ?? tErrors('validation.required')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="num_guests">{t('numGuests')} *</Label>
          <Input
            id="num_guests"
            type="number"
            min={1}
            {...register('num_guests', { valueAsNumber: true })}
          />
          {errors.num_guests && (
            <p className="text-sm text-destructive">{tErrors('validation.numeric')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('nights')}</Label>
          <p className="flex h-8 items-center text-sm text-muted-foreground">{nights}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_amount">{t('totalAmount')}</Label>
          <Input
            id="total_amount"
            type="number"
            step="0.01"
            min={0}
            {...register('total_amount', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">{t('source')}</Label>
          <select id="source" {...register('source')} className={selectClass}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{t(`sources.${s}`)}</option>
            ))}
          </select>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">{t('status')}</Label>
            <select id="status" {...register('status')} className={selectClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`statuses.${s}`)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="door_code">{t('doorCode')}</Label>
          <Input id="door_code" {...register('door_code')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea id="notes" rows={3} {...register('notes')} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '...' : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
