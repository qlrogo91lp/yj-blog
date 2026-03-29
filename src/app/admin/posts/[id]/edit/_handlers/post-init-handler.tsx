'use client';

import { useEffect } from 'react';
import type { Post } from '@/types';
import { useNewPostStore } from '../../../new/_store';

type Props = {
  post: Post;
};

export function PostInitHandler({ post }: Props) {
  useEffect(() => {
    useNewPostStore.getState().initializePost({
      postId: post.id,
      title: post.title,
      content: post.content,
      contentFormat: post.contentFormat as 'markdown' | 'html',
      categoryId: post.categoryId,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      thumbnailUrl: post.thumbnailUrl ?? null,
      status: post.status,
      publishedAt: post.publishedAt,
    });

    return () => {
      useNewPostStore.getState().reset();
    };
  }, [post]);

  return null;
}
