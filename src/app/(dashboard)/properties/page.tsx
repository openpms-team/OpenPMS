import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Building2, Plus } from 'lucide-react'
import { getProperties } from '@/lib/supabase/queries/properties'
import { Button } from '@/components/ui/button'
import { PropertySearch } from '@/components/properties/property-search'

export default async function PropertiesPage() {
  const t = await getTranslations('properties')
  let properties: Awaited<ReturnType<typeof getProperties>> = []

  try {
    properties = await getProperties()
  } catch {
    // RLS or connection error — show empty state
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <Link href="/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noProperties')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('noPropertiesDescription')}
          </p>
          <Link href="/properties/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addNew')}
            </Button>
          </Link>
        </div>
      ) : (
        <PropertySearch properties={properties} />
      )}
    </div>
  )
}
