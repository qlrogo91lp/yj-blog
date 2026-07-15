import { unstable_cache } from 'next/cache';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { posts, series } from '@/db/schema';
import type {
  Series,
  SeriesDetail,
  SeriesFormValues,
  SeriesNav,
  SeriesWithMeta,
} from '@/types';

/**
 * 전체 시리즈 목록 + published 글 집계 (최신 생성 순)
 * - postCount: published 글 수 (독자 페이지는 0개 시리즈를 숨기고, 관리자는 그대로 노출)
 * - thumbnailUrl: 시리즈 내 썸네일이 있는 첫 글의 썸네일
 * - lastPublishedAt: 가장 최근 발행일
 */
export const selectSeriesList = unstable_cache(
  async (): Promise<SeriesWithMeta[]> => {
    const [seriesRows, postRows] = await Promise.all([
      db.select().from(series).orderBy(desc(series.createdAt)),
      db
        .select({
          seriesId: posts.seriesId,
          thumbnailUrl: posts.thumbnailUrl,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(and(eq(posts.status, 'published'), isNotNull(posts.seriesId)))
        .orderBy(asc(posts.publishedAt)),
    ]);

    return seriesRows.map((s) => {
      const seriesPosts = postRows.filter((p) => p.seriesId === s.id);
      return {
        ...s,
        postCount: seriesPosts.length,
        thumbnailUrl:
          seriesPosts.find((p) => p.thumbnailUrl)?.thumbnailUrl ?? null,
        lastPublishedAt: seriesPosts.at(-1)?.publishedAt ?? null,
      };
    });
  },
  ['series-list'],
  { tags: [CACHE_TAGS.series, CACHE_TAGS.posts] }
);

/**
 * slug로 시리즈 상세 조회 (published 글 목록 포함, publishedAt ASC)
 */
export const selectSeriesBySlug = unstable_cache(
  async (slug: string): Promise<SeriesDetail | null> => {
    const found = await db
      .select()
      .from(series)
      .where(eq(series.slug, slug))
      .limit(1);

    if (!found[0]) return null;

    const postRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        thumbnailUrl: posts.thumbnailUrl,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(and(eq(posts.seriesId, found[0].id), eq(posts.status, 'published')))
      .orderBy(asc(posts.publishedAt));

    return { ...found[0], posts: postRows };
  },
  ['series-by-slug'],
  { tags: [CACHE_TAGS.series, CACHE_TAGS.posts] }
);

/**
 * 글 상세의 시리즈 박스용 — 시리즈 이름/slug + published 글 목록 (publishedAt ASC)
 */
export const selectSeriesPosts = unstable_cache(
  async (seriesId: number): Promise<SeriesNav | null> => {
    const found = await db
      .select({ name: series.name, slug: series.slug })
      .from(series)
      .where(eq(series.id, seriesId))
      .limit(1);

    if (!found[0]) return null;

    const postRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(and(eq(posts.seriesId, seriesId), eq(posts.status, 'published')))
      .orderBy(asc(posts.publishedAt));

    return { name: found[0].name, slug: found[0].slug, posts: postRows };
  },
  ['series-posts'],
  { tags: [CACHE_TAGS.series, CACHE_TAGS.posts] }
);

/**
 * 시리즈 생성
 */
export async function insertSeries(data: SeriesFormValues): Promise<Series> {
  const [created] = await db
    .insert(series)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description?.trim() ? data.description : null,
    })
    .returning();

  return created;
}

/**
 * 시리즈 수정
 */
export async function updateSeries(
  id: number,
  data: SeriesFormValues
): Promise<Series> {
  const [updated] = await db
    .update(series)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description?.trim() ? data.description : null,
    })
    .where(eq(series.id, id))
    .returning();

  return updated;
}

/**
 * 시리즈 삭제 — posts.seriesId는 FK onDelete: 'set null'로 자동 해제
 */
export async function deleteSeries(id: number): Promise<void> {
  await db.delete(series).where(eq(series.id, id));
}
