'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Receipt, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface ExpenseRow {
  id: string
  date: string
  category: string
  description: string
  amount: number
  property_id: string | null
  properties: { name: string } | null
}

interface PropertyOption {
  id: string
  name: string
}

const CATEGORIES = ['cleaning', 'maintenance', 'utilities', 'supplies', 'commission', 'insurance', 'other'] as const

function categoryVariant(cat: string) {
  switch (cat) {
    case 'cleaning': return 'default' as const
    case 'maintenance': return 'secondary' as const
    case 'utilities': return 'outline' as const
    default: return 'outline' as const
  }
}

interface ExpensesManagerProps {
  initialExpenses: ExpenseRow[]
  properties: PropertyOption[]
}

export function ExpensesManager({ initialExpenses, properties }: ExpensesManagerProps) {
  const t = useTranslations('finance')
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses)
  const [showForm, setShowForm] = useState(false)

  const [filterProperty, setFilterProperty] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [formPropertyId, setFormPropertyId] = useState('')
  const [formCategory, setFormCategory] = useState<string>('other')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  async function fetchExpenses() {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('expenses')
        .select('id, date, category, description, amount, property_id, properties(name)')
        .order('date', { ascending: false })
      if (data) setExpenses(data as unknown as ExpenseRow[])
    } catch {
      // RLS or connection error
    }
  }

  const filtered = expenses.filter((exp) => {
    if (filterProperty && exp.property_id !== filterProperty) return false
    if (filterCategory && exp.category !== filterCategory) return false
    return true
  })

  async function handleAddExpense() {
    if (!formAmount) { toast.error('O valor é obrigatório'); return }
    if (!formDate) { toast.error('A data é obrigatória'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('expenses').insert({
        property_id: formPropertyId || null,
        category: formCategory,
        description: formDescription,
        amount: parseFloat(formAmount),
        date: formDate,
      })
      if (error) {
        toast.error(error.message || t('expenseError'))
        return
      }
      toast.success(t('expenseAdded'))
      setFormPropertyId('')
      setFormCategory('other')
      setFormDescription('')
      setFormAmount('')
      setFormDate(new Date().toISOString().slice(0, 10))
      setShowForm(false)
      fetchExpenses()
    } catch {
      toast.error(t('expenseError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('expenses')}</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> {t('addExpense')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="text-sm font-semibold">{t('addExpense')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('property')}</Label>
              <select
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">{t('allProperties')}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t('category')}</Label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t('description')}</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('description')}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('amount')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>{t('date')}</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddExpense} disabled={saving}>
                {saving ? t('saving') : t('addExpense')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('allProperties')}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t('allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t('noExpenses')}</h3>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('property')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead>{t('description')}</TableHead>
              <TableHead>{t('amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell>{exp.date}</TableCell>
                <TableCell>{exp.properties?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={categoryVariant(exp.category)}>
                    {t(exp.category as typeof CATEGORIES[number])}
                  </Badge>
                </TableCell>
                <TableCell>{exp.description}</TableCell>
                <TableCell className="font-medium">{exp.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
