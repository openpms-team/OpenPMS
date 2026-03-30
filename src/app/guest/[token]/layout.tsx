import { ReactNode } from 'react'

export const metadata = {
  title: 'Guest Portal — OpenPMS',
}

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Subtle header bar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              O
            </div>
            <span className="text-sm font-semibold tracking-tight">
              OpenPMS
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Guest Portal</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 animate-fade-in">
        {children}
      </main>

      <footer className="border-t border-border/30 mt-auto">
        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground/50">
            Powered by OpenPMS
          </p>
        </div>
      </footer>
    </div>
  )
}
