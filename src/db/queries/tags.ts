import { unstable_cache } from 'next/cache';
import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { categories, postTags, posts, tags } from '@/db/schema';
import type { PostWithCategory, TagSummary } from '@/types';

/**
 * 전체 태그 목록 (글 수 포함)
 */
export const getAllTags = unstable_cache(
  async () => {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        postCount: count(postTags.postId),
      })
      .from(tags)
      .leftJoin(postTags, eq(tags.id, postTags.tagId))
      .groupBy(tags.id)
      .orderBy(tags.name);

    return result;
  },
  ['tags-all'],
  { tags: [CACHE_TAGS.tags] }
);

/**
 * slug로 태그 단건 조회
 */
export const getTagBySlug = unstable_cache(
  async (slug: string) => {
    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    return result[0] ?? null;
  },
  ['tag-by-slug'],
  { tags: [CACHE_TAGS.tags] }
);

/**
 * 특정 태그가 붙은 발행 글 목록 (category join, 최신 발행 순)
 */
export const getPostsByTag = unstable_cache(
  async (tagId: number, { page = 1, limit = 10 }: { page?: number; limit?: number } = {}) => {
    const offset = (page - 1) * limit;

    const [items, totalResult] = await Promise.all([
      db
        .select({ post: posts, category: categories })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(eq(postTags.tagId, tagId))
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
        .where(eq(postTags.tagId, tagId)),
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
  },
  ['posts-by-tag'],
  { tags: [CACHE_TAGS.tags, CACHE_TAGS.posts] }
);

/**
 * 특정 글에 연결된 태그 목록
 */
export async function getTagsByPostId(postId: number): Promise<TagSummary[]> {
  return db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));
}

/**
 * 여러 글의 태그를 일괄 조회 → Map<postId, TagSummary[]>
 */
export async function getTagsByPostIds(
  postIds: number[]
): Promise<Map<number, TagSummary[]>> {
  if (postIds.length === 0) return new Map();

  const rows = await db
    .select({
      postId: postTags.postId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  const map = new Map<number, TagSummary[]>();
  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    map.set(row.postId, list);
  }
  return map;
}
