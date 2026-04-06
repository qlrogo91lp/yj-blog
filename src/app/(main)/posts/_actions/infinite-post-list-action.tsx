'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PostListViewHandler } from '../../_handlers/post-list-view-handler';
import type { PostWithCategory } from '@/types';

type Props = {
  initialPosts: PostWithCategory[];
  initialTotal: number;
  viewType: 'card' | 'list';
};

const LIMIT = 10;

export function InfinitePostListAction({ initialPosts, initialTotal, viewType }: Props) {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostWithCategory[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal]);

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);

    const nextPage = page + 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    params.set('limit', String(LIMIT));
    params.delete('view');

    try {
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(prev => {
        const updated = [...prev, ...data.items];
        setHasMore(updated.length < data.total);
        return updated;
      });
      setPage(nextPage);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, searchParams]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <PostListViewHandler posts={posts} viewType={viewType} />
      <div ref={observerRef} className="py-8 text-center text-sm text-muted-foreground">
        {isFetching && '불러오는 중...'}
        {!isFetching && !hasMore && posts.length > 0 && '모든 글을 불러왔습니다.'}
      </div>
    </>
  );
}
