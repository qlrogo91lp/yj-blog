import { Skeleton } from '@/components/ui/skeleton';

export default function AdminStatisticsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-28" />

      <div className="mb-6 rounded-lg border">
        <div className="flex flex-wrap divide-x p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 px-6 py-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
