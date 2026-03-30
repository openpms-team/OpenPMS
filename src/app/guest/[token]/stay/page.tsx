import { validateToken } from '@/lib/checkin/generate-link'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, KeyRound, BookOpen, Home } from 'lucide-react'

export default async function StayInfoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const t = await getTranslations('guestPortal')
  const result = await validateToken(token)

  if (!result.valid) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm font-medium text-red-800">
            {result.reason === 'expired' ? t('expiredLink') : t('invalidLink')}
          </p>
        </div>
      </div>
    )
  }

  const property = result.data.reservations.properties as Record<string, unknown>
  const propertyName = (property.name as string) ?? ''
  const wifiName = (property.wifi_name as string) ?? ''
  const wifiPassword = (property.wifi_password as string) ?? ''
  const doorCode = (property.door_code as string) ?? ''
  const houseRules = (property.house_rules as string) ?? ''

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('stayInfo')}</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Home className="size-5 text-blue-600" />
          <CardTitle className="text-base">{t('propertyName')}</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-gray-700">{propertyName}</p></CardContent>
      </Card>

      {(wifiName || wifiPassword) && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Wifi className="size-5 text-blue-600" />
            <CardTitle className="text-base">{t('wifi')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {wifiName && <p><span className="text-gray-500">{t('wifiNetwork')}:</span> <span className="font-medium">{wifiName}</span></p>}
            {wifiPassword && <p><span className="text-gray-500">{t('wifiPassword')}:</span> <span className="font-mono font-medium">{wifiPassword}</span></p>}
          </CardContent>
        </Card>
      )}

      {doorCode && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <KeyRound className="size-5 text-blue-600" />
            <CardTitle className="text-base">{t('doorCode')}</CardTitle>
          </CardHeader>
          <CardContent><p className="font-mono text-lg font-bold tracking-widest">{doorCode}</p></CardContent>
        </Card>
      )}

      {houseRules && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <BookOpen className="size-5 text-blue-600" />
            <CardTitle className="text-base">{t('houseRules')}</CardTitle>
          </CardHeader>
          <CardContent><p className="whitespace-pre-line text-sm text-gray-700">{houseRules}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
