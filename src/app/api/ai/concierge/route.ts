import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleConciergeMessage } from '@/lib/ai/features/concierge'

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  guestLanguage: z.string().min(1),
  propertyConfig: z.record(z.string(), z.unknown()),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { message, guestLanguage, propertyConfig, history } = parsed.data
    const reply = await handleConciergeMessage(
      message,
      guestLanguage,
      propertyConfig as Parameters<typeof handleConciergeMessage>[2],
      history
    )

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
