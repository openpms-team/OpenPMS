'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

let listeners: Array<() => void> = []

function getThemeSnapshot(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null
  return stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

function getServerSnapshot(): Theme {
  return 'light'
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  // Apply the theme class on first subscribe
  const theme = getThemeSnapshot()
  document.documentElement.classList.toggle('dark', theme === 'dark')
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function setThemeValue(next: Theme) {
  localStorage.setItem('theme', next)
  document.documentElement.classList.toggle('dark', next === 'dark')
  for (const listener of listeners) {
    listener()
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot)

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    setThemeValue(next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
