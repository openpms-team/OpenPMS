import { z } from 'zod/v4'

const taskTypes = ['cleaning', 'maintenance', 'inspection', 'laundry', 'restock', 'custom'] as const
const taskStatuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const

export const taskSchema = z.object({
  property_id: z.string().uuid().optional(),
  reservation_id: z.string().uuid().optional(),
  type: z.enum(taskTypes).default('cleaning'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  assigned_to: z.string().uuid().optional(),
  status: z.enum(taskStatuses).default('pending'),
  priority: z.number().int().min(0).max(10).default(0),
  due_date: z.string().date().optional(),
  checklist: z.array(z.object({ item: z.string(), done: z.boolean() })).optional(),
  notes: z.string().max(5000).optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

export const taskInsertSchema = taskSchema
export const taskUpdateSchema = taskSchema.partial()
