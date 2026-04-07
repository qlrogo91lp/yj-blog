import { subDays } from 'date-fns';
import { and, count, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { posts, referrers } from '@/db/schema';

/**
 * 조회수 상위 글 목록
 */
export async function getPopularPosts(limit = 10) {
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

/**
 * 상위 referrer 도메인 집계 (기간 필터 가능)
 * days: undefined이면 전체 기간
 */
export async function getTopReferrers(limit = 20, days?: number) {
  const since = days ? subDays(new Date(), days) : undefined;

  const where = and(
    since ? gte(referrers.visitedAt, since) : undefined,
  );

  const rows = await db
    .select({
      referrer: referrers.referrer,
      count: count(),
    })
    .from(referrers)
    .where(where)
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
 * 특정 글의 referrer 집계
 */
export async function getReferrersByPost(postId: number, limit = 20) {
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
export async function getPostDailyViews(postId: number, days = 30) {
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
