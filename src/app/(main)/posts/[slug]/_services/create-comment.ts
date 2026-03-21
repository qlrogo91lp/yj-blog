'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { commentFormSchema } from '@/types/comment'
import { createComment, getCommentById } from '@/db/queries/comments'
import { getPostBySlug } from '@/db/queries/posts'
import { sendReplyNotification } from '@/lib/email'

type Result = { success: true } | { success: false; error: string }

export async function createCommentAction(
  postId: number,
  postSlug: string,
  formData: unknown,
): Promise<Result> {
  const parsed = commentFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { authorName, email, password, content, parentId } = parsed.data
  const passwordHash = await bcrypt.hash(password, 10)
  const emailValue = email === '' ? null : (email ?? null)

  try {
    await createComment({ postId, parentId, authorName, email: emailValue, passwordHash, content })

    if (parentId) {
      const parent = await getCommentById(parentId)
      if (parent?.email) {
        const post = await getPostBySlug(postSlug)
        if (post) {
          await sendReplyNotification({
            to: parent.email,
            postTitle: post.title,
            postSlug,
            authorName,
            replyContent: content,
          }).catch(() => {})
        }
      }
    }

    revalidatePath(`/posts/${postSlug}`)
    return { success: true }
  } catch {
    return { success: false, error: '댓글 작성에 실패했습니다' }
  }
}
