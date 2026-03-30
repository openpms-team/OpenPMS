import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSIBAXml, sendViaSIBAWebService } from '@/lib/integrations/sef/siba'
import type { SIBABulletin, SIBACredentials } from '@/lib/integrations/sef/types'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Get SEF config
    const { data: config } = await supabase
      .from('integration_config')
      .select('config, enabled')
      .eq('type', 'sef')
      .single()

    if (!config?.enabled) {
      return NextResponse.json({ message: 'SEF integration not enabled', sent: 0 })
    }

    const sefConfig = typeof config.config === 'string'
      ? JSON.parse(config.config)
      : config.config as Record<string, string>

    const credentials: SIBACredentials = {
      nif: sefConfig.nif ?? '',
      establishmentId: sefConfig.establishment_id ?? '',
      accessKey: sefConfig.access_key ?? '',
    }

    if (!credentials.nif || !credentials.establishmentId || !credentials.accessKey) {
      return NextResponse.json({ error: 'SEF credentials incomplete', sent: 0 })
    }

    // Get pending bulletins with guest and reservation data
    const { data: bulletins } = await supabase
      .from('sef_bulletins')
      .select(`
        id, reservation_id, guest_id, method,
        guests(full_name, date_of_birth, nationality_icao, document_type, document_number, document_country),
        reservations(check_in, check_out)
      `)
      .eq('status', 'pending')
      .limit(50)

    if (!bulletins?.length) {
      return NextResponse.json({ message: 'No pending bulletins', sent: 0 })
    }

    // Build SIBA bulletins
    const sibaBulletins: SIBABulletin[] = []
    const bulletinIds: string[] = []

    for (const b of bulletins) {
      const guest = b.guests as unknown as {
        full_name: string
        date_of_birth: string | null
        nationality_icao: string | null
        document_type: string | null
        document_number: string | null
        document_country: string | null
      } | null

      const reservation = b.reservations as unknown as {
        check_in: string
        check_out: string
      } | null

      if (!guest || !reservation) continue

      // Split name into first/last
      const nameParts = (guest.full_name ?? '').trim().split(' ')
      const firstName = nameParts[0] ?? ''
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName

      sibaBulletins.push({
        lastName,
        firstName,
        nationality: guest.nationality_icao ?? 'UNK',
        dateOfBirth: guest.date_of_birth ?? '1990-01-01',
        documentType: guest.document_type ?? 'passport',
        documentNumber: guest.document_number ?? '',
        issuingCountry: guest.document_country ?? guest.nationality_icao ?? 'UNK',
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
      })
      bulletinIds.push(b.id)
    }

    if (sibaBulletins.length === 0) {
      return NextResponse.json({ message: 'No valid bulletins to send', sent: 0 })
    }

    // Generate XML and send
    const xml = generateSIBAXml(sibaBulletins)
    const useDev = sefConfig.preferred_method === 'dev' || !sefConfig.preferred_method
    const result = await sendViaSIBAWebService(xml, credentials, useDev)

    // Update bulletin statuses
    const newStatus = result.success ? 'submitted' : 'error'
    const errorMsg = result.success ? null : result.message

    for (const id of bulletinIds) {
      await supabase
        .from('sef_bulletins')
        .update({
          status: newStatus,
          xml_content: xml,
          response_xml: result.details ?? null,
          submitted_at: result.success ? new Date().toISOString() : null,
          error_message: errorMsg,
        })
        .eq('id', id)
    }

    return NextResponse.json({
      sent: bulletinIds.length,
      success: result.success,
      message: result.message,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'SEF submission failed' },
      { status: 500 }
    )
  }
}
