'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInvoiceAction } from './actions'
import { toast } from 'sonner'

export function CreateInvoiceButton() {
  const t = useTranslations('finance')
  const [open, setOpen] = useState(false)
  const [reservationId, setReservationId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!reservationId.trim()) return
    setLoading(true)
    const result = await createInvoiceAction(reservationId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Invoice created')
      setOpen(false)
      setReservationId('')
    }
    setLoading(false)
  }, [reservationId])

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> {t('createInvoice')}
      </Button>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <Label>Reservation ID</Label>
        <Input
          value={reservationId}
          onChange={(e) => setReservationId(e.target.value)}
          placeholder="UUID"
          className="w-72"
        />
      </div>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? '...' : t('createInvoice')}
      </Button>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  )
}
