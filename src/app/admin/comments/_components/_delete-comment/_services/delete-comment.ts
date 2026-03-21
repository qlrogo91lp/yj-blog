'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { softDeleteComment } from '@/db/queries/comments'

type Result = { success: true } | { success: false; error: string }

export async function adminDeleteCommentAction(commentId: number): Promise<Result> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: '인증이 필요합니다' }

  try {
    await softDeleteComment(commentId)
    revalidatePath('/admin/comments')
    return { success: true }
  } catch {
    return { success: false, error: '삭제에 실패했습니다' }
  }
}
