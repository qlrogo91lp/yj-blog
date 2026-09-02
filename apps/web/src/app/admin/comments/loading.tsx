import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCommentsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <Skeleton className="mb-3 h-4 w-40" />
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
