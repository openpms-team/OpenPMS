import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, CalendarDays, Percent } from 'lucide-react'

export default async function OwnerDashboardPage() {
  const t = await getTranslations('owners')

  let revenue = 0
  let net = 0
  let occupancy = 0
  let upcoming = 0

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const { data: ownerProps } = await supabase
      .from('owner_properties')
      .select('property_id, commission_rate')
      .eq('owner_id', user.id)

    if (ownerProps && ownerProps.length > 0) {
      const propertyIds = ownerProps.map((op) => op.property_id)
      const avgCommission = ownerProps.reduce((sum, op) => sum + (op.commission_rate ?? 0), 0) / ownerProps.length

      const [revenueRes, upcomingRes] = await Promise.all([
        supabase
          .from('reservations')
          .select('total_amount, check_in, check_out')
          .in('property_id', propertyIds)
          .gte('check_in', monthStart)
          .lte('check_in', monthEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('reservations')
          .select('id')
          .in('property_id', propertyIds)
          .gte('check_in', now.toISOString().slice(0, 10))
          .neq('status', 'cancelled'),
      ])

      const totalRevenue = (revenueRes.data ?? []).reduce((sum, r) => sum + (r.total_amount ?? 0), 0)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const bookedNights = (revenueRes.data ?? []).reduce((sum, r) => {
        const cin = new Date(r.check_in)
        const cout = new Date(r.check_out)
        return sum + Math.max(0, Math.ceil((cout.getTime() - cin.getTime()) / 86400000))
      }, 0)

      revenue = totalRevenue
      net = totalRevenue * (1 - avgCommission / 100)
      occupancy = Math.round((bookedNights / (propertyIds.length * daysInMonth)) * 100)
      upcoming = upcomingRes.data?.length ?? 0
    }
  } catch {
    // RLS or connection error — defaults to zeros
  }

  const cards = [
    { label: t('revenue'), value: revenue.toFixed(2), icon: DollarSign },
    { label: t('net'), value: net.toFixed(2), icon: TrendingUp },
    { label: t('occupancy'), value: `${occupancy}%`, icon: Percent },
    { label: t('dashboard'), value: `${upcoming}`, icon: CalendarDays },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
