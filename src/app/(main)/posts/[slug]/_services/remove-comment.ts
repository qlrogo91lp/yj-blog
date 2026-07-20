'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import bcrypt from 'bcryptjs';
import { CACHE_TAGS } from '@/db/cache-tags';
import { selectCommentById, softDeleteComment } from '@/db/queries/comments';
import { commentPasswordSchema } from '@/types/comment';

type Result = { success: true } | { success: false; error: string };

export async function removeComment(
  commentId: number,
  postSlug: string,
  formData: unknown
): Promise<Result> {
  const parsed = commentPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: '비밀번호를 입력해주세요' };
  }

  const comment = await selectCommentById(commentId);
  if (!comment) return { success: false, error: '댓글을 찾을 수 없습니다' };

  const isValid = await bcrypt.compare(
    parsed.data.password,
    comment.passwordHash
  );
  if (!isValid)
    return { success: false, error: '비밀번호가 올바르지 않습니다' };

  await softDeleteComment(commentId);
  // selectCommentsByPostId가 unstable_cache로 감싸져 있어 revalidatePath만으로는
  // 캐시 엔트리가 무효화되지 않는다. 태그 무효화가 반드시 함께 필요하다.
  revalidateTag(CACHE_TAGS.comments, 'max');
  revalidatePath(`/posts/${postSlug}`);
  return { success: true };
}
