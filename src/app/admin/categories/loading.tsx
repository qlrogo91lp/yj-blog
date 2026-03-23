import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCategoriesLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
