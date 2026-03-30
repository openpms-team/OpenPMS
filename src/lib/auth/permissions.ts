import type { UserRole } from '@/types/database'

const PERMISSIONS: Record<string, readonly string[]> = {
  admin: ['*'],
  manager: [
    'properties.*', 'reservations.*', 'guests.*', 'tasks.*',
    'messages.*', 'team.read', 'finance.*', 'analytics.*', 'owners.*',
  ],
  receptionist: [
    'reservations.*', 'guests.*', 'messages.read', 'messages.send',
    'tasks.read', 'tasks.own',
  ],
  cleaner: ['tasks.own', 'properties.read'],
  owner: ['properties.read', 'reservations.read', 'finance.read', 'analytics.read'],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false
  if (rolePerms.includes('*')) return true
  if (rolePerms.includes(permission)) return true

  // Check wildcard patterns: 'properties.*' matches 'properties.read'
  const [resource] = permission.split('.')
  return rolePerms.includes(`${resource}.*`)
}

export function filterByPermission<T>(
  role: UserRole,
  items: T[],
  getPermission: (item: T) => string
): T[] {
  return items.filter((item) => hasPermission(role, getPermission(item)))
}

export function getAllowedResources(role: UserRole): string[] {
  const perms = PERMISSIONS[role] ?? []
  if (perms.includes('*')) {
    return [
      'properties', 'reservations', 'guests', 'tasks', 'messages',
      'team', 'finance', 'analytics', 'owners', 'settings',
    ]
  }
  const resources = new Set<string>()
  for (const perm of perms) {
    const [resource] = perm.split('.')
    resources.add(resource)
  }
  return [...resources]
}
