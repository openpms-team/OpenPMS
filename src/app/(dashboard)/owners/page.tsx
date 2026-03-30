import { createClient } from '@/lib/supabase/server'
import { OwnersManager } from './OwnersManager'

export default async function OwnersPage() {
  let owners: Array<{
    id: string
    name: string
    email: string
    phone: string | null
    nif: string | null
    iban: string | null
  }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('owners')
      .select('id, name, email, phone, nif, iban')
      .order('name')
    if (data) owners = data
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <OwnersManager initialOwners={owners} />
    </div>
  )
}
