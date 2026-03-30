'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  active: boolean
}

const ROLES = ['admin', 'manager', 'receptionist', 'cleaner', 'owner'] as const

function roleBadgeVariant(role: string) {
  switch (role) {
    case 'admin': return 'default' as const
    case 'manager': return 'secondary' as const
    case 'receptionist': return 'outline' as const
    default: return 'secondary' as const
  }
}

interface TeamManagerProps {
  initialStaff: StaffMember[]
}

export function TeamManager({ initialStaff }: TeamManagerProps) {
  const t = useTranslations('team')
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('receptionist')

  async function fetchStaff() {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('staff')
        .select('id, name, email, role, phone, active')
        .order('created_at', { ascending: false })
      if (data) setStaff(data)
    } catch {
      // RLS or connection error
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('staff')
        .insert({ email: inviteEmail.trim(), role: inviteRole, name: inviteEmail.split('@')[0] })
      if (error) { toast.error(t('inviteError')); return }
      toast.success(t('inviteSent'))
      setInviteEmail('')
      fetchStaff()
    } catch {
      toast.error(t('inviteError'))
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    try {
      const { updateStaffRoleAction } = await import('./actions')
      const result = await updateStaffRoleAction(id, newRole)
      if ('error' in result && result.error) { toast.error(result.error); return }
      setStaff((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)))
      toast.success(t('roleUpdated'))
    } catch {
      toast.error(t('roleError'))
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      const { toggleStaffActiveAction } = await import('./actions')
      const result = await toggleStaffActiveAction(id, active)
      if ('error' in result && result.error) { toast.error(result.error); return }
      setStaff((prev) => prev.map((m) => (m.id === id ? { ...m, active: !active } : m)))
    } catch {
      toast.error(t('toggleError'))
    }
  }

  return (
    <>
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">{t('inviteStaff')}</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            type="email"
            placeholder={t('inviteEmail')}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="sm:max-w-xs"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(r)}</option>
            ))}
          </select>
          <Button onClick={handleInvite}>{t('invite')}</Button>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noMembers')}</h3>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('phone')}</TableHead>
              <TableHead>{t('active')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="h-7 rounded border border-border bg-background px-2 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{t(r)}</option>
                    ))}
                  </select>
                  <Badge variant={roleBadgeVariant(member.role)} className="ml-2">
                    {t(member.role as typeof ROLES[number])}
                  </Badge>
                </TableCell>
                <TableCell>{member.phone ?? '—'}</TableCell>
                <TableCell>
                  <Switch
                    checked={member.active}
                    onCheckedChange={() => handleToggleActive(member.id, member.active)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
