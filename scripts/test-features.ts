import { chromium } from 'playwright'

const BASE = 'https://openpms-test.vercel.app'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Login
  console.log('=== LOGIN ===')
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(2000)
  await page.fill('input[type="email"]', 'openpms@protonmail.com')
  await page.fill('input[type="password"]', 'teste123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(4000)
  console.log('URL:', page.url())
  console.log(page.url().includes('/login') ? 'FAIL: Still on login' : 'PASS: Login OK')

  // TEST 1: Create Property
  console.log('\n=== TEST 1: CREATE PROPERTY ===')
  await page.goto(`${BASE}/properties/new`)
  await page.waitForTimeout(2000)
  await page.fill('#name', 'Apartamento Tejo')
  await page.fill('#address', 'Rua Augusta 123, Lisboa')
  await page.fill('#city', 'Lisboa')
  await page.fill('#postal_code', '1100-048')
  await page.fill('#max_guests', '4')
  await page.fill('#num_bedrooms', '2')
  await page.fill('#check_in_time', '15:00')
  await page.fill('#check_out_time', '11:00')
  await page.fill('#al_license', 'AL-12345')
  const saves1 = await page.getByText('Guardar').all()
  if (saves1.length > 0) await saves1[0].click()
  await page.waitForTimeout(4000)
  console.log('After create:', page.url())
  await page.screenshot({ path: '/tmp/feat-1-property.png', fullPage: true })
  console.log(page.url().includes('/properties') && !page.url().includes('/new') ? 'PASS' : 'CHECK screenshot')

  // TEST 2: Property in list
  console.log('\n=== TEST 2: PROPERTY IN LIST ===')
  await page.goto(`${BASE}/properties`)
  await page.waitForTimeout(2000)
  const propText = await page.textContent('body') || ''
  console.log(propText.includes('Apartamento Tejo') ? 'PASS: Property in list' : 'FAIL: Not found')
  await page.screenshot({ path: '/tmp/feat-2-list.png', fullPage: true })

  // TEST 3: Create Reservation
  console.log('\n=== TEST 3: CREATE RESERVATION ===')
  await page.goto(`${BASE}/reservations/new`)
  await page.waitForTimeout(2000)
  // Select first property
  const selects = await page.locator('select').all()
  if (selects.length > 0) {
    const options = await selects[0].locator('option').all()
    if (options.length > 1) {
      const val = await options[1].getAttribute('value')
      if (val) await selects[0].selectOption(val)
    }
  }
  await page.fill('input[name="guest_name"]', 'João Silva')
  await page.fill('input[name="guest_email"]', 'joao@test.com')
  await page.fill('input[name="check_in"]', '2026-04-15')
  await page.fill('input[name="check_out"]', '2026-04-20')
  await page.fill('input[name="num_guests"]', '2')
  await page.fill('input[name="total_amount"]', '500')
  const saves3 = await page.getByText('Guardar').all()
  if (saves3.length > 0) await saves3[0].click()
  await page.waitForTimeout(4000)
  console.log('After reservation:', page.url())
  await page.screenshot({ path: '/tmp/feat-3-reservation.png', fullPage: true })

  // TEST 4: Reservation in list
  console.log('\n=== TEST 4: RESERVATION IN LIST ===')
  await page.goto(`${BASE}/reservations`)
  await page.waitForTimeout(2000)
  const resText = await page.textContent('body') || ''
  console.log(resText.includes('João Silva') ? 'PASS: Reservation in list' : 'CHECK: Reservation not visible')
  await page.screenshot({ path: '/tmp/feat-4-res-list.png', fullPage: true })

  // TEST 5: Calendar
  console.log('\n=== TEST 5: CALENDAR ===')
  await page.goto(`${BASE}/calendar?year=2026&month=4`)
  await page.waitForTimeout(2000)
  const calText = await page.textContent('body') || ''
  console.log(calText.includes('Apartamento Tejo') ? 'PASS: Property in calendar' : 'CHECK')
  await page.screenshot({ path: '/tmp/feat-5-calendar.png', fullPage: true })

  // TEST 6: Dashboard stats
  console.log('\n=== TEST 6: DASHBOARD ===')
  await page.goto(BASE)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/feat-6-dashboard.png', fullPage: true })
  console.log('Dashboard loaded')

  // TEST 7: Analytics
  console.log('\n=== TEST 7: ANALYTICS ===')
  await page.goto(`${BASE}/analytics`)
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/feat-7-analytics.png', fullPage: true })
  console.log('Analytics loaded')

  // TEST 8: Messaging settings
  console.log('\n=== TEST 8: MESSAGING SETTINGS ===')
  await page.goto(`${BASE}/settings/integrations/messaging`)
  await page.waitForTimeout(2000)
  const msgText = await page.textContent('body') || ''
  console.log(msgText.includes('Gmail') ? 'PASS: Gmail preset visible' : 'FAIL')
  await page.screenshot({ path: '/tmp/feat-8-messaging.png', fullPage: true })

  // TEST 9: Guests page
  console.log('\n=== TEST 9: GUESTS ===')
  await page.goto(`${BASE}/guests`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/feat-9-guests.png', fullPage: true })
  console.log('Guests loaded')

  // TEST 10: Tasks page
  console.log('\n=== TEST 10: TASKS ===')
  await page.goto(`${BASE}/tasks`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/feat-10-tasks.png', fullPage: true })
  console.log('Tasks loaded')

  // TEST 11: Locale switch
  console.log('\n=== TEST 11: LOCALE SWITCH ===')
  await page.goto(BASE)
  await page.waitForTimeout(2000)
  // Click globe icon (locale switcher)
  const globeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-globe') })
  const globeCount = await globeBtn.count()
  if (globeCount > 0) {
    await globeBtn.first().click()
    await page.waitForTimeout(1000)
    const enOption = page.getByText('English')
    if (await enOption.count() > 0) {
      await enOption.first().click()
      await page.waitForTimeout(3000)
      const body = await page.textContent('body') || ''
      console.log(body.includes('Welcome') || body.includes('Dashboard') ? 'PASS: Switched to EN' : 'CHECK')
    }
  } else {
    console.log('INFO: Globe button not found')
  }
  await page.screenshot({ path: '/tmp/feat-11-locale.png', fullPage: true })

  // TEST 12: Logout
  console.log('\n=== TEST 12: LOGOUT ===')
  await page.goto(BASE)
  await page.waitForTimeout(2000)
  const avatar = page.locator('button.rounded-full').first()
  if (await avatar.count() > 0) {
    await avatar.click()
    await page.waitForTimeout(1000)
    const logoutBtn = page.getByText('Terminar sessão').or(page.getByText('Sign out'))
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click()
      await page.waitForTimeout(3000)
    }
  }
  console.log('After logout:', page.url())
  console.log(page.url().includes('/login') ? 'PASS: Logged out' : 'CHECK')

  console.log('\n=== ALL TESTS COMPLETE ===')
  await browser.close()
}

main().catch(console.error)
