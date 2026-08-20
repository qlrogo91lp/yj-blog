'use server';

import crypto from 'crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { insertComment, selectCommentById } from '@/db/queries/comments';
import { selectPostBySlug } from '@/db/queries/posts';
import { getBlogSettings } from '@/db/queries/settings';
import { sendReplyNotification } from '@/lib/email';
import { adminReplyFormSchema } from '@/types/comment';

type Result = { success: true } | { success: false; error: string };

export async function addAdminReply(
  postId: number,
  postSlug: string,
  parentId: number,
  formData: unknown
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const parsed = adminReplyFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const settings = await getBlogSettings();
    const authorName = settings?.blogName ?? '운영자';
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

    await insertComment({
      postId,
      parentId,
      authorName,
      email: null,
      passwordHash,
      content: parsed.data.content,
      isAuthor: true,
    });

    const [post, parent] = await Promise.all([
      selectPostBySlug(postSlug),
      selectCommentById(parentId),
    ]);

    if (post && parent?.email) {
      await sendReplyNotification({
        to: parent.email,
        postTitle: post.title,
        postSlug,
        authorName,
        replyContent: parsed.data.content,
      }).catch(() => {});
    }

    // 관리자 답글에는 Discord 알림(sendCommentNotification)을 태우지 않는다 — 본인 답글까지 울리면 소음이다
    revalidateTag(CACHE_TAGS.comments, 'max');
    revalidatePath(`/posts/${postSlug}`);
    revalidatePath('/admin/comments');
    return { success: true };
  } catch {
    return { success: false, error: '답글 작성에 실패했습니다' };
  }
}
