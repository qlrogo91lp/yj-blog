'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { deleteCategory } from '@/db/queries/categories';

type Result = { success: true } | { success: false; error: string };

export async function deleteCategoryAction(id: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    await deleteCategory(id);
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('foreign')) {
      return {
        success: false,
        error: '이 카테고리를 사용 중인 글이 있어 삭제할 수 없습니다',
      };
    }
    return { success: false, error: '카테고리 삭제에 실패했습니다' };
  }
}
