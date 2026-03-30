import { NextRequest, NextResponse } from 'next/server'
import { testSIBAConnection } from '@/lib/integrations/sef/siba'

export async function POST(request: NextRequest) {
  try {
    const { nif, establishment_id, access_key } = (await request.json()) as {
      nif: string
      establishment_id: string
      access_key: string
    }

    if (!nif || !establishment_id || !access_key) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
    }

    const success = await testSIBAConnection({
      nif,
      establishmentId: establishment_id,
      accessKey: access_key,
    })

    return NextResponse.json({ success })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Teste falhou' },
      { status: 500 }
    )
  }
}
