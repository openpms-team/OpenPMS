export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background bg-dots">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
            O
          </div>
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
            OpenPMS
          </span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight text-sidebar-foreground">
            Property management,
            <br />
            <span className="text-sidebar-primary">simplified.</span>
          </h2>
          <p className="text-sm leading-relaxed text-sidebar-foreground/60 max-w-sm">
            Manage your short-term rentals, automate check-ins,
            stay compliant with SEF, and delight your guests.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/30">
          Open-source Property Management System
        </p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:hidden">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold mb-3">
              O
            </div>
            <h1 className="text-2xl font-bold tracking-tight">OpenPMS</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
