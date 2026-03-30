// Portuguese public holidays (fixed dates)
const PT_FIXED_HOLIDAYS = [
  '01-01', // Ano Novo
  '04-25', // Dia da Liberdade
  '05-01', // Dia do Trabalhador
  '06-10', // Dia de Portugal
  '08-15', // Assunção de Nossa Senhora
  '10-05', // Implantação da República
  '11-01', // Todos os Santos
  '12-01', // Restauração da Independência
  '12-08', // Imaculada Conceição
  '12-25', // Natal
]

// Easter-based holidays (computed dynamically)
function computeEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function getPortugueseHolidays(year: number): Set<string> {
  const holidays = new Set<string>()

  // Fixed holidays
  for (const mmdd of PT_FIXED_HOLIDAYS) {
    holidays.add(`${year}-${mmdd}`)
  }

  // Easter-based
  const easter = computeEasterDate(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  const corpusChristi = new Date(easter)
  corpusChristi.setDate(easter.getDate() + 60)

  holidays.add(formatDate(easter))
  holidays.add(formatDate(goodFriday))
  holidays.add(formatDate(corpusChristi))

  return holidays
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

/**
 * Calculate SIBA deadline: check_in + 3 business days
 * Excludes weekends and Portuguese public holidays
 */
export function calculateSIBADeadline(checkInDate: string): string {
  const date = new Date(checkInDate)
  const year = date.getFullYear()
  const holidays = new Set([
    ...getPortugueseHolidays(year),
    ...getPortugueseHolidays(year + 1),
  ])

  let businessDays = 0
  const current = new Date(date)

  while (businessDays < 3) {
    current.setDate(current.getDate() + 1)
    const dateStr = formatDate(current)
    if (!isWeekend(current) && !holidays.has(dateStr)) {
      businessDays++
    }
  }

  return formatDate(current)
}
