'use client'

import { Button } from '@/components/ui/button'

interface DownloadPdfButtonProps {
  url: string
  label: string
}

export function DownloadPdfButton({ url, label }: DownloadPdfButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
      {label}
    </Button>
  )
}
