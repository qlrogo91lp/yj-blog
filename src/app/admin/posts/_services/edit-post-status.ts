'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updatePostStatus } from '@/db/queries/posts';

type Result = { success: true } | { success: false; error: string };

export async function editPostStatus(
  postId: number,
  status: 'draft' | 'published'
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  if (status !== 'draft' && status !== 'published') {
    return { success: false, error: '잘못된 상태값입니다' };
  }

  try {
    const updated = await updatePostStatus(postId, status);

    if (updated.length === 0) {
      return { success: false, error: '글을 찾을 수 없습니다' };
    }

    revalidateTag(CACHE_TAGS.posts, 'max');
    revalidatePath('/admin/posts');
    return { success: true };
  } catch {
    return { success: false, error: '상태 변경에 실패했습니다' };
  }
}
