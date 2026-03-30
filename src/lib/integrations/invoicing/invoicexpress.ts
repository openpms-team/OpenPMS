import type { InvoiceData, InvoiceProvider, InvoiceStatus } from './base'

export class InvoiceXpressAdapter implements InvoiceProvider {
  readonly name = 'InvoiceXpress'
  readonly id = 'invoicexpress' as const

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.subdomain) return { valid: false, error: 'Subdomain is required' }
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    return { valid: true }
  }

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const url = `https://${config.subdomain}.app.invoicexpress.com/sequences.json?api_key=${config.apiKey}`
      const response = await fetch(url)
      return response.ok
    } catch {
      return false
    }
  }

  async createInvoice(
    config: Record<string, string>,
    data: InvoiceData
  ): Promise<{ externalId: string; pdfUrl?: string; status: string }> {
    const items = data.lines.map((line) => ({
      name: line.description,
      description: '',
      unit_price: line.unitPrice,
      quantity: line.quantity,
      tax: {
        name: line.taxRate > 0 ? 'IVA6' : 'Isento',
        value: line.taxRate * 100,
      },
      exemption_reason: line.taxExemptionCode,
    }))

    const url = `https://${config.subdomain}.app.invoicexpress.com/invoices.json?api_key=${config.apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: {
          date: data.date.toISOString().split('T')[0],
          due_date: data.dueDate?.toISOString().split('T')[0],
          client: {
            name: data.clientName,
            fiscal_id: data.clientNIF,
            email: data.clientEmail,
            country: data.clientCountry,
          },
          items,
          observations: data.notes ?? '',
          reference: data.reservationRef ?? '',
        },
      }),
    })

    const result = (await response.json()) as {
      invoice?: { id: number; status: string }
      error?: string
    }

    if (!response.ok || result.error) {
      throw new Error(result.error ?? 'InvoiceXpress API error')
    }

    return {
      externalId: String(result.invoice?.id),
      status: 'draft',
    }
  }

  async getInvoiceStatus(
    config: Record<string, string>,
    externalId: string
  ): Promise<InvoiceStatus> {
    const url = `https://${config.subdomain}.app.invoicexpress.com/invoices/${externalId}.json?api_key=${config.apiKey}`
    const response = await fetch(url)
    const data = (await response.json()) as {
      invoice?: { status: string; pdf_url?: string }
    }

    const statusMap: Record<string, InvoiceStatus['status']> = {
      draft: 'draft',
      final: 'issued',
      settled: 'paid',
      cancelled: 'cancelled',
    }

    return {
      status: statusMap[data.invoice?.status ?? 'draft'] ?? 'draft',
      pdfUrl: data.invoice?.pdf_url,
    }
  }
}
