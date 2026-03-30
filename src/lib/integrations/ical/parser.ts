import ical from 'node-ical'

export interface ParsedEvent {
  uid: string
  summary: string
  startDate: string
  endDate: string
  description: string | null
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseICalString(icalString: string): ParsedEvent[] {
  const parsed = ical.sync.parseICS(icalString)
  const events: ParsedEvent[] = []

  for (const key of Object.keys(parsed)) {
    const component = parsed[key]
    if (!component || component.type !== 'VEVENT') continue

    const event = component as ical.VEvent
    if (!event.uid || !event.start || !event.end) continue

    const summary = typeof event.summary === 'string'
      ? event.summary
      : (event.summary?.val ?? '')
    const description = typeof event.description === 'string'
      ? event.description
      : (event.description?.val ?? null)

    events.push({
      uid: event.uid,
      summary,
      startDate: formatDate(new Date(event.start)),
      endDate: formatDate(new Date(event.end)),
      description: description || null,
    })
  }

  return events
}

export async function fetchICalFeed(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.status}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}
