import { Skeleton } from '@/components/ui/skeleton';

export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-5/6" />
      <Skeleton className="mt-3 h-9 w-2/3" />
      <Skeleton className="mt-5 h-3 w-40" />
      <Skeleton className="mt-8 aspect-video w-full" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full last:w-2/3" />
        ))}
      </div>
    </div>
  );
}
