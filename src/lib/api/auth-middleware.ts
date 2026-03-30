import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rate limiter: 100 requests per minute per key prefix
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(keyPrefix: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(keyPrefix)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(keyPrefix, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= 100
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export interface AuthenticatedRequest {
  staffId: string
  permissions: string[]
}

export async function authenticateAPIKey(
  request: NextRequest
): Promise<{ auth: AuthenticatedRequest } | { error: NextResponse }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer opms_')) {
    return {
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid API key' } },
        { status: 401 }
      ),
    }
  }

  const apiKey = authHeader.slice(7) // Remove 'Bearer '
  const keyPrefix = apiKey.slice(0, 12)

  // Rate limit check
  if (!checkRateLimit(keyPrefix)) {
    return {
      error: NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Max 100 per minute.' } },
        { status: 429 }
      ),
    }
  }

  const keyHash = hashKey(apiKey)
  const supabase = await createClient()

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('id, staff_id, permissions, revoked_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyRecord) {
    return {
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
        { status: 401 }
      ),
    }
  }

  if (keyRecord.revoked_at) {
    return {
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'API key has been revoked' } },
        { status: 401 }
      ),
    }
  }

  // Update last_used_at (non-blocking)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)
    .then(() => {})

  return {
    auth: {
      staffId: keyRecord.staff_id,
      permissions: (keyRecord.permissions ?? ['*']) as string[],
    },
  }
}

export function apiSuccess(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta && { meta }) })
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}
