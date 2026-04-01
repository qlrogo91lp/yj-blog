'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deletePostById } from '@/db/queries/posts';

type Result = { success: true } | { success: false; error: string };

export async function deletePost(postId: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    const result = await deletePostById(postId);

    if (result.length === 0) {
      return { success: false, error: '글을 찾을 수 없습니다' };
    }

    revalidateTag(CACHE_TAGS.posts, 'default');
    revalidateTag(CACHE_TAGS.comments, 'default');
    revalidatePath('/admin/posts');

    return { success: true };
  } catch {
    return { success: false, error: '삭제에 실패했습니다' };
  }
}
