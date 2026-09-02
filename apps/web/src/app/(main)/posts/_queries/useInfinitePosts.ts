import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPosts, getPostsTags } from './get-posts';
import type { PostWithCategory, TagSummary } from '@/types';

type TagsMap = Record<number, TagSummary[]>;

type UseInfinitePostsParams = {
  initialPosts: PostWithCategory[];
  initialTotal: number;
  initialTagsMap?: TagsMap;
};

const LIMIT = 10;

export function useInfinitePosts({
  initialPosts,
  initialTotal,
  initialTagsMap = {},
}: UseInfinitePostsParams) {
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
      const [postsData, newTagsMap] = await Promise.all([
        getPosts(params),
        getPostsTags(params),
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

  return { posts, tagsMap, isFetching, hasMore, observerRef };
}
