'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Landmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'

interface TaxRow {
  id: string
  taxable_guests: number
  taxable_nights: number
  tax_amount: number
  reservations: {
    guest_name: string
    check_in: string
    properties: { name: string } | null
  } | null
}

interface TaxDashboardProps {
  initialTaxes: TaxRow[]
  initialYear: number
  initialMonth: number
}

export function TaxDashboard({ initialTaxes, initialYear, initialMonth }: TaxDashboardProps) {
  const t = useTranslations('finance')
  const [taxes, setTaxes] = useState<TaxRow[]>(initialTaxes)
  const [filterYear, setFilterYear] = useState(initialYear)
  const [filterMonth, setFilterMonth] = useState(initialMonth)
  const [hasFilterChanged, setHasFilterChanged] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()
      const startOfMonth = new Date(filterYear, filterMonth - 1, 1).toISOString()
      const endOfMonth = new Date(filterYear, filterMonth, 0).toISOString()

      const { data } = await supabase
        .from('tax_calculations')
        .select('id, taxable_guests, taxable_nights, tax_amount, reservations(guest_name, check_in, properties(name))')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false })

      if (data) setTaxes(data as unknown as TaxRow[])
    } catch {
      // RLS or connection error
    }
  }, [filterYear, filterMonth])

  useEffect(() => {
    if (hasFilterChanged) {
      void fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterMonth])

  function handleMonthChange(m: number) {
    setFilterMonth(m)
    setHasFilterChanged(true)
  }

  function handleYearChange(y: number) {
    setFilterYear(y)
    setHasFilterChanged(true)
  }

  const totalTax = taxes.reduce((sum, tx) => sum + (tx.tax_amount ?? 0), 0)

  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('totalTax')}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalTax.toFixed(2)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filterMonth}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          {months.map((m) => (
            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {taxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Landmark className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noTaxRecords')}</h3>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('guest')}</TableHead>
              <TableHead>{t('property')}</TableHead>
              <TableHead>{t('checkIn')}</TableHead>
              <TableHead>{t('guestsTaxable')}</TableHead>
              <TableHead>{t('nightsTaxable')}</TableHead>
              <TableHead>{t('totalTax')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.reservations?.guest_name ?? '—'}</TableCell>
                <TableCell>{tx.reservations?.properties?.name ?? '—'}</TableCell>
                <TableCell>{tx.reservations?.check_in ?? '—'}</TableCell>
                <TableCell>{tx.taxable_guests}</TableCell>
                <TableCell>{tx.taxable_nights}</TableCell>
                <TableCell>{tx.tax_amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
