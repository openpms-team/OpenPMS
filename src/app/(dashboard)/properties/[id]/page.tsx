import { notFound } from 'next/navigation'
import { getProperty } from '@/lib/supabase/queries/properties'
import { createClient } from '@/lib/supabase/server'
import { PropertyDetailTabs } from '@/components/properties/property-detail-tabs'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params
  const property = await getProperty(id)

  if (!property) notFound()

  const supabase = await createClient()
  const { data: jurisdictions } = await supabase
    .from('tax_jurisdictions')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{property.name}</h2>
      <PropertyDetailTabs
        property={property}
        jurisdictions={jurisdictions ?? []}
      />
    </div>
  )
}
