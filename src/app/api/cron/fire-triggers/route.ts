import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date()
    let queued = 0

    // Get all active time-based templates
    const { data: templates } = await supabase
      .from('message_templates')
      .select('id, trigger_type, channel, conditions')
      .eq('active', true)
      .in('trigger_type', ['pre_checkin', 'pre_checkout', 'post_checkout'])

    if (!templates?.length) {
      return NextResponse.json({ queued: 0, message: 'No time-based templates' })
    }

    for (const template of templates) {
      const conditions = template.conditions as { offset_days?: number; offset_hours?: number } | null
      const offsetDays = conditions?.offset_days ?? 0
      const offsetHours = conditions?.offset_hours ?? 0

      // Determine which date field to check
      const dateField = template.trigger_type === 'post_checkout' ? 'check_out'
        : template.trigger_type === 'pre_checkout' ? 'check_out'
        : 'check_in'

      // Calculate target date: for pre_* we look for reservations where date - offset = now
      // For post_* we look for reservations where date + offset = now
      const isPre = template.trigger_type.startsWith('pre_')
      const targetDate = new Date(now)
      if (isPre) {
        targetDate.setDate(targetDate.getDate() + offsetDays)
        targetDate.setHours(targetDate.getHours() + offsetHours)
      } else {
        targetDate.setDate(targetDate.getDate() - offsetDays)
        targetDate.setHours(targetDate.getHours() - offsetHours)
      }
      const targetDateStr = targetDate.toISOString().split('T')[0]

      // Find reservations matching this date
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, guest_email, guest_name')
        .eq(dateField, targetDateStr)
        .in('status', ['confirmed', 'checked_in'])

      if (!reservations?.length) continue

      for (const res of reservations) {
        // Check if already queued (avoid duplicates)
        const { count } = await supabase
          .from('message_log')
          .select('*', { count: 'exact', head: true })
          .eq('reservation_id', res.id)
          .eq('template_id', template.id)

        if (count && count > 0) continue

        // Queue the message
        await supabase.from('message_log').insert({
          reservation_id: res.id,
          template_id: template.id,
          channel: template.channel,
          recipient: res.guest_email ?? '',
          status: 'pending',
        })
        queued++
      }
    }

    return NextResponse.json({ queued })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}
