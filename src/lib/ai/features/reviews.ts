import { getConfiguredProvider, canUseAI, trackUsage } from '../core'

export async function generateReviewResponse(
  review: { rating: number; text: string; guestName: string; propertyName: string },
  hostTone: 'professional' | 'warm' | 'casual',
  language: string
): Promise<string> {
  if (!(await canUseAI('review_response'))) {
    throw new Error('Review response feature is not enabled')
  }

  const provider = await getConfiguredProvider()
  if (!provider) throw new Error('AI provider not configured')

  const response = await provider.chat({
    system: `Generate a response to this guest review for ${review.propertyName}. Tone: ${hostTone}. Language: ${language}. Rules: thank the guest by name, address specific positives, acknowledge any negatives constructively with improvement plans, invite to return. Keep under 100 words.`,
    user: `Guest: ${review.guestName}\nRating: ${review.rating}/5\nReview: ${review.text}`,
  })

  await trackUsage('review_response', { input: response.inputTokens, output: response.outputTokens })
  return response.text
}
