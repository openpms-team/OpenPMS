import type { Reservation } from '@/types/database'

export interface AutomationCondition {
  field: 'num_guests' | 'num_nights' | 'guest_language' | 'source' | 'total_amount' | 'property_id'
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in'
  value: string | number | string[]
}

export interface AutomationRule {
  match: 'all' | 'any'
  conditions: AutomationCondition[]
}

type FieldValue = string | number | null | undefined

function getFieldValue(reservation: Reservation, field: string): FieldValue {
  const map: Record<string, FieldValue> = {
    num_guests: reservation.num_guests,
    num_nights: reservation.num_nights,
    source: reservation.source,
    total_amount: reservation.total_amount,
    property_id: reservation.property_id,
    guest_language: null, // would come from guest data
  }
  return map[field]
}

function evaluateCondition(
  condition: AutomationCondition,
  reservation: Reservation
): boolean {
  const fieldValue = getFieldValue(reservation, condition.field)
  if (fieldValue == null) return false

  const numField = typeof fieldValue === 'number' ? fieldValue : parseFloat(String(fieldValue))
  const numValue = typeof condition.value === 'number' ? condition.value : parseFloat(String(condition.value))

  switch (condition.operator) {
    case 'eq':
      return String(fieldValue) === String(condition.value)
    case 'neq':
      return String(fieldValue) !== String(condition.value)
    case 'gt':
      return !isNaN(numField) && !isNaN(numValue) && numField > numValue
    case 'lt':
      return !isNaN(numField) && !isNaN(numValue) && numField < numValue
    case 'gte':
      return !isNaN(numField) && !isNaN(numValue) && numField >= numValue
    case 'lte':
      return !isNaN(numField) && !isNaN(numValue) && numField <= numValue
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(String(fieldValue))
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(String(fieldValue))
    default:
      return false
  }
}

export function evaluateAutomationRule(
  rule: AutomationRule,
  reservation: Reservation
): boolean {
  if (rule.conditions.length === 0) return true

  if (rule.match === 'all') {
    return rule.conditions.every((c) => evaluateCondition(c, reservation))
  }
  return rule.conditions.some((c) => evaluateCondition(c, reservation))
}
