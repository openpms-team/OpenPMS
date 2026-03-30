import { describe, it, expect } from 'vitest'
import {
  resolveTemplate,
  selectLanguageVersion,
  escapeHtml,
  formatDateForLocale,
  formatCurrency,
} from '../template-engine'

describe('resolveTemplate', () => {
  it('resolves all variable types', () => {
    const result = resolveTemplate(
      'Hello {{guest_name}}, welcome to {{property_name}}!',
      { guest_name: 'João', property_name: 'Beach House' }
    )
    expect(result).toBe('Hello João, welcome to Beach House!')
  })

  it('keeps unknown variables unchanged', () => {
    const result = resolveTemplate('Hello {{unknown_var}}', {})
    expect(result).toBe('Hello {{unknown_var}}')
  })

  it('handles empty context', () => {
    const result = resolveTemplate('No vars here', {})
    expect(result).toBe('No vars here')
  })

  it('resolves numeric values', () => {
    const result = resolveTemplate('Nights: {{num_nights}}', {
      num_nights: 5,
    })
    expect(result).toBe('Nights: 5')
  })
})

describe('selectLanguageVersion', () => {
  const body = { pt: 'Olá', en: 'Hello', fr: 'Bonjour' }

  it('selects guest language when available', () => {
    expect(selectLanguageVersion(body, 'fr')).toBe('Bonjour')
  })

  it('falls back to EN when guest language not available', () => {
    expect(selectLanguageVersion(body, 'de')).toBe('Hello')
  })

  it('falls back to PT when EN not available', () => {
    const ptOnly = { pt: 'Olá' }
    expect(selectLanguageVersion(ptOnly, 'de')).toBe('Olá')
  })
})

describe('escapeHtml', () => {
  it('escapes HTML characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })
})

describe('formatDateForLocale', () => {
  it('formats date in Portuguese locale', () => {
    const result = formatDateForLocale('2025-06-15', 'pt-PT')
    expect(result).toContain('2025')
    expect(result).toContain('15')
  })
})

describe('formatCurrency', () => {
  it('formats EUR correctly', () => {
    const result = formatCurrency(450, 'EUR', 'pt-PT')
    expect(result).toContain('450')
  })
})
