import { subDays } from 'date-fns';
import { and, count, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { posts, referrers } from '@/db/schema';

/**
 * 조회수 상위 글 목록
 */
export async function selectPopularPosts(limit = 10) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      views: posts.views,
    })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.views))
    .limit(limit);
}

function extractHostname(referrer: string): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer;
  }
}

/**
 * 상위 referrer 도메인 집계 (기간 필터 가능, "항상 제외" 규칙 적용)
 * days: undefined이면 전체 기간
 */
export async function selectTopReferrers(
  limit = 20,
  days?: number,
  excludes: string[] = []
) {
  const since = days ? subDays(new Date(), days) : undefined;
  const where = and(since ? gte(referrers.visitedAt, since) : undefined);

  const rows = await db
    .select({ referrer: referrers.referrer })
    .from(referrers)
    .where(where);

  const excludeSet = new Set(excludes);
  const counts = new Map<string, number>();

  for (const row of rows) {
    const referrer = row.referrer ?? '';
    if (excludeSet.has(extractHostname(referrer))) continue;
    counts.set(referrer, (counts.get(referrer) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const total = sorted.reduce((acc, [, c]) => acc + c, 0);

  return sorted.map(([referrer, c]) => ({
    referrer,
    count: c,
    percentage: total > 0 ? Math.round((c / total) * 1000) / 10 : 0,
  }));
}

/**
 * 특정 글의 referrer 집계
 */
export async function selectReferrersByPost(postId: number, limit = 20) {
  const rows = await db
    .select({
      referrer: referrers.referrer,
      count: count(),
    })
    .from(referrers)
    .where(and(isNotNull(referrers.postId), eq(referrers.postId, postId)))
    .groupBy(referrers.referrer)
    .orderBy(desc(count()))
    .limit(limit);

  const total = rows.reduce((acc, r) => acc + r.count, 0);

  return rows.map((r) => ({
    referrer: r.referrer ?? '',
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
  }));
}

/**
 * 특정 글의 일별 조회수 추이 (referrers 테이블 기반)
 */
export async function selectPostDailyViews(postId: number, days = 30) {
  const since = subDays(new Date(), days);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${referrers.visitedAt})::date`,
      count: count(),
    })
    .from(referrers)
    .where(
      and(
        isNotNull(referrers.postId),
        eq(referrers.postId, postId),
        gte(referrers.visitedAt, since),
      ),
    )
    .groupBy(sql`date_trunc('day', ${referrers.visitedAt})::date`)
    .orderBy(sql`date_trunc('day', ${referrers.visitedAt})::date`);

  return rows.map((r) => ({ date: r.date, views: r.count }));
}
