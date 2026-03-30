'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PropertyCard } from './property-card'
import type { Property } from '@/types/database'

interface PropertySearchProps {
  properties: Property[]
}

export function PropertySearch({ properties }: PropertySearchProps) {
  const t = useTranslations('properties')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return properties.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q)
    )
  }, [properties, query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchProperties')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}
