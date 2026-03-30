import type { InvoiceData, InvoiceProvider, InvoiceStatus } from './base'

export class MoloniAdapter implements InvoiceProvider {
  readonly name = 'Moloni'
  readonly id = 'moloni' as const

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.clientId) return { valid: false, error: 'Client ID is required' }
    if (!config.clientSecret) return { valid: false, error: 'Client secret is required' }
    if (!config.companyId) return { valid: false, error: 'Company ID is required' }
    return { valid: true }
  }

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const token = await this.getAccessToken(config)
      return !!token
    } catch {
      return false
    }
  }

  async createInvoice(
    config: Record<string, string>,
    data: InvoiceData
  ): Promise<{ externalId: string; pdfUrl?: string; status: string }> {
    const token = await this.getAccessToken(config)

    const lines = data.lines.map((line) => ({
      name: line.description,
      qty: line.quantity,
      price: line.unitPrice,
      tax: {
        percentage: line.taxRate * 100,
        exemption_code: line.taxExemptionCode,
      },
    }))

    const response = await fetch(
      `https://api.moloni.pt/v2/invoices/insert/?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: config.companyId,
          customer_name: data.clientName,
          customer_vat: data.clientNIF ?? '',
          date: data.date.toISOString().split('T')[0],
          products: lines,
          notes: data.notes ?? '',
          our_reference: data.reservationRef ?? '',
        }),
      }
    )

    const result = (await response.json()) as {
      document_id?: string
      error?: string
    }

    if (!response.ok || result.error) {
      throw new Error(result.error ?? 'Moloni API error')
    }

    return {
      externalId: String(result.document_id),
      status: 'draft',
    }
  }

  async getInvoiceStatus(
    config: Record<string, string>,
    externalId: string
  ): Promise<InvoiceStatus> {
    const token = await this.getAccessToken(config)

    const response = await fetch(
      `https://api.moloni.pt/v2/invoices/getOne/?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: config.companyId,
          document_id: externalId,
        }),
      }
    )

    const data = (await response.json()) as {
      status?: number
      net_value?: number
    }
    const statusMap: Record<number, InvoiceStatus['status']> = {
      0: 'draft',
      1: 'issued',
      2: 'paid',
      3: 'cancelled',
    }

    return { status: statusMap[data.status ?? 0] ?? 'draft' }
  }

  private async getAccessToken(config: Record<string, string>): Promise<string> {
    const response = await fetch('https://api.moloni.pt/v2/grant/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken ?? '',
      }),
    })

    const data = (await response.json()) as { access_token?: string }
    if (!data.access_token) throw new Error('Failed to get Moloni access token')
    return data.access_token
  }
}
