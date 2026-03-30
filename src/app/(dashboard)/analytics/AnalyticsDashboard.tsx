'use client'

import { useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'

const CHART_COLORS = ['#0d9488', '#0f766e', '#d97706', '#059669', '#e11d48', '#6366f1']

interface AnalyticsDashboardProps {
  occupancy: number
  adr: number
  revpar: number
  totalRevenue: number
  revenueBySource: Array<{ source: string; revenue: number }>
  revenueByProperty: Array<{ propertyId: string; name: string; revenue: number }>
  revenueTimeline: Array<{ month: string; revenue: number }>
  cancellationRate: number
  topNationalities: Array<{ nationality: string; count: number }>
  avgStayLength: number
}

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} \u20AC`
}

function formatPercent(value: number): string {
  return `${value}%`
}

export function AnalyticsDashboard({
  occupancy,
  adr,
  revpar,
  totalRevenue,
  revenueBySource,
  revenueByProperty,
  revenueTimeline,
  cancellationRate,
  topNationalities,
  avgStayLength,
}: AnalyticsDashboardProps) {
  const t = useTranslations('analytics')

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t('occupancyRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPercent(occupancy)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t('adr')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(adr)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t('revpar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(revpar)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t('totalRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>{t('revenueTimeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), t('totalRevenue')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS[0] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>{t('revenueBySource')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBySource}
                    dataKey="revenue"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name }) => String(name ?? '')}
                  >
                    {revenueBySource.map((_, index) => (
                      <Cell
                        key={`source-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value))]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Property */}
        <Card>
          <CardHeader>
            <CardTitle>{t('revenueByProperty')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByProperty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), t('totalRevenue')]}
                  />
                  <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]}>
                    {revenueByProperty.map((_, index) => (
                      <Cell
                        key={`prop-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Nationalities */}
        <Card>
          <CardHeader>
            <CardTitle>{t('topNationalities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topNationalities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nationality" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]}>
                    {topNationalities.map((_, index) => (
                      <Cell
                        key={`nat-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t('avgStayLength')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {avgStayLength.toFixed(1)} {t('nights')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t('cancellationRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPercent(cancellationRate)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
