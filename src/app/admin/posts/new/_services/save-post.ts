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
};

type SavePostResult =
  | {
      success: true;
      postId: number;
      status: 'draft' | 'published';
      publishedAt: Date | null;
    }
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
      // publishedAt은 클라이언트 입력을 신뢰하지 않고 DB 현재값 기준으로 결정한다.
      // - published: 이미 있으면 유지, 없으면(첫 발행) 지금
      // - draft: null
      const [current] = await db
        .select({ publishedAt: posts.publishedAt })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);
      if (!current) {
        return { success: false, error: '글을 찾을 수 없습니다' };
      }
      const publishedAt =
        status === 'published' ? (current.publishedAt ?? new Date()) : null;

      const updateData: Partial<typeof posts.$inferInsert> = {
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
        updatedAt: new Date(),
      };

      await db.update(posts).set(updateData).where(eq(posts.id, input.postId));
      await syncPostTags(input.postId, tagIds);

      revalidateTag(CACHE_TAGS.posts, 'max');
      revalidateTag(CACHE_TAGS.series, 'max');
      revalidatePath('/admin/posts');
      return { success: true, postId: input.postId, status, publishedAt };
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
      return { success: true, postId: newPost.id, status, publishedAt };
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
