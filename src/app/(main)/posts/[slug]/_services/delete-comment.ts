'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getCommentById, softDeleteComment } from '@/db/queries/comments';
import { commentPasswordSchema } from '@/types/comment';

type Result = { success: true } | { success: false; error: string };

export async function deleteCommentAction(
  commentId: number,
  postSlug: string,
  formData: unknown
): Promise<Result> {
  const parsed = commentPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: '비밀번호를 입력해주세요' };
  }

  const comment = await getCommentById(commentId);
  if (!comment) return { success: false, error: '댓글을 찾을 수 없습니다' };

  const isValid = await bcrypt.compare(
    parsed.data.password,
    comment.passwordHash
  );
  if (!isValid)
    return { success: false, error: '비밀번호가 올바르지 않습니다' };

  await softDeleteComment(commentId);
  revalidatePath(`/posts/${postSlug}`);
  return { success: true };
}
