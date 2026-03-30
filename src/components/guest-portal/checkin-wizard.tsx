'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PrimaryGuestData {
  full_name: string
  email: string
  phone: string
  nationality_icao: string
  date_of_birth: string
  document_type: 'passport' | 'id_card' | 'driving_license'
  document_number: string
  document_country: string
  document_expiry: string
}

interface AdditionalGuestData {
  full_name: string
  nationality_icao: string
  document_type: 'passport' | 'id_card' | 'driving_license'
  document_number: string
  document_country: string
  document_expiry: string
}

interface CheckinWizardProps {
  reservationId: string
  guestName: string
  numGuests: number
  token: string
}

const TOTAL_STEPS = 4

const emptyAdditionalGuest = (): AdditionalGuestData => ({
  full_name: '',
  nationality_icao: '',
  document_type: 'passport',
  document_number: '',
  document_country: '',
  document_expiry: '',
})

export function CheckinWizard({ guestName, numGuests, token }: CheckinWizardProps) {
  const t = useTranslations('guestPortal')
  const tc = useTranslations('common')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [primary, setPrimary] = useState<PrimaryGuestData>({
    full_name: guestName,
    email: '',
    phone: '',
    nationality_icao: '',
    date_of_birth: '',
    document_type: 'passport',
    document_number: '',
    document_country: '',
    document_expiry: '',
  })

  const additionalCount = Math.max(0, numGuests - 1)
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuestData[]>(
    Array.from({ length: additionalCount }, emptyAdditionalGuest)
  )

  const updatePrimary = (field: keyof PrimaryGuestData, value: string) => {
    setPrimary((prev) => ({ ...prev, [field]: value }))
  }

  const updateAdditional = (index: number, field: keyof AdditionalGuestData, value: string) => {
    setAdditionalGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // Transform to API's expected format: guests[] array
      const guests = [
        { ...primary, is_primary: true },
        ...additionalGuests.map((g) => ({ ...g, is_primary: false })),
      ]
      const res = await fetch('/api/guest/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, guests }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError(t('checkinError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-lg font-medium text-green-800">{t('checkinSuccess')}</p>
      </div>
    )
  }

  const docTypeOptions: { value: PrimaryGuestData['document_type']; label: string }[] = [
    { value: 'passport', label: t('passport') },
    { value: 'id_card', label: t('idCard') },
    { value: 'driving_license', label: t('drivingLicense') },
  ]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="text-sm text-gray-500">{t('stepOf', { step, total: TOTAL_STEPS })}</div>
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step 1: Primary Guest */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('primaryGuest')}</h2>
          <FieldGroup>
            <Label>{t('fullName')}</Label>
            <Input value={primary.full_name} onChange={(e) => updatePrimary('full_name', e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label>{t('email')}</Label>
            <Input type="email" value={primary.email} onChange={(e) => updatePrimary('email', e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label>{t('phone')}</Label>
            <Input type="tel" value={primary.phone} onChange={(e) => updatePrimary('phone', e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label>{t('nationality')}</Label>
            <Input value={primary.nationality_icao} onChange={(e) => updatePrimary('nationality_icao', e.target.value)} placeholder="PRT" required />
          </FieldGroup>
          <FieldGroup>
            <Label>{t('dateOfBirth')}</Label>
            <Input type="date" value={primary.date_of_birth} onChange={(e) => updatePrimary('date_of_birth', e.target.value)} required />
          </FieldGroup>
        </div>
      )}

      {/* Step 2: Document */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('document')}</h2>
          <FieldGroup>
            <Label>{t('documentType')}</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={primary.document_type}
              onChange={(e) => updatePrimary('document_type', e.target.value)}
            >
              {docTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup>
            <Label>{t('documentNumber')}</Label>
            <Input value={primary.document_number} onChange={(e) => updatePrimary('document_number', e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label>{t('documentCountry')}</Label>
            <Input value={primary.document_country} onChange={(e) => updatePrimary('document_country', e.target.value)} placeholder="PRT" required />
          </FieldGroup>
          <FieldGroup>
            <Label>{t('documentExpiry')}</Label>
            <Input type="date" value={primary.document_expiry} onChange={(e) => updatePrimary('document_expiry', e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label>Document Photo</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && file.size > 5 * 1024 * 1024) {
                  e.target.value = ''
                }
              }}
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG or PDF. Max 5MB.</p>
          </FieldGroup>
        </div>
      )}

      {/* Step 3: Additional Guests */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">{t('additionalGuests')}</h2>
          {additionalCount === 0 ? (
            <p className="text-sm text-gray-500">{t('noAdditionalGuests')}</p>
          ) : (
            additionalGuests.map((guest, idx) => (
              <div key={idx} className="space-y-3 rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium">{t('guestNumber', { number: idx + 2 })}</h3>
                <FieldGroup>
                  <Label>{t('fullName')}</Label>
                  <Input value={guest.full_name} onChange={(e) => updateAdditional(idx, 'full_name', e.target.value)} required />
                </FieldGroup>
                <FieldGroup>
                  <Label>{t('nationality')}</Label>
                  <Input value={guest.nationality_icao} onChange={(e) => updateAdditional(idx, 'nationality_icao', e.target.value)} placeholder="PRT" required />
                </FieldGroup>
                <FieldGroup>
                  <Label>{t('documentType')}</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={guest.document_type}
                    onChange={(e) => updateAdditional(idx, 'document_type', e.target.value)}
                  >
                    {docTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </FieldGroup>
                <FieldGroup>
                  <Label>{t('documentNumber')}</Label>
                  <Input value={guest.document_number} onChange={(e) => updateAdditional(idx, 'document_number', e.target.value)} required />
                </FieldGroup>
                <FieldGroup>
                  <Label>{t('documentCountry')}</Label>
                  <Input value={guest.document_country} onChange={(e) => updateAdditional(idx, 'document_country', e.target.value)} placeholder="PRT" required />
                </FieldGroup>
                <FieldGroup>
                  <Label>{t('documentExpiry')}</Label>
                  <Input type="date" value={guest.document_expiry} onChange={(e) => updateAdditional(idx, 'document_expiry', e.target.value)} required />
                </FieldGroup>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('confirmation')}</h2>
          <SummarySection title={t('primaryGuest')}>
            <SummaryRow label={t('fullName')} value={primary.full_name} />
            <SummaryRow label={t('email')} value={primary.email} />
            <SummaryRow label={t('phone')} value={primary.phone} />
            <SummaryRow label={t('nationality')} value={primary.nationality_icao} />
            <SummaryRow label={t('dateOfBirth')} value={primary.date_of_birth} />
            <SummaryRow label={t('documentType')} value={docTypeOptions.find((o) => o.value === primary.document_type)?.label ?? ''} />
            <SummaryRow label={t('documentNumber')} value={primary.document_number} />
            <SummaryRow label={t('documentCountry')} value={primary.document_country} />
            <SummaryRow label={t('documentExpiry')} value={primary.document_expiry} />
          </SummarySection>
          {additionalGuests.map((guest, idx) => (
            <SummarySection key={idx} title={t('guestNumber', { number: idx + 2 })}>
              <SummaryRow label={t('fullName')} value={guest.full_name} />
              <SummaryRow label={t('nationality')} value={guest.nationality_icao} />
              <SummaryRow label={t('documentNumber')} value={guest.document_number} />
              <SummaryRow label={t('documentCountry')} value={guest.document_country} />
              <SummaryRow label={t('documentExpiry')} value={guest.document_expiry} />
            </SummarySection>
          ))}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>{tc('back')}</Button>
        ) : (
          <div />
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep((s) => s + 1)}>{tc('next')}</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('submitting') : t('submitCheckin')}
          </Button>
        )}
      </div>
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-2 text-sm font-medium text-gray-900">{title}</h3>
      <dl className="space-y-1">{children}</dl>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value || '—'}</dd>
    </div>
  )
}
