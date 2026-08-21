import { unstable_cache } from 'next/cache';
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { categories, comments, postTags, posts, tags } from '@/db/schema';
import type {
  AdminPostRow,
  PostWithCategory,
  PostWithCategoryAndTags,
} from '@/types';

interface GetPostsOptions {
  categoryId?: number;
  tagId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

async function selectPostsUncached({
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
 * 발행된 글 목록 (카테고리 join, 페이지네이션, 검색)
 *
 * search는 카디널리티가 높아 캐시 키가 발산하므로 캐시를 우회한다.
 */
export async function selectPosts(options: GetPostsOptions = {}) {
  const { categoryId, tagId, page = 1, limit = 10, search } = options;

  if (search) return selectPostsUncached(options);

  return unstable_cache(
    () => selectPostsUncached(options),
    [
      'posts-list',
      String(categoryId ?? ''),
      String(tagId ?? ''),
      String(page),
      String(limit),
    ],
    { tags: [CACHE_TAGS.posts] }
  )();
}

async function selectPostBySlugUncached(
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
 * slug로 글 상세 조회 (category + tags join)
 */
export async function selectPostBySlug(
  slug: string
): Promise<PostWithCategoryAndTags | null> {
  return unstable_cache(
    () => selectPostBySlugUncached(slug),
    ['post-by-slug', slug],
    { tags: [CACHE_TAGS.posts] }
  )();
}

/**
 * ID로 글 단건 조회 (관리자 수정용)
 */
export async function selectPostById(id: number) {
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  return result[0] ?? null;
}

/**
 * 관리자용 전체 글 목록 (draft 포함, 최근 수정 순)
 */
export const getAllPostsForAdmin = unstable_cache(
  async (): Promise<AdminPostRow[]> => {
    const result = await db
      .select({
        post: posts,
        category: categories,
        commentCount: sql<number>`(
          select count(*) from ${comments} where ${comments.postId} = ${posts.id}
        )`.mapWith(Number),
        tagNames: sql<string[]>`coalesce((
          select array_agg(${tags.name})
          from ${postTags}
          join ${tags} on ${tags.id} = ${postTags.tagId}
          where ${postTags.postId} = ${posts.id}
        ), '{}')`,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.updatedAt));

    return result.map(({ post, category, commentCount, tagNames }) => ({
      ...post,
      category,
      commentCount,
      tagNames,
    })) as AdminPostRow[];
  },
  ['admin-posts-list'],
  { tags: [CACHE_TAGS.posts, CACHE_TAGS.comments, CACHE_TAGS.tags] }
);

/**
 * 글 삭제 (물리 삭제, 댓글 cascade)
 */
export async function deletePostById(id: number) {
  return db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
}

/**
 * 글의 발행 상태만 변경한다.
 *
 * publishedAt은 처음 발행할 때(null → published)만 채우고, 그 외에는 건드리지
 * 않는다. 목록의 원클릭 토글로 발행일이 리셋되면 블로그 정렬이 조용히 바뀌기
 * 때문이다. (에디터의 savePost는 draft 전환 시 null로 지우는 다른 정책을 쓴다)
 */
export async function updatePostStatus(
  id: number,
  status: 'draft' | 'published'
) {
  return db
    .update(posts)
    .set({
      status,
      publishedAt:
        status === 'published'
          ? sql`coalesce(${posts.publishedAt}, now())`
          : posts.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning({ id: posts.id });
}

/**
 * 이어 쓸 글 — 임시저장 상태의 글을 최근 수정 순으로.
 */
export const selectDraftQueue = unstable_cache(
  async (limit = 5) => {
    return db
      .select({
        id: posts.id,
        title: posts.title,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'draft'))
      .orderBy(desc(posts.updatedAt))
      .limit(limit);
  },
  ['admin-draft-queue'],
  { tags: [CACHE_TAGS.posts] }
);

/**
 * 임시저장 글 총 개수 — selectDraftQueue(limit)와 별개로, 위젯 뱃지에 쓰는
 * 전체 카운트. limit에 상관없이 항상 실제 총합을 반환한다.
 */
export const selectDraftCount = unstable_cache(
  async () => {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, 'draft'));

    return result[0].count;
  },
  ['admin-draft-count'],
  { tags: [CACHE_TAGS.posts] }
);
