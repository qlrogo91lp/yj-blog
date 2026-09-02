'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deleteSeries } from '@/db/queries/series';

type Result = { success: true } | { success: false; error: string };

export async function removeSeries(id: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    await deleteSeries(id);
    // 소속 글의 seriesId는 FK onDelete: 'set null'로 자동 해제
    revalidateTag(CACHE_TAGS.series, 'max');
    revalidateTag(CACHE_TAGS.posts, 'max');
    revalidatePath('/admin/series');
    return { success: true };
  } catch {
    return { success: false, error: '시리즈 삭제에 실패했습니다' };
  }
}
