import type { PricingAdapter, PriceRecommendation } from './base'

export class BeyondAdapter implements PricingAdapter {
  readonly name = 'Beyond'
  readonly id = 'beyond' as const

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    if (!config.accountId) return { valid: false, error: 'Account ID is required' }
    return { valid: true }
  }

  async fetchPrices(
    config: Record<string, string>,
    listingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceRecommendation[]> {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]

    const response = await fetch(
      `https://api.beyondpricing.com/v3/accounts/${config.accountId}/listings/${listingId}/pricing?start=${start}&end=${end}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Beyond API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      pricing: Array<{
        date: string
        suggested_price: number
        min_stay?: number
        currency?: string
      }>
    }

    return (data.pricing ?? []).map((d) => ({
      date: d.date,
      recommendedPrice: d.suggested_price,
      minStay: d.min_stay,
      currency: d.currency ?? 'EUR',
    }))
  }
}
