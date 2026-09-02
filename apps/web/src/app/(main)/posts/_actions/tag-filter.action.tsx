'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { TagSummary } from '@/types';

type TagWithCount = TagSummary & { postCount: number };

type Props = {
  tags: TagWithCount[];
  currentSlug?: string;
};

export function TagFilterAction({ tags, currentSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (slug) {
      params.set('tag', slug);
    } else {
      params.delete('tag');
    }
    router.push(`/posts?${params.toString()}`);
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      <Link
        href="/tags"
        className="px-3 py-1 rounded-full text-sm font-medium transition-colors border bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
      >
        태그 목록
      </Link>
      {tags.map((tag) => {
        const isActive = tag.slug === currentSlug;
        return (
          <button
            key={tag.id}
            onClick={() => navigate(isActive ? undefined : tag.slug)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer border',
              isActive
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground',
            )}
          >
            #{tag.name}
          </button>
        );
      })}
    </div>
  );
}
