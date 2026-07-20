import { Skeleton } from '@/components/ui/skeleton';

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card">
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <div className="p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-5 w-full" />
              <Skeleton className="mt-2 h-5 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
