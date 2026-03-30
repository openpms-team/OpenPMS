'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core'
import { Plus, LayoutGrid, List, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskForm } from '@/components/tasks/task-form'
import { createTaskAction, updateTaskStatusAction } from '@/app/(dashboard)/tasks/actions'
import { toast } from 'sonner'

interface TaskRow {
  id: string
  title: string
  type: string
  status: string
  priority: number
  due_date: string | null
  property_id: string | null
  assigned_to: string | null
  checklist: Array<{ item: string; done: boolean }> | null
  properties: { name: string } | null
  staff: { name: string } | null
}

interface PropertyOption { id: string; name: string }
interface StaffOption { id: string; name: string }

const TASK_TYPES = ['cleaning', 'maintenance', 'inspection', 'laundry', 'restock', 'custom'] as const
const STATUSES = ['pending', 'in_progress', 'completed'] as const
const STATUS_LABELS: Record<string, string> = {
  pending: 'pending',
  in_progress: 'inProgress',
  completed: 'completed',
}

export default function TasksPage() {
  const t = useTranslations('tasks')
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [staffList, setStaffList] = useState<StaffOption[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [filterProperty, setFilterProperty] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterAssigned, setFilterAssigned] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()
      const [tasksRes, propsRes, staffRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, type, status, priority, due_date, property_id, assigned_to, checklist, properties(name), staff(name)')
          .neq('status', 'cancelled')
          .order('due_date', { ascending: true }),
        supabase.from('properties').select('id, name').order('name'),
        supabase.from('staff').select('id, name').eq('active', true).order('name'),
      ])
      if (tasksRes.data) setTasks(tasksRes.data as unknown as TaskRow[])
      if (propsRes.data) setProperties(propsRes.data)
      if (staffRes.data) setStaffList(staffRes.data)
    } catch {
      // RLS or connection error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = tasks.filter((task) => {
    if (filterProperty && task.property_id !== filterProperty) return false
    if (filterType && task.type !== filterType) return false
    if (filterAssigned && task.assigned_to !== filterAssigned) return false
    return true
  })

  async function handleCreateTask(data: unknown) {
    const result = await createTaskAction(data)
    if (result.error) {
      toast.error(t('taskError'))
    } else {
      toast.success(t('taskCreated'))
      setShowForm(false)
      fetchData()
    }
  }

  function statusVariant(status: string) {
    switch (status) {
      case 'completed': return 'default' as const
      case 'in_progress': return 'secondary' as const
      default: return 'outline' as const
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const taskId = String(active.id)
    const newStatus = String(over.id)
    if (!(STATUSES as readonly string[]).includes(newStatus)) return
    const result = await updateTaskStatusAction(taskId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="mr-1 h-4 w-4" /> {t('kanban')}
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            <List className="mr-1 h-4 w-4" /> {t('list')}
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" /> {t('addNew')}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4">
          <TaskForm properties={properties} staff={staffList} onSubmit={handleCreateTask} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('allProperties')}</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('allTypes')}</option>
          {TASK_TYPES.map((tt) => <option key={tt} value={tt}>{t(tt)}</option>)}
        </select>
        <select
          value={filterAssigned}
          onChange={(e) => setFilterAssigned(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('allStaff')}</option>
          {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('noTasks')}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noTasks')}</h3>
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {STATUSES.map((status) => {
              const column = filtered.filter((task) => task.status === status)
              return (
                <KanbanColumn key={status} id={status} label={`${t(STATUS_LABELS[status])} (${column.length})`}>
                  {column.map((task) => (
                    <DraggableTask key={task.id} id={task.id}>
                      <TaskCard task={task} onStatusChange={fetchData} />
                    </DraggableTask>
                  ))}
                </KanbanColumn>
              )
            })}
          </div>
        </DndContext>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('titleField')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('property')}</TableHead>
              <TableHead>{t('assignedTo')}</TableHead>
              <TableHead>{t('dueDate')}</TableHead>
              <TableHead>{t('pending')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{t(task.type as typeof TASK_TYPES[number])}</TableCell>
                <TableCell>{task.properties?.name ?? '—'}</TableCell>
                <TableCell>{task.staff?.name ?? t('unassigned')}</TableCell>
                <TableCell>{task.due_date ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(task.status)}>
                    {t(STATUS_LABELS[task.status] ?? 'pending')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function KanbanColumn({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 rounded-lg border p-3 min-h-[200px] ${isOver ? 'bg-accent' : ''}`}
    >
      <h3 className="text-sm font-semibold">{label}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DraggableTask({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  )
}
