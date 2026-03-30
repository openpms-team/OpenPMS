import { createClient } from '@/lib/supabase/server'
import type { Reservation, TaskType } from '@/types/database'

interface AutoTaskConfig {
  type: TaskType
  enabled: boolean
  defaultAssignee?: string
  offsetHours: number
  defaultChecklist: string[]
}

const DEFAULT_AUTO_TASKS: Record<string, AutoTaskConfig[]> = {
  checked_in: [
    {
      type: 'cleaning',
      enabled: true,
      offsetHours: 0, // due at check_out time
      defaultChecklist: [
        'Limpar casa de banho',
        'Mudar roupa de cama',
        'Aspirar/Varrer',
        'Limpar cozinha',
        'Repor consumíveis',
        'Verificar toalhas',
        'Lixo',
      ],
    },
  ],
  new_reservation: [
    {
      type: 'inspection',
      enabled: true,
      offsetHours: -24, // 1 day before check_in
      defaultChecklist: [
        'Verificar limpeza',
        'Colocar kit boas-vindas',
        'Testar WiFi',
        'Verificar AC',
        'Colocar chaves/código',
      ],
    },
  ],
  checked_out: [
    {
      type: 'inspection',
      enabled: true,
      offsetHours: 2, // 2 hours after check_out
      defaultChecklist: [
        'Verificar danos',
        'Verificar inventário',
        'Fotografar estado',
      ],
    },
  ],
}

export async function createAutoTasks(
  reservation: Reservation,
  event: 'new_reservation' | 'checked_in' | 'checked_out'
) {
  const configs = DEFAULT_AUTO_TASKS[event]
  if (!configs) return []

  const supabase = await createClient()
  const created: string[] = []

  for (const config of configs) {
    if (!config.enabled) continue

    const baseDate = event === 'checked_in' || event === 'checked_out'
      ? reservation.check_out
      : reservation.check_in

    const dueDate = new Date(baseDate)
    dueDate.setHours(dueDate.getHours() + config.offsetHours)

    const checklist = config.defaultChecklist.map((item) => ({
      item,
      done: false,
    }))

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        property_id: reservation.property_id,
        reservation_id: reservation.id,
        type: config.type,
        title: `${config.type} — ${reservation.guest_name}`,
        assigned_to: config.defaultAssignee ?? null,
        status: 'pending',
        priority: 1,
        due_date: dueDate.toISOString().split('T')[0],
        checklist,
      })
      .select('id')
      .single()

    if (!error && data) {
      created.push(data.id)
    }
  }

  return created
}
