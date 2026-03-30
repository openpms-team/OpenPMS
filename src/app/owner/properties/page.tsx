import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

interface OwnerProperty {
  property_id: string
  property_name: string
  occupancy: number
  monthly_revenue: number
}

export default async function OwnerPropertiesPage() {
  const t = await getTranslations('owners')

  let properties: OwnerProperty[] = []

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: ownerProps } = await supabase
      .from('owner_properties')
      .select('property_id, properties(name)')
      .eq('owner_id', user.id)

    if (ownerProps && ownerProps.length > 0) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

      const results: OwnerProperty[] = []

      for (const op of ownerProps) {
        const prop = op.properties as unknown as { name: string } | null
        const { data: reservations } = await supabase
          .from('reservations')
          .select('total_amount, check_in, check_out')
          .eq('property_id', op.property_id)
          .gte('check_in', monthStart)
          .lte('check_in', monthEnd)
          .neq('status', 'cancelled')

        const revenue = (reservations ?? []).reduce((s, r) => s + (r.total_amount ?? 0), 0)
        const nights = (reservations ?? []).reduce((s, r) => {
          const cin = new Date(r.check_in)
          const cout = new Date(r.check_out)
          return s + Math.max(0, Math.ceil((cout.getTime() - cin.getTime()) / 86400000))
        }, 0)

        results.push({
          property_id: op.property_id,
          property_name: prop?.name ?? op.property_id,
          occupancy: Math.round((nights / daysInMonth) * 100),
          monthly_revenue: revenue,
        })
      }

      properties = results
    }
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('properties')}</h2>
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('title')}</h3>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => (
            <Card key={prop.property_id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{prop.property_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('occupancy')}</span>
                  <span className="font-medium">{prop.occupancy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('revenue')}</span>
                  <span className="font-medium">{prop.monthly_revenue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
