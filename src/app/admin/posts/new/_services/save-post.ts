'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { posts } from '@/db/schema';
import { postFormSchema } from '@/types/post';

type SavePostInput = {
  postId?: number | null;
  title: string;
  slug: string;
  content: string;
  contentFormat: 'markdown' | 'html';
  excerpt?: string;
  thumbnailUrl?: string | null;
  categoryId: number | null;
  status: 'draft' | 'published';
  publishedAt?: Date | null;
};

type SavePostResult =
  | { success: true; postId: number }
  | { success: false; error: string };

export async function savePost(input: SavePostInput): Promise<SavePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const parsed = postFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { title, slug, content, contentFormat, excerpt, categoryId, status } =
    parsed.data;

  try {
    if (input.postId) {
      // UPDATE — publishedAt은 처음 발행할 때만 설정
      const updateData: Record<string, unknown> = {
        title,
        slug,
        content,
        contentFormat,
        excerpt: excerpt ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        categoryId,
        status,
        updatedAt: new Date(),
      };
      if (status === 'published' && !input.publishedAt) {
        updateData.publishedAt = new Date();
      }
      if (status === 'draft') {
        updateData.publishedAt = null;
      }

      await db.update(posts).set(updateData).where(eq(posts.id, input.postId));

      revalidateTag(CACHE_TAGS.posts, 'default');
      revalidatePath('/admin/posts');
      return { success: true, postId: input.postId };
    } else {
      // INSERT
      const publishedAt = status === 'published' ? new Date() : null;
      const [newPost] = await db
        .insert(posts)
        .values({
          title,
          slug,
          content,
          contentFormat,
          excerpt: excerpt ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          categoryId,
          status,
          publishedAt,
        })
        .returning({ id: posts.id });

      revalidateTag(CACHE_TAGS.posts, 'default');
      revalidatePath('/admin/posts');
      return { success: true, postId: newPost.id };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '이미 사용 중인 slug입니다' };
    }
    return { success: false, error: '저장에 실패했습니다' };
  }
}
