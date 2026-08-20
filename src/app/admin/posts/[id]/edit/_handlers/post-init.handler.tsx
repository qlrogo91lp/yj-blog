'use client';

import { useEffect } from 'react';
import type { Post } from '@/types';
import { useNewPostStore } from '../../../new/_store';

type Props = {
  post: Post;
  /** 편집기에 넣을 HTML. 마크다운 글이면 서버에서 변환된 값이 들어온다. */
  content: string;
  initialTagIds: number[];
};

export function PostInitHandler({ post, content, initialTagIds }: Props) {
  useEffect(() => {
    useNewPostStore.getState().initializePost({
      postId: post.id,
      title: post.title,
      content,
      categoryId: post.categoryId,
      seriesId: post.seriesId,
      tagIds: initialTagIds,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      metaTitle: post.metaTitle ?? '',
      thumbnailUrl: post.thumbnailUrl ?? null,
      status: post.status,
      publishedAt: post.publishedAt,
    });

    return () => {
      useNewPostStore.getState().reset();
    };
  }, [post, content, initialTagIds]);

  return null;
}
