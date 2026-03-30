import { createClient } from '@/lib/supabase/server'

export interface StatementBreakdown {
  reservationId: string
  propertyName: string
  guestName: string
  checkIn: string
  checkOut: string
  revenue: number
  expenses: number
  commission: number
  net: number
}

export interface GeneratedStatement {
  ownerId: string
  periodStart: string
  periodEnd: string
  totalRevenue: number
  totalExpenses: number
  totalCommission: number
  netAmount: number
  breakdown: StatementBreakdown[]
}

export async function generateStatement(
  ownerId: string,
  periodStart: string,
  periodEnd: string
): Promise<GeneratedStatement> {
  const supabase = await createClient()

  // Get owner's properties with commission info
  const { data: ownerProperties } = await supabase
    .from('owner_properties')
    .select('property_id, commission_type, commission_value, properties(name)')
    .eq('owner_id', ownerId)

  if (!ownerProperties?.length) {
    return {
      ownerId,
      periodStart,
      periodEnd,
      totalRevenue: 0,
      totalExpenses: 0,
      totalCommission: 0,
      netAmount: 0,
      breakdown: [],
    }
  }

  const propertyIds = ownerProperties.map((op) => op.property_id)

  // Get reservations in period
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, property_id, guest_name, check_in, check_out, total_amount')
    .in('property_id', propertyIds)
    .gte('check_out', periodStart)
    .lte('check_in', periodEnd)
    .in('status', ['checked_out', 'checked_in', 'confirmed'])

  // Get expenses in period
  const { data: expenses } = await supabase
    .from('expenses')
    .select('property_id, amount')
    .in('property_id', propertyIds)
    .gte('date', periodStart)
    .lte('date', periodEnd)

  const expensesByProperty = new Map<string, number>()
  for (const exp of expenses ?? []) {
    const current = expensesByProperty.get(exp.property_id) ?? 0
    expensesByProperty.set(exp.property_id, current + Number(exp.amount))
  }

  const breakdown: StatementBreakdown[] = []
  let totalRevenue = 0
  let totalExpenses = 0
  let totalCommission = 0

  for (const reservation of reservations ?? []) {
    const revenue = Number(reservation.total_amount) || 0
    const op = ownerProperties.find((p) => p.property_id === reservation.property_id)
    const propertyName = (op?.properties as unknown as { name: string } | null)?.name ?? ''

    // Calculate commission
    let commission = 0
    if (op) {
      if (op.commission_type === 'percentage') {
        commission = revenue * (Number(op.commission_value) / 100)
      } else {
        commission = Number(op.commission_value)
      }
    }

    // Proportional expenses for this reservation
    const propertyExpenses = expensesByProperty.get(reservation.property_id) ?? 0
    const reservationCount = (reservations ?? []).filter(
      (r) => r.property_id === reservation.property_id
    ).length
    const expenseShare = reservationCount > 0 ? propertyExpenses / reservationCount : 0

    const net = revenue - expenseShare - commission

    breakdown.push({
      reservationId: reservation.id,
      propertyName,
      guestName: reservation.guest_name,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      revenue,
      expenses: Math.round(expenseShare * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      net: Math.round(net * 100) / 100,
    })

    totalRevenue += revenue
    totalExpenses += expenseShare
    totalCommission += commission
  }

  return {
    ownerId,
    periodStart,
    periodEnd,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    netAmount: Math.round((totalRevenue - totalExpenses - totalCommission) * 100) / 100,
    breakdown,
  }
}
