import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPostsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
