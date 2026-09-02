import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SeriesPostItem } from '@/types';

type Props = {
  prev: SeriesPostItem | null;
  next: SeriesPostItem | null;
};

export function SeriesPrevNext({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="시리즈 내 글 이동" className="mt-10 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/posts/${prev.slug}`}
          className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft size={14} />
            이전 글
          </span>
          <span className="mt-1 block truncate font-medium group-hover:underline">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/posts/${next.slug}`}
          className="group rounded-lg border p-4 text-right transition-colors hover:bg-muted/50"
        >
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            다음 글
            <ChevronRight size={14} />
          </span>
          <span className="mt-1 block truncate font-medium group-hover:underline">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
