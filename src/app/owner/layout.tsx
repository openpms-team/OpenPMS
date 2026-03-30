import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Link from 'next/link'
import { BarChart3, Building2, FileText } from 'lucide-react'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen">
        <aside className="w-56 border-r bg-muted/40 p-4 space-y-2">
          <div className="mb-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Owner Portal
          </div>
          <nav className="space-y-1">
            <Link href="/owner" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/owner/properties" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
              <Building2 className="h-4 w-4" /> Properties
            </Link>
            <Link href="/owner/statements" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
              <FileText className="h-4 w-4" /> Statements
            </Link>
          </nav>
          <div className="mt-auto pt-4 text-xs text-muted-foreground">Read-only</div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </NextIntlClientProvider>
  )
}
