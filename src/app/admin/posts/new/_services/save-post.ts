'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { postImages, postTags, posts } from '@/db/schema';
import { deleteR2Objects, r2PublicUrl } from '@/lib/r2';
import { postFormSchema } from '@/types/post';
import { extractR2Keys } from '../_utils/extract-r2-keys';

type SavePostInput = {
  postId?: number | null;
  title: string;
  slug: string;
  content: string;
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

  const parsed = postFormSchema.safeParse({ ...input, contentFormat: 'html' });
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
      await cleanupOrphanImages(input.postId, content, input.thumbnailUrl ?? null);

      revalidateTag(CACHE_TAGS.posts, 'max');
      revalidateTag(CACHE_TAGS.series, 'max');
      revalidateTag(CACHE_TAGS.tags, 'max');
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
      await cleanupOrphanImages(newPost.id, content, input.thumbnailUrl ?? null);

      revalidateTag(CACHE_TAGS.posts, 'max');
      revalidateTag(CACHE_TAGS.series, 'max');
      revalidateTag(CACHE_TAGS.tags, 'max');
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

/**
 * 본문·썸네일에 더 이상 쓰이지 않는 이미지를 R2와 post_images에서 정리한다.
 * 저장 시점에만 실행하므로 편집 중 잘라내기·Undo로 파일이 사라지지 않는다.
 * 실패는 무시한다 — 고아 파일이 남는 게 저장 실패보다 낫다.
 */
async function cleanupOrphanImages(
  postId: number,
  content: string,
  thumbnailUrl: string | null,
): Promise<void> {
  // r2PublicUrl이 비어 있으면(env 미설정 등) 본문·썸네일 속 이미지가 실제로
  // 어떤 R2 key를 가리키는지 안전하게 판별할 수 없다. 이 상태로 진행하면
  // extractR2Keys가 빈 Set을 반환해 모든 post_images row를 고아로 오판하고
  // 전부 삭제해버린다 — 정리를 건너뛰는 게 안전하다(고아가 한 번 더 저장될
  // 때까지 남는 건 무해하지만, 전체 오삭제는 되돌릴 수 없다).
  if (!r2PublicUrl) return;

  try {
    const keep = extractR2Keys(content, r2PublicUrl);
    if (thumbnailUrl && r2PublicUrl && thumbnailUrl.startsWith(`${r2PublicUrl}/`)) {
      keep.add(thumbnailUrl.slice(r2PublicUrl.length + 1));
    }

    const rows = await db
      .select({ id: postImages.id, key: postImages.key })
      .from(postImages)
      .where(eq(postImages.postId, postId));

    const orphans = rows.filter((row) => !keep.has(row.key));
    if (orphans.length === 0) return;

    await deleteR2Objects(orphans.map((row) => row.key));
    await db.delete(postImages).where(
      inArray(
        postImages.id,
        orphans.map((row) => row.id),
      ),
    );
  } catch {
    // 정리 실패는 저장 결과에 영향을 주지 않는다
  }
}
