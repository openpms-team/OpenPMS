'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Property {
  id: string
  name: string
}

interface PropertyMetrics {
  propertyId: string
  name: string
  occupancy: number
  revenue: number
  avgStay: number
  cancellation: number
}

function getBestIndex(metrics: PropertyMetrics[], key: keyof Omit<PropertyMetrics, 'propertyId' | 'name'>): number {
  if (metrics.length === 0) return -1
  if (key === 'cancellation') {
    return metrics.reduce((best, m, i) => (m[key] < metrics[best][key] ? i : best), 0)
  }
  return metrics.reduce((best, m, i) => (m[key] > metrics[best][key] ? i : best), 0)
}

export default function ComparePage() {
  const t = useTranslations('analytics')
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [metrics, setMetrics] = useState<PropertyMetrics[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('id, name')
        .eq('active', true)
        .order('name')
      setProperties(data ?? [])
    }
    loadProperties()
  }, [])

  const toggleProperty = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const fetchComparison = useCallback(async () => {
    if (selected.length < 2) return
    setLoading(true)

    const supabase = createClient()
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    const startDate = threeMonthsAgo.toISOString().slice(0, 10)
    const endDate = now.toISOString().slice(0, 10)

    try {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('property_id, check_in, check_out, num_nights, total_amount, status')
        .lte('check_in', endDate)
        .gte('check_out', startDate)
        .in('property_id', selected)

      const allRes = reservations ?? []
      const totalDays = Math.max(
        0,
        Math.ceil((now.getTime() - threeMonthsAgo.getTime()) / 86400000)
      )

      const results: PropertyMetrics[] = selected.map((propId) => {
        const propRes = allRes.filter((r) => r.property_id === propId)
        const active = propRes.filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')
        const cancelled = propRes.filter((r) => r.status === 'cancelled')

        const bookedNights = active.reduce((sum, r) => {
          const overlapStart = r.check_in > startDate ? r.check_in : startDate
          const overlapEnd = r.check_out < endDate ? r.check_out : endDate
          const days = Math.max(
            0,
            Math.ceil((new Date(overlapEnd).getTime() - new Date(overlapStart).getTime()) / 86400000)
          )
          return sum + days
        }, 0)

        const occupancy = totalDays > 0 ? Math.round((bookedNights / totalDays) * 100) : 0
        const revenue = active.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
        const totalNights = active.reduce((s, r) => s + (r.num_nights ?? 0), 0)
        const avgStay = active.length > 0 ? Math.round((totalNights / active.length) * 10) / 10 : 0
        const cancellation = propRes.length > 0
          ? Math.round((cancelled.length / propRes.length) * 100)
          : 0

        const prop = properties.find((p) => p.id === propId)
        return {
          propertyId: propId,
          name: prop?.name ?? propId,
          occupancy,
          revenue,
          avgStay,
          cancellation,
        }
      })

      setMetrics(results)
    } catch {
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }, [selected, properties])

  const metricRows: Array<{
    label: string
    key: keyof Omit<PropertyMetrics, 'propertyId' | 'name'>
    format: (v: number) => string
  }> = [
    { label: t('occupancyRate'), key: 'occupancy', format: (v) => `${v}%` },
    { label: t('totalRevenue'), key: 'revenue', format: (v) => `${v.toFixed(2)} \u20AC` },
    { label: t('avgStayLength'), key: 'avgStay', format: (v) => `${v.toFixed(1)}` },
    { label: t('cancellationRate'), key: 'cancellation', format: (v) => `${v}%` },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('compare')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('selectProperties')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {properties.map((prop) => {
              const isSelected = selected.includes(prop.id)
              return (
                <label
                  key={prop.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isSelected && selected.length >= 4}
                    onChange={() => toggleProperty(prop.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">{prop.name}</span>
                </label>
              )
            })}
          </div>
          <div className="mt-4">
            <Button
              onClick={fetchComparison}
              disabled={selected.length < 2 || loading}
            >
              {loading ? t('loading') : t('compare')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {metrics.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">{t('metric')}</th>
                  {metrics.map((m) => (
                    <th key={m.propertyId} className="py-2 px-4 text-left font-medium">
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricRows.map((row) => {
                  const bestIdx = getBestIndex(metrics, row.key)
                  return (
                    <tr key={row.key} className="border-b">
                      <td className="py-3 pr-4 font-medium">{row.label}</td>
                      {metrics.map((m, i) => (
                        <td
                          key={m.propertyId}
                          className={`py-3 px-4 ${
                            i === bestIdx ? 'bg-green-50 font-semibold text-green-700' : ''
                          }`}
                        >
                          {row.format(m[row.key])}
                          {i === bestIdx && (
                            <span className="ml-2 text-xs text-green-600">
                              {t('bestPerformer')}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
