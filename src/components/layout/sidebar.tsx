'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Calendar,
  Users,
  ListTodo,
  MessageSquare,
  UserCog,
  DollarSign,
  Tag,
  UserCheck,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ElementType
}

const mainItems: NavItem[] = [
  { href: '/', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/properties', labelKey: 'properties', icon: Building2 },
  { href: '/reservations', labelKey: 'reservations', icon: CalendarDays },
  { href: '/calendar', labelKey: 'calendar', icon: Calendar },
]

const operationsItems: NavItem[] = [
  { href: '/guests', labelKey: 'guests', icon: Users },
  { href: '/tasks', labelKey: 'tasks', icon: ListTodo },
  { href: '/messages', labelKey: 'messages', icon: MessageSquare },
  { href: '/team', labelKey: 'team', icon: UserCog },
]

const financeItems: NavItem[] = [
  { href: '/finance', labelKey: 'finance', icon: DollarSign },
  { href: '/pricing', labelKey: 'pricing', icon: Tag },
  { href: '/owners', labelKey: 'owners', icon: UserCheck },
]

const insightItems: NavItem[] = [
  { href: '/analytics', labelKey: 'analytics', icon: BarChart3 },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function NavSection({
  items,
  collapsed,
  pathname,
  t,
}: {
  items: NavItem[]
  collapsed: boolean
  pathname: string
  t: (key: string) => string
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform duration-200',
                  !isActive && 'group-hover:scale-110'
                )}
              />
              {!collapsed && (
                <span className="animate-fade-in">{t(item.labelKey)}</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-sidebar-border" />
  return (
    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
      {label}
    </p>
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-14 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              O
            </div>
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              OpenPMS
            </span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
            O
          </div>
        )}
      </div>

      {/* Toggle */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-4">
        <NavSection items={mainItems} collapsed={collapsed} pathname={pathname} t={t} />

        <div>
          <SectionLabel label="Operations" collapsed={collapsed} />
          <NavSection items={operationsItems} collapsed={collapsed} pathname={pathname} t={t} />
        </div>

        <div>
          <SectionLabel label="Finance" collapsed={collapsed} />
          <NavSection items={financeItems} collapsed={collapsed} pathname={pathname} t={t} />
        </div>

        <div>
          <SectionLabel label="Insights" collapsed={collapsed} />
          <NavSection items={insightItems} collapsed={collapsed} pathname={pathname} t={t} />
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <NavSection
          items={[{ href: '/settings', labelKey: 'settings', icon: Settings }]}
          collapsed={collapsed}
          pathname={pathname}
          t={t}
        />
      </div>
    </aside>
  )
}

export function MobileSidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav className="space-y-4 p-4">
      <NavSection items={mainItems} collapsed={false} pathname={pathname} t={t} />
      <NavSection items={operationsItems} collapsed={false} pathname={pathname} t={t} />
      <NavSection items={financeItems} collapsed={false} pathname={pathname} t={t} />
      <NavSection items={insightItems} collapsed={false} pathname={pathname} t={t} />
      <NavSection
        items={[{ href: '/settings', labelKey: 'settings', icon: Settings }]}
        collapsed={false}
        pathname={pathname}
        t={t}
      />
    </nav>
  )
}
