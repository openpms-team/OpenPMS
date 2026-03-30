import Link from 'next/link'
import { Building2, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Property } from '@/types/database'

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{property.name}</CardTitle>
            {property.al_license && (
              <Badge variant="secondary">{property.al_license}</Badge>
            )}
          </div>
          {property.address && (
            <p className="text-sm text-muted-foreground">{property.address}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {property.max_guests}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {property.num_bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {property.check_in_time}–{property.check_out_time}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
