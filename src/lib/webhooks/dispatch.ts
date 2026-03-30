import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function dispatchWebhook(
  event: string,
  payload: Record<string, unknown>
) {
  const supabase = await createClient()

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id, url, secret, events')
    .eq('active', true)

  if (!webhooks?.length) return

  const matching = webhooks.filter((w) =>
    (w.events as string[]).includes(event) || (w.events as string[]).includes('*')
  )

  for (const webhook of matching) {
    void deliverWithRetry(supabase, webhook, event, payload)
  }
}

async function deliverWithRetry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  webhook: { id: string; url: string; secret: string },
  event: string,
  payload: Record<string, unknown>,
  maxAttempts = 3
) {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })
  const delays = [0, 1000, 5000]

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      await new Promise((r) => setTimeout(r, delays[attempt - 1] ?? 5000))
    }

    try {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex')

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenPMS-Signature': signature,
          'X-OpenPMS-Event': event,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      })

      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event,
        payload,
        status_code: response.status,
        response_body: await response.text().catch(() => ''),
        attempt,
        success: response.ok,
      })

      if (response.ok) return
    } catch (err) {
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event,
        payload,
        attempt,
        success: false,
        response_body: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }
}
