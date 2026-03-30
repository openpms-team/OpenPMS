import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { DollarSign, Receipt, Landmark, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function FinancePage() {
  const t = await getTranslations('finance')

  let revenue = 0
  let expensesTotal = 0
  let taxPending = 0
  let invoiceCount = 0

  try {
    const supabase = await createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const [resRes, expRes, taxRes, invRes] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, total_amount')
        .gte('check_in', startOfMonth)
        .lte('check_in', endOfMonth),
      supabase
        .from('expenses')
        .select('id, amount')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth),
      supabase
        .from('tax_calculations')
        .select('id, tax_amount'),
      supabase
        .from('invoices')
        .select('id')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth),
    ])

    if (resRes.data) {
      revenue = (resRes.data as { id: string; total_amount: number }[])
        .reduce((sum, r) => sum + (r.total_amount ?? 0), 0)
    }
    if (expRes.data) {
      expensesTotal = (expRes.data as { id: string; amount: number }[])
        .reduce((sum, e) => sum + (e.amount ?? 0), 0)
    }
    if (taxRes.data) {
      taxPending = (taxRes.data as { id: string; tax_amount: number }[])
        .reduce((sum, tx) => sum + (tx.tax_amount ?? 0), 0)
    }
    if (invRes.data) {
      invoiceCount = invRes.data.length
    }
  } catch {
    // RLS or connection error — defaults to zeros
  }

  const stats = [
    { label: t('totalRevenue'), value: revenue.toFixed(2), icon: DollarSign },
    { label: t('expenses'), value: expensesTotal.toFixed(2), icon: Receipt },
    { label: t('taxPending'), value: taxPending.toFixed(2), icon: Landmark },
    { label: t('invoicesIssued'), value: `${invoiceCount}`, icon: FileText },
  ]

  const links = [
    { href: '/finance/taxes', label: t('taxes') },
    { href: '/finance/invoices', label: t('invoices') },
    { href: '/finance/expenses', label: t('expenses') },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button variant="outline">{link.label}</Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
