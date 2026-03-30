import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import { locales, defaultLocale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value

  let locale: string = defaultLocale

  if (localeCookie && locales.includes(localeCookie as typeof locales[number])) {
    locale = localeCookie
  } else {
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language') ?? ''
    const negotiator = new Negotiator({
      headers: { 'accept-language': acceptLanguage },
    })
    const languages = negotiator.languages()
    try {
      locale = match(languages, [...locales], defaultLocale)
    } catch {
      locale = defaultLocale
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
