'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskInsertSchema } from '@/lib/validators/task'
import { z } from 'zod/v4'

type TaskFormData = z.input<typeof taskInsertSchema>
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const TASK_TYPES = ['cleaning', 'maintenance', 'inspection', 'laundry', 'restock', 'custom'] as const

interface TaskFormProps {
  properties: Array<{ id: string; name: string }>
  staff: Array<{ id: string; name: string }>
  onSubmit: (data: unknown) => void
}

export function TaskForm({ properties, staff, onSubmit }: TaskFormProps) {
  const t = useTranslations('tasks')
  const tc = useTranslations('common')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskInsertSchema),
    defaultValues: {
      type: 'cleaning',
      status: 'pending',
      priority: 0,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">{t('titleField')} *</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="property_id">{t('property')} *</Label>
        <select
          id="property_id"
          {...register('property_id')}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('allProperties')}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.property_id && (
          <p className="text-xs text-red-600">{errors.property_id.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="type">{t('type')} *</Label>
        <select
          id="type"
          {...register('type')}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          {TASK_TYPES.map((tt) => (
            <option key={tt} value={tt}>{t(tt)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea id="description" {...register('description')} rows={3} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="assigned_to">{t('assignedTo')}</Label>
        <select
          id="assigned_to"
          {...register('assigned_to')}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('unassigned')}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="due_date">{t('dueDate')} *</Label>
        <Input id="due_date" type="date" {...register('due_date')} />
        {errors.due_date && (
          <p className="text-xs text-red-600">{errors.due_date.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  )
}
