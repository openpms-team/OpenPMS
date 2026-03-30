import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      propertyId: string
      feedUrl: string
      sourceName: string
    }

    if (!body.propertyId || !body.feedUrl) {
      return NextResponse.json({ error: 'propertyId and feedUrl required' }, { status: 400 })
    }

    // Dynamic import to avoid node-ical BigInt issue at build time
    const { syncICalFeed } = await import('@/lib/integrations/ical/sync')

    const result = await syncICalFeed(
      body.propertyId,
      body.feedUrl,
      body.sourceName ?? 'other'
    )

    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
