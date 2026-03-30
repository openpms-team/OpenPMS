import { chromium } from 'playwright'

const BASE = 'https://openpms-test.vercel.app'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const results: Array<{ page: string; status: string; issues: string[] }> = []

  // 1. Login
  console.log('=== LOGIN ===')
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(2000)

  await page.fill('input[type="email"]', 'openpms@protonmail.com')
  await page.fill('input[type="password"]', 'teste123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(4000)

  const afterLoginUrl = page.url()
  console.log('After login URL:', afterLoginUrl)

  if (afterLoginUrl.includes('/login')) {
    const errorText = await page.textContent('.text-destructive').catch(() => null)
    console.log('LOGIN FAILED:', errorText)
    results.push({ page: '/login', status: 'FAILED', issues: [errorText ?? 'Unknown'] })
  } else {
    results.push({ page: '/login', status: 'OK', issues: [] })
    console.log('Login successful')
  }

  // 2. Test all pages
  const pages = [
    '/',
    '/properties',
    '/properties/new',
    '/reservations',
    '/reservations/new',
    '/calendar',
    '/guests',
    '/tasks',
    '/tasks/my',
    '/messages',
    '/team',
    '/finance',
    '/finance/taxes',
    '/finance/invoices',
    '/finance/expenses',
    '/finance/pricing',
    '/owners',
    '/analytics',
    '/analytics/compare',
    '/settings',
    '/settings/integrations',
    '/settings/integrations/messaging',
    '/settings/integrations/sef',
    '/settings/integrations/invoicing',
    '/settings/integrations/pricing',
    '/settings/integrations/ai',
    '/settings/integrations/api',
    '/settings/security',
  ]

  for (const path of pages) {
    console.log(`\n--- ${path} ---`)
    try {
      const response = await page.goto(`${BASE}${path}`, { timeout: 15000 })
      await page.waitForTimeout(2000)

      const status = response?.status() ?? 0
      const url = page.url()
      const issues: string[] = []

      if (status >= 400) issues.push(`HTTP ${status}`)
      if (url.includes('/login') && path !== '/') issues.push('Redirected to login')

      const has404 = await page.$('text=Page not found').catch(() => null)
      if (has404) issues.push('404')

      const hasError = await page.$('text=Something went wrong').catch(() => null)
      if (hasError) issues.push('Error boundary')

      // Check for untranslated tokens
      const bodyText = await page.textContent('body') ?? ''
      const tokenPattern = /\b[a-z]{2,15}\.[a-zA-Z]{3,}[A-Z][a-zA-Z]*\b/g
      const tokens = [...new Set(bodyText.match(tokenPattern) ?? [])]
        .filter(t => !t.includes('vercel') && !t.includes('supabase') && !t.includes('gmail') &&
          !t.includes('smtp') && !t.includes('twilio') && !t.includes('outlook') &&
          !t.includes('com.') && !t.includes('app.') && t.length < 35)
      if (tokens.length > 0) issues.push(`Untranslated: ${tokens.slice(0, 5).join(', ')}`)

      // Check for visible errors in console
      console.log(`  HTTP: ${status} | URL: ${url.replace(BASE, '')}${issues.length ? ' | ISSUES: ' + issues.join('; ') : ' | OK'}`)
      results.push({ page: path, status: issues.length ? 'ISSUE' : 'OK', issues })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Timeout'
      console.log(`  ERROR: ${msg}`)
      results.push({ page: path, status: 'ERROR', issues: [msg] })
    }
  }

  // Summary
  console.log('\n\n========== RESULTS ==========')
  for (const r of results) {
    const icon = r.status === 'OK' ? '✅' : r.status === 'ISSUE' ? '⚠️' : '❌'
    console.log(`${icon} ${r.page.padEnd(35)} ${r.issues.length ? r.issues.join('; ') : ''}`)
  }

  const ok = results.filter(r => r.status === 'OK').length
  const issues = results.filter(r => r.status === 'ISSUE').length
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'FAILED').length
  console.log(`\n✅ ${ok} OK | ⚠️ ${issues} Issues | ❌ ${errors} Errors | Total: ${results.length} pages`)

  await browser.close()
}

main().catch(console.error)
