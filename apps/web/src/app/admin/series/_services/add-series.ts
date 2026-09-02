'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { insertSeries } from '@/db/queries/series';
import { seriesFormSchema } from '@/types/series';

type Result = { success: true } | { success: false; error: string };

export async function addSeries(formData: unknown): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const parsed = seriesFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await insertSeries(parsed.data);
    revalidateTag(CACHE_TAGS.series, 'max');
    revalidatePath('/admin/series');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '이미 사용 중인 slug입니다' };
    }
    return { success: false, error: '시리즈 생성에 실패했습니다' };
  }
}
