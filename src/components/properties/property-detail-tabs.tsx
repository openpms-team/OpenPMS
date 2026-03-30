'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Users, Clock, MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PropertyForm } from './property-form'
import { deletePropertyAction } from '@/app/(dashboard)/properties/actions'
import type { Property, TaxJurisdiction } from '@/types/database'

interface Props {
  property: Property
  jurisdictions: TaxJurisdiction[]
}

export function PropertyDetailTabs({ property, jurisdictions }: Props) {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await deletePropertyAction(property.id)
    if (result.error) {
      toast.error(result.error)
      setDeleting(false)
      return
    }
    toast.success(t('deleted'))
    router.push('/properties')
  }

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
        <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
        <TabsTrigger value="danger">{t('dangerZone')}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('maxGuests')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{property.max_guests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('numBedrooms')}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{property.num_bedrooms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('checkInTime')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{property.check_in_time}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('address')}
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm">{property.address ?? '—'}</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="pt-4">
        <div className="mx-auto max-w-2xl">
          <PropertyForm property={property} jurisdictions={jurisdictions} />
        </div>
      </TabsContent>

      <TabsContent value="danger" className="pt-4">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? '...' : tCommon('delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {tCommon('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
