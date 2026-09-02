'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updateReferrerExcludes } from '@/db/queries/settings';

type Result = { success: true } | { success: false; error: string };

export async function editReferrerExcludes(excludes: string[]): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const cleaned = excludes.map((item) => item.trim()).filter(Boolean);

  try {
    await updateReferrerExcludes(cleaned);
    // getBlogSettings()가 unstable_cache로 감싸져 있어 태그 무효화가 필요하다
    revalidateTag(CACHE_TAGS.settings, 'max');
    revalidatePath('/admin/statistics/referrers');
    return { success: true };
  } catch {
    return { success: false, error: '저장에 실패했습니다' };
  }
}
