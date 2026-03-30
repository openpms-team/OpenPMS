export interface InvoiceClient {
  name: string
  nif?: string
  email?: string
  country: string
}

export interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxExemptionCode?: string
}

export interface InvoiceData {
  clientName: string
  clientNIF?: string
  clientEmail?: string
  clientCountry: string
  date: Date
  dueDate?: Date
  lines: InvoiceLine[]
  notes?: string
  reservationRef?: string
}

export interface InvoiceStatus {
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'voided'
  pdfUrl?: string
}

export interface InvoiceProvider {
  readonly name: string
  readonly id: 'moloni' | 'invoicexpress' | 'manual'
  validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }>
  testConnection(config: Record<string, string>): Promise<boolean>
  createInvoice(
    config: Record<string, string>,
    data: InvoiceData
  ): Promise<{ externalId: string; pdfUrl?: string; status: string }>
  getInvoiceStatus(
    config: Record<string, string>,
    externalId: string
  ): Promise<InvoiceStatus>
}
