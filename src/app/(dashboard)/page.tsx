import { getTranslations } from 'next-intl/server'
import { Building2, CalendarDays, LogIn, BarChart3, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardStats } from '@/lib/supabase/queries/reservations'

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  delay,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  accent?: string
  delay?: string
}) {
  return (
    <Card className={`animate-fade-in ${delay ?? ''} overflow-hidden`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const t = await getTranslations('nav')
  const tProperties = await getTranslations('properties')
  const tReservations = await getTranslations('reservations')
  const tAnalytics = await getTranslations('analytics')

  let stats = {
    totalProperties: 0,
    activeReservations: 0,
    checkinsToday: 0,
    occupancyRate: 0,
    upcomingCheckins: [] as { id: string; guest_name: string; check_in: string }[],
    upcomingCheckouts: [] as { id: string; guest_name: string; check_out: string }[],
    revenueThisMonth: 0,
  }

  try {
    stats = await getDashboardStats()
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="text-sm font-medium text-muted-foreground">
          {t('dashboard')}
        </p>
        <h2 className="text-2xl font-bold tracking-tight mt-1">
          Welcome back
        </h2>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('properties')}
          value={stats.totalProperties}
          icon={Building2}
          accent="bg-primary/10 text-primary"
          delay="stagger-1"
        />
        <StatCard
          title={t('reservations')}
          value={stats.activeReservations}
          icon={CalendarDays}
          accent="bg-[var(--brand-500)]/10 text-[var(--brand-500)]"
          delay="stagger-2"
        />
        <StatCard
          title="Check-ins"
          value={stats.checkinsToday}
          icon={LogIn}
          accent="bg-[var(--success)]/10 text-[var(--success)]"
          delay="stagger-3"
        />
        <StatCard
          title={tAnalytics('occupancyRate')}
          value={`${stats.occupancyRate}%`}
          icon={BarChart3}
          accent="bg-[var(--warning)]/10 text-[var(--warning)]"
          delay="stagger-4"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 animate-fade-in stagger-2">
        <Link href="/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {tProperties('addNew')}
          </Button>
        </Link>
        <Link href="/reservations/new">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {tReservations('addNew')}
          </Button>
        </Link>
      </div>

      {/* Upcoming */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center gap-2">
            <LogIn className="h-4 w-4 text-[var(--success)]" />
            <CardTitle className="text-sm font-medium">
              {tReservations('checkIn')} (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No upcoming check-ins</p>
            ) : (
              <ul className="space-y-3">
                {stats.upcomingCheckins.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                      <span className="text-sm font-medium">{r.guest_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.check_in}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-4">
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--brand-500)]" />
            <CardTitle className="text-sm font-medium">
              {tReservations('checkOut')} (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingCheckouts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No upcoming check-outs</p>
            ) : (
              <ul className="space-y-3">
                {stats.upcomingCheckouts.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[var(--brand-500)]" />
                      <span className="text-sm font-medium">{r.guest_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.check_out}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
