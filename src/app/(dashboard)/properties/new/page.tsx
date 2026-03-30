import { getTranslations } from 'next-intl/server'
import { PropertyForm } from '@/components/properties/property-form'
import { createClient } from '@/lib/supabase/server'

export default async function NewPropertyPage() {
  const t = await getTranslations('properties')
  const supabase = await createClient()

  const { data: jurisdictions } = await supabase
    .from('tax_jurisdictions')
    .select('*')
    .order('name')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('addNew')}</h2>
      <PropertyForm jurisdictions={jurisdictions ?? []} />
    </div>
  )
}
