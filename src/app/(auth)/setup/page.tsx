'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  setupStep1Schema,
  setupStep2Schema,
  type SetupStep1Data,
  type SetupStep2Data,
} from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function SetupPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<SetupStep1Data | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('setupWizard')}</CardTitle>
        <CardDescription>
          {t('letsStart')} — Step {step}/3
        </CardDescription>
        <Progress value={(step / 3) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        {serverError && (
          <p className="mb-4 text-sm text-destructive">{serverError}</p>
        )}

        {step === 1 && (
          <Step1Form
            t={t}
            tErrors={tErrors}
            onNext={(data) => {
              setStep1Data(data)
              setStep(2)
            }}
          />
        )}

        {step === 2 && (
          <Step2Form
            t={t}
            tCommon={tCommon}
            tErrors={tErrors}
            loading={loading}
            onBack={() => setStep(1)}
            onSubmit={async (data) => {
              if (!step1Data) return
              setServerError(null)
              setLoading(true)
              try {
                const supabase = createClient()

                const { error: signUpError } = await supabase.auth.signUp({
                  email: data.email,
                  password: data.password,
                })
                if (signUpError) {
                  setServerError(signUpError.message)
                  return
                }

                // Store business settings
                await supabase.from('settings').upsert([
                  { key: 'business_name', value: { value: step1Data.businessName } },
                  { key: 'timezone', value: { value: step1Data.timezone } },
                  { key: 'currency', value: { value: step1Data.currency } },
                  { key: 'locale', value: { value: step1Data.language } },
                ])

                setStep(3)
              } catch {
                setServerError(tErrors('generic'))
              } finally {
                setLoading(false)
              }
            }}
          />
        )}

        {step === 3 && (
          <Step3Form
            t={t}
            onSkip={() => router.push('/')}
          />
        )}
      </CardContent>
    </Card>
  )
}

function Step1Form({
  t,
  tErrors,
  onNext,
}: {
  t: (key: string) => string
  tErrors: (key: string) => string
  onNext: (data: SetupStep1Data) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SetupStep1Data>({
    resolver: zodResolver(setupStep1Schema),
    defaultValues: {
      language: 'pt',
      currency: 'EUR',
      timezone: 'Europe/Lisbon',
    },
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">{t('businessName')}</Label>
        <Input id="businessName" {...register('businessName')} />
        {errors.businessName && (
          <p className="text-sm text-destructive">
            {tErrors('validation.required')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t('timezone')}</Label>
        <Select
          defaultValue="Europe/Lisbon"
          onValueChange={(v) => v && setValue('timezone', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Europe/Lisbon">Europe/Lisbon</SelectItem>
            <SelectItem value="Europe/London">Europe/London</SelectItem>
            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
            <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
            <SelectItem value="Atlantic/Azores">Atlantic/Azores</SelectItem>
            <SelectItem value="Atlantic/Madeira">Atlantic/Madeira</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('currency')}</Label>
        <Select
          defaultValue="EUR"
          onValueChange={(v) => v && setValue('currency', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">EUR (€)</SelectItem>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="GBP">GBP (£)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('language')}</Label>
        <Select
          defaultValue="pt"
          onValueChange={(v) =>
            v && setValue('language', v as 'pt' | 'en' | 'fr')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {t('letsStart')}
      </Button>
    </form>
  )
}

function Step2Form({
  t,
  tCommon,
  tErrors,
  loading,
  onBack,
  onSubmit,
}: {
  t: (key: string) => string
  tCommon: (key: string) => string
  tErrors: (key: string) => string
  loading: boolean
  onBack: () => void
  onSubmit: (data: SetupStep2Data) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupStep2Data>({
    resolver: zodResolver(setupStep2Schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && (
          <p className="text-sm text-destructive">
            {tErrors('validation.email')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <p className="text-sm text-destructive">
            {tErrors('validation.minLength')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {tCommon('back')}
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? '...' : t('createAccount')}
        </Button>
      </div>
    </form>
  )
}

function Step3Form({
  t,
  onSkip,
}: {
  t: (key: string) => string
  onSkip: () => void
}) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">
        {t('twoFactorSetup')}
      </p>
      <p className="text-sm text-muted-foreground">
        2FA setup will be available in Settings &gt; Security
      </p>
      <Button onClick={onSkip} className="w-full">
        {t('letsStart')}
      </Button>
    </div>
  )
}
