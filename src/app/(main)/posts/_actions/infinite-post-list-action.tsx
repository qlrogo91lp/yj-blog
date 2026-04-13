'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PostListViewHandler } from '../../_handlers/post-list-view-handler';
import type { PostWithCategory, TagSummary } from '@/types';

type TagsMap = Record<number, TagSummary[]>;

type Props = {
  initialPosts: PostWithCategory[];
  initialTotal: number;
  viewType: 'card' | 'list';
  initialTagsMap?: TagsMap;
};

const LIMIT = 10;

export function InfinitePostListAction({
  initialPosts,
  initialTotal,
  viewType,
  initialTagsMap = {},
}: Props) {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostWithCategory[]>(initialPosts);
  const [tagsMap, setTagsMap] = useState<TagsMap>(initialTagsMap);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setTagsMap(initialTagsMap);
    setPage(1);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal, initialTagsMap]);

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);

    const nextPage = page + 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    params.set('limit', String(LIMIT));
    params.delete('view');

    try {
      const [postsRes, tagsRes] = await Promise.all([
        fetch(`/api/posts?${params.toString()}`),
        fetch(`/api/posts/tags?${params.toString()}`),
      ]);
      const [postsData, newTagsMap]: [{ items: PostWithCategory[]; total: number }, TagsMap] = await Promise.all([
        postsRes.json(),
        tagsRes.json(),
      ]);

      setPosts((prev) => {
        const updated = [...prev, ...postsData.items];
        setHasMore(updated.length < postsData.total);
        return updated;
      });
      setTagsMap((prev) => ({ ...prev, ...newTagsMap }));
      setPage(nextPage);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, searchParams]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <PostListViewHandler posts={posts} viewType={viewType} tagsMap={tagsMap} />
      <div
        ref={observerRef}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        {isFetching && '불러오는 중...'}
        {!isFetching && !hasMore && posts.length > 0 && '모든 글을 불러왔습니다.'}
      </div>
    </>
  );
}
