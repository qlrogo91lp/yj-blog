'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { postTags, posts } from '@/db/schema';
import { postFormSchema } from '@/types/post';

type SavePostInput = {
  postId?: number | null;
  title: string;
  slug: string;
  content: string;
  contentFormat: 'markdown' | 'html';
  excerpt?: string;
  metaTitle?: string;
  thumbnailUrl?: string | null;
  categoryId: number | null;
  seriesId: number | null;
  tagIds?: number[];
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

  const {
    title,
    slug,
    content,
    contentFormat,
    excerpt,
    categoryId,
    seriesId,
    status,
    metaTitle,
  } = parsed.data;

  const tagIds = input.tagIds ?? [];

  try {
    if (input.postId) {
      // UPDATE — publishedAt은 처음 발행할 때만 설정
      const updateData: Record<string, unknown> = {
        title,
        slug,
        content,
        contentFormat,
        excerpt: excerpt && excerpt.length > 0 ? excerpt : null,
        metaTitle: metaTitle && metaTitle.length > 0 ? metaTitle : null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        categoryId,
        seriesId,
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
      await syncPostTags(input.postId, tagIds);

      revalidateTag(CACHE_TAGS.posts, 'max');
      revalidateTag(CACHE_TAGS.series, 'max');
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
          excerpt: excerpt && excerpt.length > 0 ? excerpt : null,
          metaTitle: metaTitle && metaTitle.length > 0 ? metaTitle : null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          categoryId,
          seriesId,
          status,
          publishedAt,
        })
        .returning({ id: posts.id });

      await syncPostTags(newPost.id, tagIds);

      revalidateTag(CACHE_TAGS.posts, 'max');
      revalidateTag(CACHE_TAGS.series, 'max');
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

async function syncPostTags(postId: number, tagIds: number[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length > 0) {
    await db
      .insert(postTags)
      .values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}
