import { Skeleton } from '@/components/ui/skeleton'

export default function MessagesLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
