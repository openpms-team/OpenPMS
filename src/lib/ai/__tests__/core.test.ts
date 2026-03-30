import { describe, it, expect, vi } from 'vitest'
import { estimateCost, createAIProvider } from '../core'

// Mock the SDKs as classes
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'test response' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      }
    },
  }
})

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'test response' } }],
            usage: { prompt_tokens: 100, completion_tokens: 50 },
          }),
        },
      }
    },
  }
})

describe('AI core', () => {
  describe('estimateCost', () => {
    it('calculates cost for small usage', () => {
      const cost = estimateCost({ input: 1000, output: 500 })
      expect(cost).toBeGreaterThan(0)
      expect(cost).toBeLessThan(1)
    })

    it('returns 0 for zero tokens', () => {
      expect(estimateCost({ input: 0, output: 0 })).toBe(0)
    })

    it('scales linearly with tokens', () => {
      const cost1 = estimateCost({ input: 1000, output: 1000 })
      const cost2 = estimateCost({ input: 2000, output: 2000 })
      expect(Math.abs(cost2 - cost1 * 2)).toBeLessThan(0.0001)
    })
  })

  describe('createAIProvider', () => {
    it('returns provider for anthropic', () => {
      const provider = createAIProvider('anthropic', 'test-key', 'claude-sonnet-4-20250514')
      expect(provider).toBeDefined()
      expect(provider.chat).toBeTypeOf('function')
    })

    it('returns provider for openai', () => {
      const provider = createAIProvider('openai', 'test-key', 'gpt-4o-mini')
      expect(provider).toBeDefined()
      expect(provider.chat).toBeTypeOf('function')
    })

    it('anthropic provider calls chat', async () => {
      const provider = createAIProvider('anthropic', 'test-key', 'claude-sonnet-4-20250514')
      const result = await provider.chat({ system: 'test', user: 'hello' })
      expect(result.text).toBe('test response')
      expect(result.inputTokens).toBe(100)
      expect(result.outputTokens).toBe(50)
    })

    it('openai provider calls chat', async () => {
      const provider = createAIProvider('openai', 'test-key', 'gpt-4o-mini')
      const result = await provider.chat({ system: 'test', user: 'hello' })
      expect(result.text).toBe('test response')
      expect(result.inputTokens).toBe(100)
      expect(result.outputTokens).toBe(50)
    })
  })
})
