import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { TeamManager } from './TeamManager'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  active: boolean
}

export default async function TeamPage() {
  const t = await getTranslations('team')

  let staff: StaffMember[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('staff')
      .select('id, name, email, role, phone, active')
      .order('created_at', { ascending: false })
    if (data) staff = data
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
      </div>
      <TeamManager initialStaff={staff} />
    </div>
  )
}
