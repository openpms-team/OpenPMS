'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Mail, Shield, FileText, BarChart3, Bot, Webhook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const INTEGRATIONS = [
  {
    icon: Mail,
    title: 'Mensagens',
    description: 'Email (Gmail, Outlook), SMS (Twilio) e WhatsApp',
    href: '/settings/integrations/messaging',
  },
  {
    icon: Shield,
    title: 'SEF / SIBA',
    description: 'Reporte automático de hóspedes às autoridades portuguesas',
    href: '/settings/integrations/sef',
  },
  {
    icon: FileText,
    title: 'Faturação',
    description: 'Emissão de faturas via Moloni ou InvoiceXpress',
    href: '/settings/integrations/invoicing',
  },
  {
    icon: BarChart3,
    title: 'Preços dinâmicos',
    description: 'Sincronização com PriceLabs ou Beyond Pricing',
    href: '/settings/integrations/pricing',
  },
  {
    icon: Bot,
    title: 'Inteligência Artificial',
    description: 'OCR, concierge, tradução automática e mais (BYOK)',
    href: '/settings/integrations/ai',
  },
  {
    icon: Webhook,
    title: 'API e Webhooks',
    description: 'Chaves de API para integrações externas e webhooks',
    href: '/settings/integrations/api',
  },
]

export default function IntegrationsPage() {
  const t = useTranslations('settings')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('integrations')}</h2>
        <p className="text-muted-foreground mt-1">{t('integrationsDescription')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {t('configure')}
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
