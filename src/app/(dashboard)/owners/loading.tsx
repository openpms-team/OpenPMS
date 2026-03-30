import { Skeleton } from '@/components/ui/skeleton'

export default function OwnersLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-8 w-36" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}
