import { getTranslations } from 'next-intl/server'
import {
  getOccupancyRate,
  getADR,
  getRevPAR,
  getTotalRevenue,
  getRevenueBySource,
  getRevenueByProperty,
  getRevenueTimeline,
  getCancellationRate,
  getTopNationalities,
  getAverageStayLength,
} from '@/lib/analytics/metrics'
import { AnalyticsDashboard } from './AnalyticsDashboard'

export default async function AnalyticsPage() {
  const t = await getTranslations('analytics')

  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  const startDate = threeMonthsAgo.toISOString().slice(0, 10)
  const endDate = now.toISOString().slice(0, 10)
  const propertyIds: string[] = []

  let occupancy = 0
  let adr = 0
  let revpar = 0
  let totalRevenue = 0
  let revenueBySource: Array<{ source: string; revenue: number }> = []
  let revenueByProperty: Array<{ propertyId: string; name: string; revenue: number }> = []
  let revenueTimeline: Array<{ month: string; revenue: number }> = []
  let cancellationRate = 0
  let topNationalities: Array<{ nationality: string; count: number }> = []
  let avgStayLength = 0

  try {
    ;[
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
    ] = await Promise.all([
      getOccupancyRate(propertyIds, startDate, endDate),
      getADR(propertyIds, startDate, endDate),
      getRevPAR(propertyIds, startDate, endDate),
      getTotalRevenue(propertyIds, startDate, endDate),
      getRevenueBySource(propertyIds, startDate, endDate),
      getRevenueByProperty(propertyIds, startDate, endDate),
      getRevenueTimeline(propertyIds, startDate, endDate),
      getCancellationRate(propertyIds, startDate, endDate),
      getTopNationalities(propertyIds, startDate, endDate),
      getAverageStayLength(propertyIds, startDate, endDate),
    ])
  } catch {
    // Defaults already set above
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('last3Months')}</p>
      <AnalyticsDashboard
        occupancy={occupancy}
        adr={adr}
        revpar={revpar}
        totalRevenue={totalRevenue}
        revenueBySource={revenueBySource}
        revenueByProperty={revenueByProperty}
        revenueTimeline={revenueTimeline}
        cancellationRate={cancellationRate}
        topNationalities={topNationalities}
        avgStayLength={avgStayLength}
      />
    </div>
  )
}
