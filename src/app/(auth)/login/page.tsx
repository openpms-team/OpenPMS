'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error || !authData.user) {
        setServerError(error?.message ?? tErrors('generic'))
        return
      }

      // Check if 2FA is enabled for this specific user
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('totp_enabled')
        .eq('id', authData.user.id)
        .single()

      if (profile?.totp_enabled) {
        router.push('/two-factor')
      } else {
        router.push('/')
      }
    } catch {
      setServerError(tErrors('generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('welcomeBack')}</CardTitle>
        <CardDescription>{t('login')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {tErrors('validation.email')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {tErrors('validation.required')}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : t('login')}
          </Button>

          <div className="flex justify-between text-sm">
            <Link
              href="/setup"
              className="text-muted-foreground hover:underline"
            >
              {t('createAccount')}
            </Link>
            <button
              type="button"
              className="text-muted-foreground hover:underline"
            >
              {t('forgotPassword')}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
