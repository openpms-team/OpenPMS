import { NextRequest, NextResponse } from 'next/server'

export function validateOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (origin) {
    const originHost = new URL(origin).host
    if (originHost !== host) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      )
    }
  }

  return null
}
