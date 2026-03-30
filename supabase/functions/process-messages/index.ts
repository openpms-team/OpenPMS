// Supabase Edge Function: process-messages
// Triggered by pg_cron every minute
// Processes queued messages and sends via configured providers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: messages, error } = await supabase
      .from('message_log')
      .select('id, channel, recipient, template_id, reservation_id')
      .eq('status', 'pending')
      .limit(50)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const results: Array<{ id: string; status: string }> = []

    for (const msg of messages ?? []) {
      // In production: resolve template, send via provider
      // For now, mark as processed
      await supabase
        .from('message_log')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', msg.id)

      results.push({ id: msg.id, status: 'sent' })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }),
      { status: 500 }
    )
  }
})
