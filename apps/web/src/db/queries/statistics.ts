import { subDays } from 'date-fns';
import { and, count, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import {
  extractHostname,
  isDevTraffic,
  resolveReferrerGroup,
} from '@/app/admin/_utils/referrer-group';
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

export type ReferrerGroupRow = {
  key: string;
  label: string;
  letter: string;
  hosts: string[];
  count: number;
  percentage: number;
};

export type TopReferrersResult = {
  rows: ReferrerGroupRow[];
  devTrafficCount: number;
  externalCount: number;
  totalCount: number;
};

/**
 * 유입 경로를 호스트네임 그룹으로 묶어 집계한다.
 *
 * - `excludes`(사용자가 등록한 "항상 제외")에 걸린 호스트는 집계에서 완전히 뺀다.
 * - 개발 트래픽(localhost·사설 IP 등)은 rows에 넣지 않고 devTrafficCount로만 센다.
 * - 하위 호스트가 여럿인 서비스(네이버 등)는 한 행으로 합치고 hosts에 나열한다.
 */
export async function selectTopReferrers(
  limit = 20,
  days?: number,
  excludes: string[] = [],
  siteUrl?: string | null
): Promise<TopReferrersResult> {
  const since = days ? subDays(new Date(), days) : undefined;
  const where = and(since ? gte(referrers.visitedAt, since) : undefined);

  const rows = await db
    .select({ referrer: referrers.referrer })
    .from(referrers)
    .where(where);

  const excludeSet = new Set(excludes);
  const siteHostname = siteUrl ? extractHostname(siteUrl) : undefined;

  const groups = new Map<string, ReferrerGroupRow>();
  let devTrafficCount = 0;
  let totalCount = 0;

  for (const row of rows) {
    const hostname = extractHostname(row.referrer ?? '');

    if (hostname && excludeSet.has(hostname)) continue;

    totalCount += 1;

    if (isDevTraffic(hostname)) {
      devTrafficCount += 1;
      continue;
    }

    const group = resolveReferrerGroup(hostname, siteHostname ?? undefined);
    const existing = groups.get(group.key);

    if (existing) {
      existing.count += 1;
      if (hostname && !existing.hosts.includes(hostname)) {
        existing.hosts.push(hostname);
      }
    } else {
      groups.set(group.key, {
        ...group,
        hosts: hostname ? [hostname] : [],
        count: 1,
        percentage: 0,
      });
    }
  }

  // percentage는 externalCount와 동일하게 슬라이스 이전(pre-slice) 전체 모수를
  // 분모로 삼는다 — limit 20 등으로 상위 몇 행만 보여주더라도 비율이 그 행들만의
  // 합이 아니라 전체(devTrafficCount 제외) 대비 값이 되도록 하기 위함이다.
  // 그래야 대시보드(limit=3)와 유입경로 페이지(limit=20)가 같은 기간에 대해
  // 같은 비율을 보여준다. 그 대가로 그룹이 21개를 넘으면 유입경로 페이지의
  // 비율 합이 100%를 밑돌 수 있는데, 이는 의도된 정직한 결과다.
  const population = [...groups.values()].reduce(
    (acc, row) => acc + row.count,
    0
  );

  const sorted = [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  for (const row of sorted) {
    row.percentage =
      population > 0 ? Math.round((row.count / population) * 1000) / 10 : 0;
    row.hosts.sort();
  }

  const externalCount = [...groups.values()]
    .filter((row) => row.key !== 'direct' && row.label !== '내부 링크')
    .reduce((acc, row) => acc + row.count, 0);

  return { rows: sorted, devTrafficCount, externalCount, totalCount };
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
        gte(referrers.visitedAt, since)
      )
    )
    .groupBy(sql`date_trunc('day', ${referrers.visitedAt})::date`)
    .orderBy(sql`date_trunc('day', ${referrers.visitedAt})::date`);

  return rows.map((r) => ({ date: r.date, views: r.count }));
}
