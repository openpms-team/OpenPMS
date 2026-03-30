import { getConfiguredProvider, canUseAI, trackUsage } from '../core'

export interface BIAnswer {
  answer: string
  chartData?: { type: 'bar' | 'line' | 'pie'; data: Record<string, unknown>[] }
}

const SYSTEM_PROMPT = `You are a business intelligence assistant for a property management system. Answer questions about the business data. Available metrics: occupancy rate, ADR (average daily rate), RevPAR, total revenue, average stay length, cancellation rate, revenue by source, revenue by property, top nationalities.

When answering:
- Be concise and data-focused
- If you can suggest a visualization, include chartData with type (bar/line/pie) and data array
- Use the current date for relative references
- Format currency in EUR
- Return JSON: { answer: "...", chartData?: { type, data } }`

export async function answerBIQuestion(
  question: string,
  context: { totalRevenue: number; occupancy: number; adr: number; propertyCount: number }
): Promise<BIAnswer> {
  if (!(await canUseAI('bi_chat'))) {
    return { answer: 'BI chat feature is not enabled.' }
  }

  const provider = await getConfiguredProvider()
  if (!provider) return { answer: 'AI provider not configured.' }

  const response = await provider.chat({
    system: SYSTEM_PROMPT,
    user: `Context: Total revenue: €${context.totalRevenue}, Occupancy: ${context.occupancy}%, ADR: €${context.adr}, Properties: ${context.propertyCount}.\n\nQuestion: ${question}`,
  })

  await trackUsage('bi_chat', { input: response.inputTokens, output: response.outputTokens })

  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { answer: response.text }
  } catch {
    return { answer: response.text }
  }
}
