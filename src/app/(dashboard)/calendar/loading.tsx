import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-9" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}
