import { unstable_cache } from 'next/cache';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { categories, comments, postTags, posts, tags } from '@/db/schema';
import type { PostWithCategory, PostWithCategoryAndTags } from '@/types';

interface GetPostsOptions {
  categoryId?: number;
  tagId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * 발행된 글 목록 (카테고리 join, 페이지네이션, 검색)
 */
export async function getPosts({
  categoryId,
  tagId,
  page = 1,
  limit = 10,
  search,
}: GetPostsOptions = {}) {
  const offset = (page - 1) * limit;
  const where = and(
    eq(posts.status, 'published'),
    categoryId ? eq(posts.categoryId, categoryId) : undefined,
    tagId ? eq(postTags.tagId, tagId) : undefined,
    search
      ? or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.content, `%${search}%`)
        )
      : undefined
  );

  const baseQuery = tagId
    ? db
        .select({ post: posts, category: categories })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(categories, eq(posts.categoryId, categories.id))
    : db
        .select({ post: posts, category: categories })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id));

  const countQuery = tagId
    ? db
        .select({ total: count() })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
    : db.select({ total: count() }).from(posts);

  const [items, totalResult] = await Promise.all([
    baseQuery
      .where(where)
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset),
    countQuery.where(where),
  ]);

  return {
    items: items.map(({ post, category }) => ({
      ...post,
      category,
    })) as PostWithCategory[],
    total: totalResult[0].total,
    page,
    limit,
  };
}

/**
 * slug로 글 상세 조회 (category + tags join)
 */
export async function getPostBySlug(
  slug: string
): Promise<PostWithCategoryAndTags | null> {
  const result = await db
    .select({ post: posts, category: categories })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!result[0]) return null;
  const { post, category } = result[0];

  const tagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id));

  return { ...post, category, tags: tagRows };
}

/**
 * ID로 글 단건 조회 (관리자 수정용)
 */
export async function getPostById(id: number) {
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  return result[0] ?? null;
}

/**
 * 관리자용 전체 글 목록 (draft 포함, 최근 수정 순)
 */
export const getAllPostsForAdmin = unstable_cache(
  async () => {
    const result = await db
      .select({ post: posts, category: categories })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.publishedAt));

    return result.map(({ post, category }) => ({
      ...post,
      category,
    })) as PostWithCategory[];
  },
  ['admin-posts-list'],
  { tags: [CACHE_TAGS.posts] }
);

/**
 * 관리자 대시보드 통계 (글·댓글 카운트)
 */
export const getAdminDashboardStats = unstable_cache(
  async () => {
    const [totalPosts, publishedPosts, draftPosts, totalComments] =
      await Promise.all([
        db.select({ count: count() }).from(posts),
        db.select({ count: count() }).from(posts).where(eq(posts.status, 'published')),
        db.select({ count: count() }).from(posts).where(eq(posts.status, 'draft')),
        db.select({ count: count() }).from(comments),
      ]);

    return {
      totalPosts: totalPosts[0].count,
      publishedPosts: publishedPosts[0].count,
      draftPosts: draftPosts[0].count,
      totalComments: totalComments[0].count,
    };
  },
  ['admin-dashboard-stats'],
  { tags: [CACHE_TAGS.posts, CACHE_TAGS.comments] }
);

/**
 * 관리자 대시보드 최근 글 목록 (draft 포함, 수정 시각 내림차순)
 */
export const getRecentPostsForAdmin = unstable_cache(
  async (limit = 5) => {
    const result = await db
      .select({ post: posts, category: categories })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.updatedAt))
      .limit(limit);

    return result.map(({ post, category }) => ({
      ...post,
      category,
    })) as PostWithCategory[];
  },
  ['admin-recent-posts'],
  { tags: [CACHE_TAGS.posts] }
);

/**
 * 글 삭제 (물리 삭제, 댓글 cascade)
 */
export async function deletePostById(id: number) {
  return db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
}
