'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deleteTag as deleteTagQuery } from '@/db/queries/tags';

type Result = { success: true } | { success: false; error: string };

export async function deleteTag(id: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    await deleteTagQuery(id);
    revalidateTag(CACHE_TAGS.tags, 'max');
    revalidateTag(CACHE_TAGS.posts, 'max');
    revalidatePath('/admin/tags');
    return { success: true };
  } catch {
    return { success: false, error: '태그 삭제에 실패했습니다' };
  }
}
