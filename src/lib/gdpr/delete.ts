import { createClient } from '@/lib/supabase/server'

export async function deleteGuestData(guestId: string) {
  const supabase = await createClient()

  const { data: guest } = await supabase
    .from('guests')
    .select('id, reservation_id')
    .eq('id', guestId)
    .single()

  if (!guest) throw new Error('Guest not found')

  // Anonymize guest record (keep structure for SEF compliance)
  await supabase
    .from('guests')
    .update({
      full_name: 'Deleted',
      email: null,
      phone: null,
      date_of_birth: null,
      nationality_icao: null,
      document_type: null,
      document_number: null,
      document_country: null,
      document_expiry: null,
      address: null,
      signature: null,
    })
    .eq('id', guestId)

  // Anonymize SEF bulletins (keep record for legal, anonymize personal data)
  await supabase
    .from('sef_bulletins')
    .update({ xml_content: null, response_xml: null })
    .eq('guest_id', guestId)

  // Delete message log entries for this reservation
  await supabase
    .from('message_log')
    .delete()
    .eq('reservation_id', guest.reservation_id)

  return { anonymized: true, guestId }
}
