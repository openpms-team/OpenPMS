'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'

interface Property {
  id: string
  name: string
}

interface PricingEntry {
  id: string
  property_id: string
  date: string
  final_price: number
  source: 'auto' | 'manual' | 'pending'
}

function getDatesArray(days: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function sourceClass(source: string): string {
  switch (source) {
    case 'auto': return 'bg-green-100 text-green-800'
    case 'manual': return 'bg-blue-100 text-blue-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return ''
  }
}

export default function PricingCalendarPage() {
  const t = useTranslations('pricing')
  const [properties, setProperties] = useState<Property[]>([])
  const [pricing, setPricing] = useState<PricingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const dates = getDatesArray(30)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()
      const [propsRes, pricingRes] = await Promise.all([
        supabase.from('properties').select('id, name').order('name'),
        supabase
          .from('pricing_calendar')
          .select('id, property_id, date, final_price, source')
          .gte('date', dates[0])
          .lte('date', dates[dates.length - 1]),
      ])
      if (propsRes.data) setProperties(propsRes.data)
      if (pricingRes.data) setPricing(pricingRes.data as unknown as PricingEntry[])
    } catch {
      // RLS or connection error
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  function getEntry(propertyId: string, date: string): PricingEntry | undefined {
    return pricing.find((p) => p.property_id === propertyId && p.date === date)
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('title')}...</p>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('calendar')}</h2>

      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-200" /> {t('recommended')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-200" /> {t('manual')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-yellow-200" /> {t('autoAccept')}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('dynamicPricing')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">
                  {t('title')}
                </TableHead>
                {dates.map((d) => (
                  <TableHead key={d} className="min-w-[60px] text-center text-xs">
                    {formatShortDate(d)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm">
                    {prop.name}
                  </TableCell>
                  {dates.map((d) => {
                    const entry = getEntry(prop.id, d)
                    return (
                      <TableCell key={d} className="text-center p-1">
                        {entry ? (
                          <Badge className={sourceClass(entry.source)} variant="outline">
                            {entry.final_price.toFixed(0)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
