export interface PriceRecommendation {
  date: string
  recommendedPrice: number
  minStay?: number
  currency: string
  factors?: Array<{ name: string; impact: number }>
}

export interface PricingAdapter {
  readonly name: string
  readonly id: 'pricelabs' | 'beyond' | 'wheelhouse'
  validateConfig(
    config: Record<string, string>
  ): Promise<{ valid: boolean; error?: string }>
  fetchPrices(
    config: Record<string, string>,
    listingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceRecommendation[]>
}
