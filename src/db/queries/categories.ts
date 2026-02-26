import { db } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { Category } from '@/types'

/**
 * 전체 카테고리 목록 (이름 알파벳 순)
 */
export async function getCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(categories.name)
}

/**
 * slug로 카테고리 단건 조회
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)

  return result[0] ?? null
}
