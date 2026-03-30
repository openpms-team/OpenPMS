import { createClient } from '@/lib/supabase/server'
import { OwnersManager } from './OwnersManager'

export default async function OwnersPage() {
  let owners: Array<{
    id: string; name: string; email: string
    phone: string | null; nif: string | null; iban: string | null
  }> = []
  let properties: Array<{ id: string; name: string; owner_id: string | null }> = []
  let ownerProperties: Array<{
    owner_id: string; property_id: string
    commission_type: string; commission_value: number
    properties: { name: string } | null
  }> = []

  try {
    const supabase = await createClient()
    const [ownersRes, propsRes, opRes] = await Promise.all([
      supabase.from('owners').select('id, name, email, phone, nif, iban').order('name'),
      supabase.from('properties').select('id, name, owner_id').eq('active', true).order('name'),
      supabase.from('owner_properties').select('owner_id, property_id, commission_type, commission_value, properties(name)'),
    ])
    if (ownersRes.data) owners = ownersRes.data
    if (propsRes.data) properties = propsRes.data
    if (opRes.data) ownerProperties = opRes.data as unknown as typeof ownerProperties
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <OwnersManager
        initialOwners={owners}
        properties={properties}
        ownerProperties={ownerProperties}
      />
    </div>
  )
}
