import type { PricingAdapter, PriceRecommendation } from './base'

export class PriceLabsAdapter implements PricingAdapter {
  readonly name = 'PriceLabs'
  readonly id = 'pricelabs' as const

  async validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
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
      `https://api.pricelabs.co/v1/listings/${listingId}/calendar?start=${start}&end=${end}`,
      {
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`PriceLabs API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      dates: Array<{
        date: string
        price: number
        min_stay?: number
        currency?: string
        factors?: Array<{ name: string; impact: number }>
      }>
    }

    return (data.dates ?? []).map((d) => ({
      date: d.date,
      recommendedPrice: d.price,
      minStay: d.min_stay,
      currency: d.currency ?? 'EUR',
      factors: d.factors,
    }))
  }
}
