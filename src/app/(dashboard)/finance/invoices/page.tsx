import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { CreateInvoiceButton } from './CreateInvoiceButton'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'

interface InvoiceRow {
  id: string
  created_at: string
  amount: number
  tax: number
  provider: string
  status: string
  reservations: {
    guest_name: string
  } | null
}

function statusVariant(status: string) {
  switch (status) {
    case 'draft': return 'outline' as const
    case 'issued': return 'secondary' as const
    case 'paid': return 'default' as const
    case 'cancelled': return 'destructive' as const
    default: return 'outline' as const
  }
}

export default async function InvoicesPage() {
  const t = await getTranslations('finance')

  let invoices: InvoiceRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('invoices')
      .select('id, created_at, amount, tax, provider, status, reservations(guest_name)')
      .order('created_at', { ascending: false })

    if (data) invoices = data as unknown as InvoiceRow[]
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('invoices')}</h2>
        <CreateInvoiceButton />
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noInvoices')}</h3>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('guest')}</TableHead>
              <TableHead>{t('amount')}</TableHead>
              <TableHead>{t('tax')}</TableHead>
              <TableHead>{t('provider')}</TableHead>
              <TableHead>{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{inv.reservations?.guest_name ?? '—'}</TableCell>
                <TableCell>{inv.amount.toFixed(2)}</TableCell>
                <TableCell>{inv.tax.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{inv.provider}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(inv.status)}>
                    {t(`invoiceStatus_${inv.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
