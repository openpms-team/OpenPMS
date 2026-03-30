import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { DownloadPdfButton } from './DownloadPdfButton'

interface Statement {
  id: string
  period: string
  revenue: number
  expenses: number
  commission: number
  net: number
  status: 'draft' | 'approved' | 'sent' | 'paid'
  pdf_url: string | null
}

function statusVariant(status: string) {
  switch (status) {
    case 'paid': return 'default' as const
    case 'approved': return 'secondary' as const
    case 'sent': return 'outline' as const
    default: return 'outline' as const
  }
}

export default async function OwnerStatementsPage() {
  const t = await getTranslations('owners')

  let statements: Statement[] = []

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data } = await supabase
      .from('owner_statements')
      .select('id, period, revenue, expenses, commission, net, status, pdf_url')
      .eq('owner_id', user.id)
      .order('period', { ascending: false })

    if (data) statements = data as unknown as Statement[]
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('statements')}</h2>

      {statements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('statements')}</h3>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('period')}</TableHead>
              <TableHead>{t('revenue')}</TableHead>
              <TableHead>{t('expenses')}</TableHead>
              <TableHead>{t('commission')}</TableHead>
              <TableHead>{t('net')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.period}</TableCell>
                <TableCell>{s.revenue.toFixed(2)}</TableCell>
                <TableCell>{s.expenses.toFixed(2)}</TableCell>
                <TableCell>{s.commission.toFixed(2)}</TableCell>
                <TableCell className="font-medium">{s.net.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(s.status)}>
                    {t(s.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.pdf_url && (
                    <DownloadPdfButton url={s.pdf_url} label={t('downloadPdf')} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
