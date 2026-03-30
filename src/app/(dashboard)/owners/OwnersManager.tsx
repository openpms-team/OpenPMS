'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface OwnerRow {
  id: string
  name: string
  email: string
  phone: string | null
  nif: string | null
  iban: string | null
  properties_count: number
}

interface OwnersManagerProps {
  initialOwners: OwnerRow[]
}

export function OwnersManager({ initialOwners }: OwnersManagerProps) {
  const t = useTranslations('owners')
  const tc = useTranslations('common')
  const [owners, setOwners] = useState<OwnerRow[]>(initialOwners)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formNif, setFormNif] = useState('')
  const [formIban, setFormIban] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchOwners() {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('owners')
        .select('id, name, email, phone, nif, iban, properties_count')
        .order('name')
      if (data) setOwners(data as unknown as OwnerRow[])
    } catch {
      // RLS or connection error
    }
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error('O nome é obrigatório'); return }
    if (!formEmail.trim()) { toast.error('O email é obrigatório'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('owners').insert({
        name: formName,
        email: formEmail,
        phone: formPhone || null,
        nif: formNif || null,
        iban: formIban || null,
      })
      if (error) { toast.error(tc('error')); return }
      toast.success(tc('save'))
      setFormName('')
      setFormEmail('')
      setFormPhone('')
      setFormNif('')
      setFormIban('')
      setShowForm(false)
      fetchOwners()
    } catch {
      toast.error(tc('error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> {t('addOwner')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="text-sm font-semibold">{t('addOwner')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('name')}</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('email')}</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('phone')}</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('nif')}</Label>
              <Input value={formNif} onChange={(e) => setFormNif(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('iban')}</Label>
              <Input value={formIban} onChange={(e) => setFormIban(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? tc('loading') : tc('save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {owners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noOwners')}</h3>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('nif')}</TableHead>
              <TableHead>{t('iban')}</TableHead>
              <TableHead>{t('properties')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {owners.map((owner) => (
              <TableRow key={owner.id}>
                <TableCell className="font-medium">{owner.name}</TableCell>
                <TableCell>{owner.email}</TableCell>
                <TableCell>{owner.nif ?? '—'}</TableCell>
                <TableCell>{owner.iban ?? '—'}</TableCell>
                <TableCell>{owner.properties_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
