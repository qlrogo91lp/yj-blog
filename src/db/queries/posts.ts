import { db } from '@/db'
import { posts, categories } from '@/db/schema'
import { and, count, desc, eq } from 'drizzle-orm'
import type { PostWithCategory } from '@/types'

interface GetPostsOptions {
  categoryId?: number
  page?: number
  limit?: number
}

/**
 * 발행된 글 목록 (카테고리 join, 페이지네이션)
 */
export async function getPosts({ categoryId, page = 1, limit = 10 }: GetPostsOptions = {}) {
  const offset = (page - 1) * limit
  const where = and(
    eq(posts.status, 'published'),
    categoryId ? eq(posts.categoryId, categoryId) : undefined,
  )

  const [items, totalResult] = await Promise.all([
    db
      .select({ post: posts, category: categories })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(where)
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(posts).where(where),
  ])

  return {
    items: items.map(({ post, category }) => ({ ...post, category })) as PostWithCategory[],
    total: totalResult[0].total,
    page,
    limit,
  }
}

/**
 * slug로 글 상세 조회 (category join)
 */
export async function getPostBySlug(slug: string): Promise<PostWithCategory | null> {
  const result = await db
    .select({ post: posts, category: categories })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.slug, slug))
    .limit(1)

  if (!result[0]) return null
  const { post, category } = result[0]
  return { ...post, category }
}

/**
 * 관리자용 전체 글 목록 (draft 포함, 최근 수정 순)
 */
export async function getAllPostsForAdmin() {
  const result = await db
    .select({ post: posts, category: categories })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .orderBy(desc(posts.updatedAt))

  return result.map(({ post, category }) => ({ ...post, category })) as PostWithCategory[]
}
