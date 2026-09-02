'use client';

import { PostListViewHandler } from '../../_handlers/post-list-view.handler';
import { useInfinitePosts } from '../_queries/useInfinitePosts';
import type { PostWithCategory, TagSummary } from '@/types';

type TagsMap = Record<number, TagSummary[]>;

type Props = {
  initialPosts: PostWithCategory[];
  initialTotal: number;
  viewType: 'card' | 'list';
  initialTagsMap?: TagsMap;
};

export function InfinitePostListAction({
  initialPosts,
  initialTotal,
  viewType,
  initialTagsMap = {},
}: Props) {
  const { posts, tagsMap, isFetching, hasMore, observerRef } = useInfinitePosts({
    initialPosts,
    initialTotal,
    initialTagsMap,
  });

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
