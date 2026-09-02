'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deleteUnusedTags } from '@/db/queries/tags';

type Result =
  | { success: true; removed: number }
  | { success: false; error: string };

export async function removeUnusedTags(): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    const removed = await deleteUnusedTags();

    revalidateTag(CACHE_TAGS.tags, 'max');
    revalidatePath('/admin/tags');
    return { success: true, removed: removed.length };
  } catch {
    return { success: false, error: '미사용 태그 정리에 실패했습니다' };
  }
}
