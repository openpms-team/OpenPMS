'use client'

import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

const localeLabels: Record<string, { flag: string; label: string }> = {
  pt: { flag: '🇵🇹', label: 'Português' },
  en: { flag: '🇬🇧', label: 'English' },
  fr: { flag: '🇫🇷', label: 'Français' },
}

export function LocaleSwitcher() {
  const currentLocale = useLocale()

  const switchLocale = useCallback((locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`
    window.location.reload()
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
      >
        <Globe className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(localeLabels).map(([locale, { flag, label }]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            <span className="mr-2">{flag}</span>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
