'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Users, Pencil, Trash2, Link2, X } from 'lucide-react'
import {
  createOwnerAction,
  updateOwnerAction,
  deleteOwnerAction,
  linkPropertyAction,
  unlinkPropertyAction,
} from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
}

interface PropertyOption {
  id: string
  name: string
  owner_id: string | null
}

interface OwnerProperty {
  property_id: string
  property_name: string
  commission_type: string
  commission_value: number
}

interface OwnersManagerProps {
  initialOwners: OwnerRow[]
  properties: PropertyOption[]
  ownerProperties: Array<{
    owner_id: string
    property_id: string
    commission_type: string
    commission_value: number
    properties: { name: string } | null
  }>
}

export function OwnersManager({ initialOwners, properties, ownerProperties }: OwnersManagerProps) {
  const t = useTranslations('owners')
  const tc = useTranslations('common')
  const router = useRouter()
  const [owners, setOwners] = useState<OwnerRow[]>(initialOwners)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formNif, setFormNif] = useState('')
  const [formIban, setFormIban] = useState('')
  const [saving, setSaving] = useState(false)

  // Link property
  const [linkingOwnerId, setLinkingOwnerId] = useState<string | null>(null)
  const [linkPropertyId, setLinkPropertyId] = useState('')
  const [linkCommission, setLinkCommission] = useState('20')

  function resetForm() {
    setFormName(''); setFormEmail(''); setFormPhone(''); setFormNif(''); setFormIban('')
    setEditingId(null)
  }

  function startEdit(owner: OwnerRow) {
    setFormName(owner.name)
    setFormEmail(owner.email)
    setFormPhone(owner.phone ?? '')
    setFormNif(owner.nif ?? '')
    setFormIban(owner.iban ?? '')
    setEditingId(owner.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error('O nome é obrigatório'); return }
    if (!formEmail.trim()) { toast.error('O email é obrigatório'); return }
    setSaving(true)
    try {
      if (editingId) {
        const result = await updateOwnerAction(editingId, {
          name: formName, email: formEmail,
          phone: formPhone || undefined, nif: formNif || undefined, iban: formIban || undefined,
        })
        if ('error' in result && result.error) { toast.error(result.error); return }
        toast.success('Proprietário atualizado')
      } else {
        const result = await createOwnerAction({
          name: formName, email: formEmail,
          phone: formPhone || undefined, nif: formNif || undefined, iban: formIban || undefined,
        })
        if ('error' in result && result.error) { toast.error(result.error); return }
        toast.success('Proprietário criado')
      }
      resetForm()
      setShowForm(false)
      router.refresh()
    } catch {
      toast.error('Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem a certeza que deseja eliminar este proprietário?')) return
    const result = await deleteOwnerAction(id)
    if ('error' in result && result.error) { toast.error(result.error); return }
    toast.success('Proprietário eliminado')
    router.refresh()
  }

  async function handleLinkProperty() {
    if (!linkingOwnerId || !linkPropertyId) return
    const result = await linkPropertyAction(
      linkingOwnerId, linkPropertyId, 'percentage', parseFloat(linkCommission) || 0
    )
    if ('error' in result && result.error) { toast.error(result.error); return }
    toast.success('Propriedade associada')
    setLinkingOwnerId(null)
    setLinkPropertyId('')
    router.refresh()
  }

  async function handleUnlink(ownerId: string, propertyId: string) {
    const result = await unlinkPropertyAction(ownerId, propertyId)
    if ('error' in result && result.error) { toast.error(result.error); return }
    toast.success('Propriedade desassociada')
    router.refresh()
  }

  function getOwnerProperties(ownerId: string) {
    return ownerProperties
      .filter(op => op.owner_id === ownerId)
      .map(op => ({
        property_id: op.property_id,
        property_name: (op.properties as unknown as { name: string } | null)?.name ?? '—',
        commission_type: op.commission_type,
        commission_value: Number(op.commission_value),
      }))
  }

  const availableProperties = properties.filter(
    p => !ownerProperties.some(op => op.property_id === p.id)
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          <Plus className="mr-2 h-4 w-4" /> {t('addOwner')}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar proprietário' : t('addOwner')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>NIF</Label>
                <Input value={formNif} onChange={e => setFormNif(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>IBAN</Label>
                <Input value={formIban} onChange={e => setFormIban(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Criar proprietário'}
              </Button>
              <Button variant="outline" onClick={() => { resetForm(); setShowForm(false) }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {owners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noOwners')}</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {owners.map(owner => {
            const props = getOwnerProperties(owner.id)
            return (
              <Card key={owner.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{owner.name}</h3>
                      <p className="text-muted-foreground">{owner.email}</p>
                      {owner.phone && <p className="text-sm text-muted-foreground">{owner.phone}</p>}
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {owner.nif && <span>NIF: {owner.nif}</span>}
                        {owner.iban && <span>IBAN: {owner.iban}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(owner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(owner.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Linked properties */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Propriedades:</span>
                      <Button variant="outline" size="sm" onClick={() => setLinkingOwnerId(
                        linkingOwnerId === owner.id ? null : owner.id
                      )}>
                        <Link2 className="mr-1 h-3 w-3" />
                        Associar
                      </Button>
                    </div>

                    {props.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem propriedades associadas</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {props.map(p => (
                          <Badge key={p.property_id} variant="secondary" className="gap-1">
                            {p.property_name} ({p.commission_value}%)
                            <button onClick={() => handleUnlink(owner.id, p.property_id)} className="ml-1 hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {linkingOwnerId === owner.id && (
                      <div className="mt-2 flex items-end gap-2 p-3 rounded-lg bg-muted/50">
                        <div className="space-y-1 flex-1">
                          <Label>Propriedade</Label>
                          <select
                            value={linkPropertyId}
                            onChange={e => setLinkPropertyId(e.target.value)}
                            className="h-10 w-full rounded-lg border border-input bg-transparent px-3"
                          >
                            <option value="">Selecionar...</option>
                            {availableProperties.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 w-32">
                          <Label>Comissão (%)</Label>
                          <Input value={linkCommission} onChange={e => setLinkCommission(e.target.value)} type="number" min="0" max="100" />
                        </div>
                        <Button onClick={handleLinkProperty} disabled={!linkPropertyId}>
                          Associar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
