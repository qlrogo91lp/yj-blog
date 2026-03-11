'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { postFormSchema } from '@/types/post'

type SavePostInput = {
  postId?: number | null
  title: string
  slug: string
  content: string
  contentFormat: 'markdown' | 'html'
  excerpt?: string
  categoryId: number | null
  status: 'draft' | 'published'
}

type SavePostResult =
  | { success: true; postId: number }
  | { success: false; error: string }

export async function savePost(input: SavePostInput): Promise<SavePostResult> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' }
  }

  const parsed = postFormSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { title, slug, content, contentFormat, excerpt, categoryId, status } = parsed.data
  const publishedAt = status === 'published' ? new Date() : null

  try {
    if (input.postId) {
      // UPDATE
      await db
        .update(posts)
        .set({
          title,
          slug,
          content,
          contentFormat,
          excerpt: excerpt ?? null,
          categoryId,
          status,
          publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.postId))

      return { success: true, postId: input.postId }
    } else {
      // INSERT
      const [newPost] = await db
        .insert(posts)
        .values({
          title,
          slug,
          content,
          contentFormat,
          excerpt: excerpt ?? null,
          categoryId,
          status,
          publishedAt,
        })
        .returning({ id: posts.id })

      return { success: true, postId: newPost.id }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '이미 사용 중인 slug입니다' }
    }
    return { success: false, error: '저장에 실패했습니다' }
  }
}
