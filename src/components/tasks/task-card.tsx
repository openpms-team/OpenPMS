'use client'

import { useTranslations } from 'next-intl'
import {
  Sparkles, Wrench, Search, Shirt, Package, Settings,
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateTaskStatusAction } from '@/app/(dashboard)/tasks/actions'
import { toast } from 'sonner'

interface TaskData {
  id: string
  title: string
  type: string
  status: string
  priority: number
  due_date: string | null
  property_id: string | null
  assigned_to: string | null
  checklist: Array<{ item: string; done: boolean }> | null
  properties?: { name: string } | null
  staff?: { name: string } | null
}

interface TaskCardProps {
  task: TaskData
  onStatusChange?: () => void
}

const TYPE_ICONS: Record<string, typeof Sparkles> = {
  cleaning: Sparkles,
  maintenance: Wrench,
  inspection: Search,
  laundry: Shirt,
  restock: Package,
  custom: Settings,
}

function priorityColor(p: number) {
  if (p >= 7) return 'bg-red-500'
  if (p >= 4) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const t = useTranslations('tasks')
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed'
  const Icon = TYPE_ICONS[task.type] ?? Settings

  async function changeStatus(newStatus: string) {
    const result = await updateTaskStatusAction(task.id, newStatus)
    if (result.error) {
      toast.error(t('statusError'))
    } else {
      toast.success(t('statusUpdated'))
      onStatusChange?.()
    }
  }

  return (
    <Card className={isOverdue ? 'ring-2 ring-red-500' : ''} size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm leading-tight">{task.title}</span>
          </div>
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priorityColor(task.priority)}`} />
        </div>
        {task.properties?.name && (
          <p className="text-xs text-muted-foreground">{task.properties.name}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.due_date && (
            <span className={isOverdue ? 'font-semibold text-red-600' : ''}>
              {task.due_date}
            </span>
          )}
          {task.staff?.name && <span>{task.staff.name}</span>}
          {!task.staff && <span>{t('unassigned')}</span>}
        </div>
        {isOverdue && (
          <Badge variant="destructive">{t('overdue')}</Badge>
        )}
      </CardContent>
      <CardFooter className="gap-1">
        {task.status !== 'completed' && (
          <Button size="sm" variant="default" onClick={() => changeStatus('completed')}>
            {t('markComplete')}
          </Button>
        )}
        {task.status === 'pending' && (
          <Button size="sm" variant="outline" onClick={() => changeStatus('in_progress')}>
            {t('moveToInProgress')}
          </Button>
        )}
        {task.status === 'in_progress' && (
          <Button size="sm" variant="outline" onClick={() => changeStatus('pending')}>
            {t('moveToPending')}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
