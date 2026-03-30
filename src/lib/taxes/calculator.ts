export interface TaxCalculationInput {
  reservationId: string
  propertyId: string
  jurisdictionId: string | null
  checkIn: string
  checkOut: string
  guests: Array<{ age: number; nationality: string; exemptions?: string[] }>
}

export interface TaxCalculationResult {
  jurisdictionId: string | null
  jurisdictionName: string
  guestsTotal: number
  guestsTaxable: number
  nightsTotal: number
  nightsTaxable: number
  ratePerNightPerGuest: number
  totalAmount: number
  exemptionsApplied: Array<{
    guestIndex: number
    exemptionType: string
    reason: string
  }>
  breakdown: Array<{
    date: string
    rate: number
    guestsCharged: number
    subtotal: number
  }>
}

export interface TaxRule {
  id: string
  rate_amount: number
  rate_type: string
  season_start: string | null
  season_end: string | null
  max_nights: number | null
  min_guest_age: number
  priority: number
}

export interface TaxExemption {
  type: string
  description: string | null
  condition_json: Record<string, unknown>
}

function getDaysBetween(checkIn: string, checkOut: string): string[] {
  const days: string[] = []
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const current = new Date(start)
  while (current < end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

function isInSeason(date: string, seasonStart: string | null, seasonEnd: string | null): boolean {
  if (!seasonStart || !seasonEnd) return true
  const mmdd = date.slice(5) // MM-DD
  const start = seasonStart.slice(5)
  const end = seasonEnd.slice(5)
  if (start <= end) return mmdd >= start && mmdd <= end
  return mmdd >= start || mmdd <= end // wrap around year
}

function findApplicableRule(date: string, rules: TaxRule[]): TaxRule | null {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority)
  for (const rule of sorted) {
    if (isInSeason(date, rule.season_start, rule.season_end)) {
      return rule
    }
  }
  return sorted[0] ?? null
}

export function calculateTouristTax(
  input: TaxCalculationInput,
  rules: TaxRule[],
  exemptions: TaxExemption[],
  jurisdictionName: string
): TaxCalculationResult {
  const result: TaxCalculationResult = {
    jurisdictionId: input.jurisdictionId,
    jurisdictionName,
    guestsTotal: input.guests.length,
    guestsTaxable: 0,
    nightsTotal: 0,
    nightsTaxable: 0,
    ratePerNightPerGuest: 0,
    totalAmount: 0,
    exemptionsApplied: [],
    breakdown: [],
  }

  if (!input.jurisdictionId || rules.length === 0) return result

  const days = getDaysBetween(input.checkIn, input.checkOut)
  result.nightsTotal = days.length

  // Determine taxable guests
  const taxableGuests: number[] = []
  input.guests.forEach((guest, index) => {
    // Check age exemption
    const firstRule = rules[0]
    if (firstRule && guest.age < firstRule.min_guest_age) {
      result.exemptionsApplied.push({
        guestIndex: index,
        exemptionType: 'age',
        reason: `Under ${firstRule.min_guest_age} years old`,
      })
      return
    }

    // Check explicit exemptions
    if (guest.exemptions?.length) {
      for (const ex of guest.exemptions) {
        const found = exemptions.find((e) => e.type === ex)
        if (found) {
          result.exemptionsApplied.push({
            guestIndex: index,
            exemptionType: ex,
            reason: found.description ?? ex,
          })
          return
        }
      }
    }

    taxableGuests.push(index)
  })

  result.guestsTaxable = taxableGuests.length
  if (taxableGuests.length === 0) return result

  // Calculate per night
  let nightsCounted = 0
  const maxNights = rules[0]?.max_nights ?? null

  for (const day of days) {
    if (maxNights !== null && nightsCounted >= maxNights) break

    const rule = findApplicableRule(day, rules)
    if (!rule) continue

    nightsCounted++
    const subtotal = rule.rate_amount * taxableGuests.length

    result.breakdown.push({
      date: day,
      rate: rule.rate_amount,
      guestsCharged: taxableGuests.length,
      subtotal,
    })

    result.totalAmount += subtotal
  }

  result.nightsTaxable = nightsCounted
  // Use weighted average if rates differ across nights
  result.ratePerNightPerGuest =
    nightsCounted > 0 && taxableGuests.length > 0
      ? Math.round((result.totalAmount / nightsCounted / taxableGuests.length) * 100) / 100
      : 0
  result.totalAmount = Math.round(result.totalAmount * 100) / 100

  return result
}
