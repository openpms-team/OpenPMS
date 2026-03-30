'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { LocaleSwitcher } from './locale-switcher'
import { ThemeToggle } from './theme-toggle'
import { MobileSidebar } from './sidebar'

const pathLabels: Record<string, string> = {
  '/': 'dashboard',
  '/properties': 'properties',
  '/reservations': 'reservations',
  '/calendar': 'calendar',
  '/guests': 'guests',
  '/tasks': 'tasks',
  '/messages': 'messages',
  '/team': 'team',
  '/finance': 'finance',
  '/pricing': 'pricing',
  '/owners': 'owners',
  '/analytics': 'analytics',
  '/settings': 'settings',
}

export function Topbar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')

  const currentKey =
    Object.entries(pathLabels).find(
      ([path]) => path !== '/' && pathname.startsWith(path)
    )?.[1] ??
    (pathname === '/' ? 'dashboard' : '')

  return (
    <header className="flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 h-14">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="px-4 pt-4 text-lg font-bold">
              OpenPMS
            </SheetTitle>
            <MobileSidebar />
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold">
          {currentKey ? t(currentKey) : ''}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="rounded-full" />}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              {t('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              {tAuth('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
