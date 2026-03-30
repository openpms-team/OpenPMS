import fs from 'fs'
import path from 'path'

const LOCALES = ['pt', 'en', 'fr']
const messagesDir = path.join(process.cwd(), 'src', 'messages')

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return flattenKeys(value as Record<string, unknown>, fullKey)
    }
    return [fullKey]
  })
}

let hasErrors = false

const allKeys: Record<string, string[]> = {}

for (const locale of LOCALES) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  allKeys[locale] = flattenKeys(content)
}

const referenceLocale = 'pt'
const referenceKeys = new Set(allKeys[referenceLocale])

for (const locale of LOCALES) {
  if (locale === referenceLocale) continue

  const localeKeys = new Set(allKeys[locale])

  for (const key of referenceKeys) {
    if (!localeKeys.has(key)) {
      console.error(`Missing key in ${locale}.json: ${key}`)
      hasErrors = true
    }
  }

  for (const key of localeKeys) {
    if (!referenceKeys.has(key)) {
      console.warn(`Extra key in ${locale}.json: ${key}`)
    }
  }
}

if (hasErrors) {
  process.exit(1)
} else {
  console.log('All translation files are in sync.')
}
