'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { categoryFormSchema } from '@/types/category'
import { createCategory } from '@/db/queries/categories'

type Result = { success: true } | { success: false; error: string }

export async function createCategoryAction(formData: unknown): Promise<Result> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' }
  }

  const parsed = categoryFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await createCategory(parsed.data)
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '이미 사용 중인 slug입니다' }
    }
    return { success: false, error: '카테고리 생성에 실패했습니다' }
  }
}
