'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  updateTaskStatusAction,
  updateChecklistItemAction,
} from '@/app/(dashboard)/tasks/actions'
import { toast } from 'sonner'

interface ChecklistItem {
  item: string
  done: boolean
}

interface MyTask {
  id: string
  title: string
  type: string
  status: string
  priority: number
  due_date: string | null
  checklist: ChecklistItem[] | null
  properties: { name: string } | null
}

export default function MyTasksPage() {
  const t = useTranslations('tasks')
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMyTasks = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffRow } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single()
      if (!staffRow) return

      const { data } = await supabase
        .from('tasks')
        .select('id, title, type, status, priority, due_date, checklist, properties(name)')
        .eq('assigned_to', staffRow.id)
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true })

      if (data) setTasks(data as unknown as MyTask[])
    } catch {
      // RLS or connection error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMyTasks() }, [fetchMyTasks])

  async function handleComplete(taskId: string) {
    const result = await updateTaskStatusAction(taskId, 'completed')
    if (result.error) {
      toast.error(t('statusError'))
    } else {
      toast.success(t('statusUpdated'))
      fetchMyTasks()
    }
  }

  async function handleToggleChecklistItem(taskId: string, checklist: ChecklistItem[], index: number) {
    const updated = checklist.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    )
    const result = await updateChecklistItemAction(taskId, updated)
    if (result.error) {
      toast.error(t('statusError'))
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, checklist: updated } : task
        )
      )
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{t('noAssignedTasks')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">{t('myTasks')}</h2>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noAssignedTasks')}</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed'
            return (
              <Card key={task.id} className={isOverdue ? 'ring-2 ring-red-500' : ''}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold">{task.title}</h3>
                    {isOverdue && <Badge variant="destructive">{t('overdue')}</Badge>}
                  </div>

                  {task.properties?.name && (
                    <p className="text-sm text-muted-foreground">{task.properties.name}</p>
                  )}

                  {task.due_date && (
                    <p className={`text-sm ${isOverdue ? 'font-semibold text-red-600' : 'text-muted-foreground'}`}>
                      {t('dueDate')}: {task.due_date}
                    </p>
                  )}

                  {task.checklist && task.checklist.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('checklist')}</p>
                      {task.checklist.map((item, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-3 rounded-md border p-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() =>
                              handleToggleChecklistItem(task.id, task.checklist ?? [], idx)
                            }
                            className="h-5 w-5 rounded border-border"
                          />
                          <span className={item.done ? 'line-through text-muted-foreground' : ''}>
                            {item.item}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>

                {task.status !== 'completed' && (
                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleComplete(task.id)}
                    >
                      {t('markComplete')}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
