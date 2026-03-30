interface TemplateContext {
  guest_name: string
  property_name: string
  check_in_date: string
  check_out_date: string
  num_nights: number
  total_amount: string
  checkin_link: string
  door_code: string
  wifi_ssid: string
  wifi_password: string
  property_address: string
  tourist_tax: string
  host_name: string
  host_phone: string
}

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g

export function resolveTemplate(
  template: string,
  context: Partial<TemplateContext>
): string {
  return template.replace(VARIABLE_REGEX, (match, key: string) => {
    const value = context[key as keyof TemplateContext]
    return value != null ? String(value) : match
  })
}

export function selectLanguageVersion(
  body: Record<string, string>,
  guestLanguage: string | null
): string {
  if (guestLanguage && body[guestLanguage]) return body[guestLanguage]
  if (body.en) return body.en
  if (body.pt) return body.pt
  return Object.values(body)[0] ?? ''
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function formatDateForLocale(
  dateStr: string,
  locale: string
): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function buildTemplateContext(
  reservation: {
    guest_name: string
    check_in: string
    check_out: string
    num_nights: number | null
    total_amount: number | null
    currency: string
    door_code: string | null
  },
  property: {
    name: string
    address: string | null
    wifi_name: string | null
    wifi_password: string | null
  },
  checkinLink: string,
  locale: string
): TemplateContext {
  return {
    guest_name: reservation.guest_name,
    property_name: property.name,
    check_in_date: formatDateForLocale(reservation.check_in, locale),
    check_out_date: formatDateForLocale(reservation.check_out, locale),
    num_nights: reservation.num_nights ?? 0,
    total_amount: reservation.total_amount
      ? formatCurrency(reservation.total_amount, reservation.currency, locale)
      : '',
    checkin_link: checkinLink,
    door_code: reservation.door_code ?? '',
    wifi_ssid: property.wifi_name ?? '',
    wifi_password: property.wifi_password ?? '',
    property_address: property.address ?? '',
    tourist_tax: '',
    host_name: '',
    host_phone: '',
  }
}
