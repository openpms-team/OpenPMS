'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Integration {
  key: string
  href: string | null
  status: 'connected' | 'not_configured' | 'coming_soon'
}

const INTEGRATIONS: Integration[] = [
  { key: 'ical', href: '/properties', status: 'not_configured' },
  { key: 'beds24', href: '/settings/integrations/beds24', status: 'not_configured' },
  { key: 'cloudbeds', href: '/settings/integrations/cloudbeds', status: 'not_configured' },
  { key: 'smtp', href: null, status: 'coming_soon' },
  { key: 'invoice', href: null, status: 'coming_soon' },
]

function statusVariant(status: Integration['status']): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'connected':
      return 'default'
    case 'not_configured':
      return 'secondary'
    case 'coming_soon':
      return 'outline'
  }
}

export default function IntegrationsPage() {
  const t = useTranslations('settings')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('integrations')}</h2>
      <p className="text-sm text-muted-foreground">{t('integrationsDescription')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t(`integration_${integration.key}_name`)}</CardTitle>
                <Badge variant={statusVariant(integration.status)}>
                  {t(`integrationStatus_${integration.status}`)}
                </Badge>
              </div>
              <CardDescription>
                {t(`integration_${integration.key}_description`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integration.href ? (
                <Link href={integration.href}>
                  <Button variant="outline" className="w-full">
                    {t('configure')}
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  {t('comingSoon')}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
