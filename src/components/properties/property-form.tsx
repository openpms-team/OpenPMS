'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { propertyInsertSchema } from '@/lib/validators/property'
import { z } from 'zod/v4'

type PropertyFormData = z.input<typeof propertyInsertSchema>
import { createPropertyAction, updatePropertyAction } from '@/app/(dashboard)/properties/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Property, TaxJurisdiction } from '@/types/database'

interface PropertyFormProps {
  property?: Property
  jurisdictions: TaxJurisdiction[]
}

export function PropertyForm({ property, jurisdictions }: PropertyFormProps) {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!property

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyInsertSchema),
    defaultValues: property
      ? {
          name: property.name,
          address: property.address ?? '',
          city: property.city ?? '',
          postal_code: property.postal_code ?? '',
          max_guests: property.max_guests,
          num_bedrooms: property.num_bedrooms,
          num_bathrooms: property.num_bathrooms,
          al_license: property.al_license ?? '',
          check_in_time: property.check_in_time,
          check_out_time: property.check_out_time,
          ical_urls: property.ical_urls ?? [],
          sef_property_id: property.sef_property_id ?? '',
          sef_establishment_id: property.sef_establishment_id ?? '',
          wifi_name: property.wifi_name ?? '',
          wifi_password: property.wifi_password ?? '',
          door_code: property.door_code ?? '',
          house_rules: property.house_rules ?? '',
          description: property.description ?? '',
          tax_jurisdiction_id: property.tax_jurisdiction_id ?? undefined,
          active: property.active,
        }
      : {
          max_guests: 2,
          num_bedrooms: 1,
          num_bathrooms: 1,
          check_in_time: '15:00',
          check_out_time: '11:00',
          active: true,
          ical_urls: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ical_urls',
  })

  async function onSubmit(data: PropertyFormData) {
    setLoading(true)
    try {
      const result = isEdit
        ? await updatePropertyAction(property.id, data)
        : await createPropertyAction(data)

      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? t('updated') : t('created'))
      router.push('/properties')
    } catch {
      toast.error(tErrors('generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, (validationErrors) => {
      const firstError = Object.values(validationErrors)[0]
      const msg = firstError?.message ?? tErrors('validation.required')
      toast.error(String(msg))
    })} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t('name')} *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{tErrors('validation.required')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{t('address')}</Label>
          <Input id="address" {...register('address')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t('city')}</Label>
          <Input id="city" {...register('city')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">{t('postalCode')}</Label>
          <Input id="postal_code" {...register('postal_code')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_jurisdiction_id">{t('municipality')}</Label>
          <select
            id="tax_jurisdiction_id"
            {...register('tax_jurisdiction_id')}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {jurisdictions.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="al_license">{t('alLicense')}</Label>
          <Input id="al_license" {...register('al_license')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_guests">{t('maxGuests')} *</Label>
          <Input
            id="max_guests"
            type="number"
            min={1}
            {...register('max_guests', { valueAsNumber: true })}
          />
          {errors.max_guests && (
            <p className="text-sm text-destructive">{tErrors('validation.numeric')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="num_bedrooms">{t('numBedrooms')}</Label>
          <Input
            id="num_bedrooms"
            type="number"
            min={0}
            {...register('num_bedrooms', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_in_time">{t('checkInTime')} *</Label>
          <Input id="check_in_time" type="time" {...register('check_in_time')} />
          {errors.check_in_time && (
            <p className="text-sm text-destructive">{tErrors('validation.required')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_out_time">{t('checkOutTime')} *</Label>
          <Input id="check_out_time" type="time" {...register('check_out_time')} />
          {errors.check_out_time && (
            <p className="text-sm text-destructive">{tErrors('validation.required')}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{tCommon('description')}</Label>
        <Textarea id="description" rows={3} {...register('description')} />
      </div>

      <Accordion>
        <AccordionItem value="advanced">
          <AccordionTrigger>{t('advanced')}</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {/* iCal URLs */}
            <div className="space-y-3">
              <Label>{t('icalUrls')}</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder={t('icalName')}
                    {...register(`ical_urls.${index}.name`)}
                    className="flex-1"
                  />
                  <Input
                    placeholder={t('icalUrl')}
                    {...register(`ical_urls.${index}.url`)}
                    className="flex-[2]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', url: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('addIcalUrl')}
              </Button>
            </div>

            {/* SEF Config */}
            <div className="space-y-3">
              <Label>{t('sefConfig')}</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sef_property_id">{t('sefPropertyId')}</Label>
                  <Input id="sef_property_id" {...register('sef_property_id')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sef_establishment_id">{t('sefEstablishmentId')}</Label>
                  <Input id="sef_establishment_id" {...register('sef_establishment_id')} />
                </div>
              </div>
            </div>

            {/* Guest Portal Config */}
            <div className="space-y-3">
              <Label>{t('guestPortal')}</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wifi_name">{t('wifiName')}</Label>
                  <Input id="wifi_name" {...register('wifi_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi_password">{t('wifiPassword')}</Label>
                  <Input id="wifi_password" {...register('wifi_password')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="door_code">{t('doorCode')}</Label>
                  <Input id="door_code" {...register('door_code')} />
                </div>
              </div>

              <Tabs defaultValue="pt">
                <TabsList>
                  <TabsTrigger value="pt">PT</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="fr">FR</TabsTrigger>
                </TabsList>
                <TabsContent value="pt" className="space-y-2">
                  <Label>{t('houseRules')}</Label>
                  <Textarea rows={3} {...register('house_rules')} />
                </TabsContent>
                <TabsContent value="en" className="space-y-2">
                  <Label>{t('houseRules')} (EN)</Label>
                  <Textarea
                    rows={3}
                    {...register('guest_portal_config.house_rules_en' as 'house_rules')}
                  />
                </TabsContent>
                <TabsContent value="fr" className="space-y-2">
                  <Label>{t('houseRules')} (FR)</Label>
                  <Textarea
                    rows={3}
                    {...register('guest_portal_config.house_rules_fr' as 'house_rules')}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '...' : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
