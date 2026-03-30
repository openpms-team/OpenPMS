import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const tErrors = await getTranslations('errors')
  const tCommon = await getTranslations('common')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h2 className="text-xl font-bold">{tErrors('pageNotFound')}</h2>
        <p className="text-sm text-muted-foreground">
          {tErrors('pageNotFoundDescription')}
        </p>
        <Link href="/">
          <Button>{tCommon('backToDashboard')}</Button>
        </Link>
      </div>
    </div>
  )
}
