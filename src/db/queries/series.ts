import { db } from '@/db'
import { series } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { Series } from '@/types'

/**
 * 전체 시리즈 목록 (생성일 순)
 */
export async function getAllSeries(): Promise<Series[]> {
  return db.select().from(series).orderBy(series.createdAt)
}

/**
 * slug로 시리즈 단건 조회
 */
export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const result = await db
    .select()
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1)

  return result[0] ?? null
}
