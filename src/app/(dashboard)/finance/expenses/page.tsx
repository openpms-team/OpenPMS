import { createClient } from '@/lib/supabase/server'
import { ExpensesManager } from './ExpensesManager'

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

export default async function ExpensesPage() {
  let expenses: ExpenseRow[] = []
  let properties: PropertyOption[] = []

  try {
    const supabase = await createClient()
    const [expRes, propsRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, date, category, description, amount, property_id, properties(name)')
        .order('date', { ascending: false }),
      supabase.from('properties').select('id, name').order('name'),
    ])
    if (expRes.data) expenses = expRes.data as unknown as ExpenseRow[]
    if (propsRes.data) properties = propsRes.data
  } catch {
    // RLS or connection error
  }

  return (
    <div className="space-y-6">
      <ExpensesManager
        initialExpenses={expenses}
        properties={properties}
      />
    </div>
  )
}
