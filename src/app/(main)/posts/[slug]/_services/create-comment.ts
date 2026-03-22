'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { createComment, getCommentById } from '@/db/queries/comments';
import { getPostBySlug } from '@/db/queries/posts';
import { sendCommentNotification } from '@/lib/discord';
import { sendReplyNotification } from '@/lib/email';
import { commentFormSchema } from '@/types/comment';

type Result = { success: true } | { success: false; error: string };

export async function createCommentAction(
  postId: number,
  postSlug: string,
  formData: unknown
): Promise<Result> {
  const parsed = commentFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { authorName, email, password, content, parentId } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const emailValue = email === '' ? null : (email ?? null);

  try {
    await createComment({
      postId,
      parentId,
      authorName,
      email: emailValue,
      passwordHash,
      content,
    });

    const post = await getPostBySlug(postSlug);
    if (post) {
      sendCommentNotification({
        postTitle: post.title,
        postSlug,
        authorName,
        content,
        isReply: !!parentId,
      }).catch(() => {});
    }

    if (parentId && post) {
      const parent = await getCommentById(parentId);
      if (parent?.email) {
        await sendReplyNotification({
          to: parent.email,
          postTitle: post.title,
          postSlug,
          authorName,
          replyContent: content,
        }).catch(() => {});
      }
    }

    revalidatePath(`/posts/${postSlug}`);
    return { success: true };
  } catch {
    return { success: false, error: '댓글 작성에 실패했습니다' };
  }
}
