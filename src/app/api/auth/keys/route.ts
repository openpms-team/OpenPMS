import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff profile' }, { status: 403 })

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, permissions, last_used_at, created_at, revoked_at')
    .eq('staff_id', staff.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: keys ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff profile' }, { status: 403 })

  // Check limit
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', staff.id)
    .is('revoked_at', null)
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: 'Maximum 5 active API keys' }, { status: 400 })
  }

  const { name } = (await request.json()) as { name?: string }
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const rawKey = `opms_${crypto.randomBytes(32).toString('hex')}`
  const keyHash = hashKey(rawKey)

  const { error } = await supabase.from('api_keys').insert({
    staff_id: staff.id,
    name,
    key_hash: keyHash,
    key_prefix: rawKey.slice(0, 12),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the key only once — it cannot be retrieved later
  return NextResponse.json({ data: { key: rawKey, name } })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = (await request.json()) as { id?: string }
  if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 })

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
