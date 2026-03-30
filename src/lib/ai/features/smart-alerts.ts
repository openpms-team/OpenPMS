import { getConfiguredProvider, canUseAI, trackUsage } from '../core'

export interface SmartAlert {
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
}

export async function analyzePropertyHealth(
  propertyId: string,
  metrics: {
    occupancy: number
    cancellationRate: number
    avgRating: number
    revenueChange: number // % change vs previous period
  }
): Promise<{ alerts: SmartAlert[] }> {
  if (!(await canUseAI('smart_alerts'))) {
    return { alerts: [] }
  }

  const provider = await getConfiguredProvider()
  if (!provider) return { alerts: [] }

  const response = await provider.chat({
    system: `Analyze property health metrics and identify issues. Return JSON: { alerts: [{ severity: "info"|"warning"|"critical", message: "...", suggestion: "..." }] }. Only flag real problems, not normal variations.`,
    user: `Occupancy: ${metrics.occupancy}%, Cancellation rate: ${metrics.cancellationRate}%, Avg rating: ${metrics.avgRating}/5, Revenue change: ${metrics.revenueChange}%`,
  })

  await trackUsage('smart_alerts', { input: response.inputTokens, output: response.outputTokens }, undefined, propertyId)

  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { alerts: [] }
  } catch {
    return { alerts: [] }
  }
}
