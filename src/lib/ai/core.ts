import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/auth/encryption'
import type { AiConfig, AiProvider } from '@/types/database'

export interface AIResponse {
  text: string
  inputTokens: number
  outputTokens: number
}

export interface AIProvider {
  chat(params: { system: string; user: string; images?: string[] }): Promise<AIResponse>
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async chat(params: { system: string; user: string; images?: string[] }): Promise<AIResponse> {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = params.images?.length
      ? [
          ...params.images.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: img },
          })),
          { type: 'text' as const, text: params.user },
        ]
      : params.user

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: params.system,
      messages: [{ role: 'user', content }],
    })

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  }
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, ...(baseURL && { baseURL }) })
    this.model = model
  }

  async chat(params: { system: string; user: string; images?: string[] }): Promise<AIResponse> {
    const userContent: OpenAI.ChatCompletionContentPart[] = params.images?.length
      ? [
          ...params.images.map((img) => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${img}` },
          })),
          { type: 'text' as const, text: params.user },
        ]
      : [{ type: 'text', text: params.user }]

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2048,
    })

    return {
      text: response.choices[0]?.message.content ?? '',
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    }
  }
}

export function createAIProvider(
  provider: AiProvider,
  apiKey: string,
  model: string,
  baseURL?: string
): AIProvider {
  if (provider === 'anthropic') {
    return new AnthropicProvider(apiKey, model)
  }
  return new OpenAIProvider(apiKey, model, baseURL)
}

export async function getConfiguredProvider(): Promise<AIProvider | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_config')
    .select('*')
    .eq('active', true)
    .single()

  if (!data) return null
  const config = data as AiConfig

  const apiKey = config.api_key ? decrypt(config.api_key) : ''
  if (!apiKey) return null

  const featuresEnabled = config.features_enabled as Record<string, boolean> | null
  const baseURL = (featuresEnabled as Record<string, unknown> | null)?.base_url as string | undefined

  return createAIProvider(config.provider, apiKey, config.model, baseURL)
}

export async function canUseAI(feature: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_config')
    .select('features_enabled, monthly_budget_limit, active')
    .eq('active', true)
    .single()

  if (!data?.active) return false
  const features = (data.features_enabled ?? {}) as Record<string, boolean>
  if (!features[feature]) return false

  // Check budget
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const { data: usage } = await supabase
    .from('ai_usage_log')
    .select('estimated_cost')
    .gte('created_at', monthStart)

  const totalCost = (usage ?? []).reduce((s, u) => s + Number(u.estimated_cost), 0)
  return totalCost < Number(data.monthly_budget_limit)
}

export async function trackUsage(
  feature: string,
  tokens: { input: number; output: number },
  reservationId?: string,
  propertyId?: string
): Promise<void> {
  const cost = estimateCost(tokens)
  const supabase = await createClient()
  await supabase.from('ai_usage_log').insert({
    feature,
    input_tokens: tokens.input,
    output_tokens: tokens.output,
    estimated_cost: cost,
    reservation_id: reservationId,
    property_id: propertyId,
  })
}

export function estimateCost(tokens: { input: number; output: number }): number {
  // Average cost per 1M tokens (blended across providers)
  const inputCostPer1M = 3.0
  const outputCostPer1M = 15.0
  return (
    (tokens.input / 1_000_000) * inputCostPer1M +
    (tokens.output / 1_000_000) * outputCostPer1M
  )
}
