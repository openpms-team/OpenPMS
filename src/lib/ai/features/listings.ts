import { getConfiguredProvider, canUseAI, trackUsage } from '../core'
import type { Property } from '@/types/database'

export interface ListingResult {
  title: string
  description: string
  highlights: string[]
}

export async function generateListingDescription(
  property: Property,
  language: string,
  style: 'concise' | 'detailed' | 'luxury',
  targetPlatform: 'airbnb' | 'booking' | 'generic'
): Promise<ListingResult> {
  if (!(await canUseAI('listing_generator'))) {
    throw new Error('Listing generator feature is not enabled')
  }

  const provider = await getConfiguredProvider()
  if (!provider) throw new Error('AI provider not configured')

  const response = await provider.chat({
    system: `Generate a ${targetPlatform} listing for a vacation rental. Style: ${style}. Language: ${language}. Return JSON: { title: "...", description: "...", highlights: ["..."] }. Title max 80 chars. Description: ${style === 'concise' ? '100-150 words' : style === 'detailed' ? '200-300 words' : '150-250 words with luxury language'}.`,
    user: `Property: ${property.name}. Location: ${property.city ?? ''}, ${property.address ?? ''}. Bedrooms: ${property.num_bedrooms}. Bathrooms: ${property.num_bathrooms}. Max guests: ${property.max_guests}. Amenities: ${(property.amenities ?? []).join(', ')}. Description: ${property.description ?? ''}.`,
  })

  await trackUsage('listing_generator', { input: response.inputTokens, output: response.outputTokens }, undefined, property.id)

  const jsonMatch = response.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { title: property.name, description: '', highlights: [] }
  return JSON.parse(jsonMatch[0])
}
