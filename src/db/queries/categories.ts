import { unstable_cache } from 'next/cache';
import { asc, count, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { categories, posts } from '@/db/schema';
import type { Category, CategoryWithCount } from '@/types';
import type { CategoryFormValues } from '@/types/category';

/**
 * 전체 카테고리 목록 (이름 알파벳 순)
 */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    return db.select().from(categories).orderBy(categories.name);
  },
  ['categories-list'],
  { tags: [CACHE_TAGS.categories] }
);

/**
 * 카테고리 목록 + 글 수 집계 (이름 순)
 */
export const getCategoriesWithPostCount = unstable_cache(
  async (): Promise<CategoryWithCount[]> => {
    const rows = await db
      .select({
        category: categories,
        postCount: count(posts.id),
      })
      .from(categories)
      .leftJoin(posts, eq(posts.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return rows.map(({ category, postCount }) => ({ ...category, postCount }));
  },
  ['categories-with-count'],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.posts] }
);

/**
 * 카테고리가 지정되지 않은 글 (오래된 순)
 */
export const selectUncategorizedPosts = unstable_cache(
  async (): Promise<{ id: number; title: string }[]> => {
    return db
      .select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(isNull(posts.categoryId))
      .orderBy(asc(posts.createdAt));
  },
  ['uncategorized-posts'],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.posts] }
);

async function selectCategoryBySlugUncached(
  slug: string
): Promise<Category | null> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return result[0] ?? null;
}

/**
 * slug로 카테고리 단건 조회
 */
export async function selectCategoryBySlug(
  slug: string
): Promise<Category | null> {
  return unstable_cache(
    () => selectCategoryBySlugUncached(slug),
    ['category-by-slug', slug],
    { tags: [CACHE_TAGS.categories] }
  )();
}

/**
 * 카테고리 생성
 */
export async function insertCategory(
  data: CategoryFormValues
): Promise<Category> {
  const [created] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
    })
    .returning();

  return created;
}

/**
 * 카테고리 수정
 */
export async function updateCategory(
  id: number,
  data: CategoryFormValues
): Promise<Category> {
  const [updated] = await db
    .update(categories)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
    })
    .where(eq(categories.id, id))
    .returning();

  return updated;
}

/**
 * 카테고리 삭제
 */
export async function deleteCategory(id: number): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}
