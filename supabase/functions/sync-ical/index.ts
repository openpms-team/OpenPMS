// Supabase Edge Function: sync-ical
// Triggered by pg_cron every 5 minutes
// Fetches all properties with ical_urls and syncs each feed

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, name, ical_urls')
      .eq('active', true)
      .not('ical_urls', 'eq', '[]')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    const results: Array<{
      propertyId: string
      propertyName: string
      feeds: number
      status: string
    }> = []

    for (const property of properties ?? []) {
      const feeds = (property.ical_urls ?? []) as Array<{
        name: string
        url: string
      }>

      for (let i = 0; i < feeds.length; i++) {
        try {
          // In production, this would call the sync logic
          // For now, log the intent
          results.push({
            propertyId: property.id,
            propertyName: property.name,
            feeds: feeds.length,
            status: 'sync_scheduled',
          })
        } catch (err) {
          results.push({
            propertyId: property.id,
            propertyName: property.name,
            feeds: feeds.length,
            status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
          })
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }),
      { status: 500 }
    )
  }
})
