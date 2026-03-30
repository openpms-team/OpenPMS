'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { parseCSV, type ParsedCSV } from '@/lib/csv/importer'
import { mapRows, validateMapping, type ColumnMapping, type MappedReservation } from '@/lib/csv/mapper'
import { createReservationAction } from '@/app/(dashboard)/reservations/actions'
import { createClient } from '@/lib/supabase/client'
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

interface Property {
  id: string
  name: string
}

const REQUIRED_FIELDS = ['guestName', 'checkIn', 'checkOut'] as const
const OPTIONAL_FIELDS = ['guestEmail', 'guestPhone', 'numGuests', 'totalAmount', 'notes'] as const
type FieldKey = (typeof REQUIRED_FIELDS)[number] | (typeof OPTIONAL_FIELDS)[number]

export default function CSVImportPage() {
  const t = useTranslations('reservations')
  const tc = useTranslations('common')

  const [step, setStep] = useState(1)
  const [csv, setCsv] = useState<ParsedCSV | null>(null)
  const [mapping, setMapping] = useState<Record<string, number | undefined>>({})
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [mapped, setMapped] = useState<MappedReservation[]>([])
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('id, name')
        .order('name')
      setProperties(data ?? [])
    }
    fetchProperties()
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        const parsed = parseCSV(content)
        setCsv(parsed)
        setStep(2)
      }
    }
    reader.readAsText(file)
  }, [])

  const handleMappingChange = useCallback((field: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : Number(value),
    }))
  }, [])

  const handleMappingConfirm = useCallback(() => {
    if (!csv) return
    const columnMapping: ColumnMapping = {
      guestName: mapping.guestName ?? 0,
      checkIn: mapping.checkIn ?? 1,
      checkOut: mapping.checkOut ?? 2,
      guestEmail: mapping.guestEmail,
      guestPhone: mapping.guestPhone,
      numGuests: mapping.numGuests,
      totalAmount: mapping.totalAmount,
      notes: mapping.notes,
    }
    const validation = validateMapping(columnMapping, csv.headers.length)
    if (!validation.valid) {
      setErrors(validation.errors.map((message) => ({ row: 0, message })))
      return
    }
    const result = mapRows(csv.rows, columnMapping, csv.detectedDateFormat)
    setMapped(result.mapped)
    setErrors(result.errors)
    setStep(3)
  }, [csv, mapping])

  const handlePropertyConfirm = useCallback(() => {
    if (!selectedProperty) return
    setStep(4)
  }, [selectedProperty])

  const handleImport = useCallback(async () => {
    setImporting(true)
    let success = 0
    let failed = 0
    for (const reservation of mapped) {
      const result = await createReservationAction({
        ...reservation,
        property_id: selectedProperty,
        status: 'confirmed',
      })
      if (result.error) {
        failed++
      } else {
        success++
      }
    }
    setImportResult({ success, failed })
    setImporting(false)
  }, [mapped, selectedProperty])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('importCSV')}</h2>

      <div className="flex gap-2 text-sm text-muted-foreground">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={s === step ? 'font-bold text-foreground' : ''}
          >
            {t(`importStep${s}`)}
            {s < 4 && ' \u2192'}
          </span>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadFile')}</CardTitle>
            <CardDescription>{t('uploadFileDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <p className="mb-4 text-sm text-muted-foreground">{t('dragCSVHint')}</p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && csv && (
        <Card>
          <CardHeader>
            <CardTitle>{t('mapColumns')}</CardTitle>
            <CardDescription>{t('mapColumnsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as FieldKey[]).map((field) => (
                <div key={field} className="space-y-1">
                  <Label>
                    {t(field)}
                    {REQUIRED_FIELDS.includes(field as typeof REQUIRED_FIELDS[number]) && ' *'}
                  </Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={mapping[field] ?? ''}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                  >
                    <option value="">{tc('select')}</option>
                    {csv.headers.map((header, idx) => (
                      <option key={idx} value={idx}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {csv.rows.length > 0 && (
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {csv.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csv.rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri} className="border-b">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {errors.length > 0 && (
              <div className="text-sm text-destructive">
                {errors.map((err, i) => (
                  <p key={i}>{err.message}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>{tc('back')}</Button>
              <Button onClick={handleMappingConfirm}>{tc('next')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('selectProperty')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('property')}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="">{tc('select')}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>{tc('back')}</Button>
              <Button onClick={handlePropertyConfirm} disabled={!selectedProperty}>
                {tc('next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('importSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">{mapped.length}</p>
                <p className="text-sm text-muted-foreground">{t('toImport')}</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">{errors.length}</p>
                <p className="text-sm text-muted-foreground">{t('rowErrors')}</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">
                  {importResult ? importResult.success : '-'}
                </p>
                <p className="text-sm text-muted-foreground">{t('imported')}</p>
              </div>
            </div>

            {importResult && importResult.failed > 0 && (
              <p className="text-sm text-destructive">
                {t('importFailed', { count: importResult.failed })}
              </p>
            )}

            {importResult && importResult.success > 0 && (
              <p className="text-sm text-green-600">
                {t('importSuccess', { count: importResult.success })}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} disabled={importing}>
                {tc('back')}
              </Button>
              {!importResult && (
                <Button onClick={handleImport} disabled={importing || mapped.length === 0}>
                  {importing ? tc('loading') : t('startImport')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
