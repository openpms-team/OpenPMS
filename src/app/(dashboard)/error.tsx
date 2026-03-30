'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-lg">!</span>
      </div>
      <h2 className="text-lg font-bold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-sm text-center">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
