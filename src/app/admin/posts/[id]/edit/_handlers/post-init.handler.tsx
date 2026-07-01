'use client';

import { useEffect } from 'react';
import type { Post } from '@/types';
import { useNewPostStore } from '../../../new/_store';

type Props = {
  post: Post;
  initialTagIds: number[];
};

export function PostInitHandler({ post, initialTagIds }: Props) {
  useEffect(() => {
    useNewPostStore.getState().initializePost({
      postId: post.id,
      title: post.title,
      content: post.content,
      contentFormat: post.contentFormat as 'markdown' | 'html',
      categoryId: post.categoryId,
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
  }, [post, initialTagIds]);

  return null;
}
