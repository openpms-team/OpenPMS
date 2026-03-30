import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { TaxDashboard } from './TaxDashboard'

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

export default async function TaxDashboardPage() {
  const t = await getTranslations('finance')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  let taxes: TaxRow[] = []

  try {
    const supabase = await createClient()
    const startOfMonth = new Date(year, month - 1, 1).toISOString()
    const endOfMonth = new Date(year, month, 0).toISOString()

    const { data } = await supabase
      .from('tax_calculations')
      .select('id, taxable_guests, taxable_nights, tax_amount, reservations(guest_name, check_in, properties(name))')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)
      .order('created_at', { ascending: false })

    if (data) taxes = data as unknown as TaxRow[]
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('taxes')}</h2>
      <TaxDashboard initialTaxes={taxes} initialYear={year} initialMonth={month} />
    </div>
  )
}
