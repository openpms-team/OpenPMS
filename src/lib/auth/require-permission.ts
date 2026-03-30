import { createClient } from '@/lib/supabase/server'
import { hasPermission } from './permissions'
import type { UserRole } from '@/types/database'

interface AuthResult {
  authorized: boolean
  error?: string
  userId?: string
  role?: UserRole
}

export async function requirePermission(
  permission: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!staff) {
    return { authorized: false, error: 'No active staff profile' }
  }

  const role = staff.role as UserRole
  if (!hasPermission(role, permission)) {
    return { authorized: false, error: 'Insufficient permissions' }
  }

  return { authorized: true, userId: user.id, role }
}
