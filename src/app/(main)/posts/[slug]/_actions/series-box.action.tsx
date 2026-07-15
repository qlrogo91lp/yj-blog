'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import type { SeriesPostItem } from '@/types';

type Props = {
  name: string;
  slug: string;
  posts: SeriesPostItem[];
  currentPostId: number;
};

export function SeriesBoxAction({ name, slug, posts, currentPostId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const currentIndex = posts.findIndex((p) => p.id === currentPostId);

  return (
    <section className="mb-8 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Layers size={16} className="shrink-0 text-muted-foreground" />
          <Link
            href={`/series/${slug}`}
            className="truncate font-semibold hover:underline"
          >
            {name}
          </Link>
          <span className="shrink-0 text-sm text-muted-foreground">
            {currentIndex + 1} / {posts.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? '목록 접기' : '목록 펼치기'}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <ol className="mt-3 space-y-1.5">
          {posts.map((p, i) => (
            <li key={p.id} className="flex gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">{i + 1}.</span>
              {p.id === currentPostId ? (
                <span aria-current="page" className="truncate font-medium">
                  {p.title}
                </span>
              ) : (
                <Link
                  href={`/posts/${p.slug}`}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  {p.title}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
