import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { categories } from '@/db/schema';
import type { Category } from '@/types';
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
 * slug로 카테고리 단건 조회
 */
export async function getCategoryBySlug(
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
 * 카테고리 생성
 */
export async function createCategory(
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
