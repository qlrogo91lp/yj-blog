import { format, subDays } from 'date-fns';
import { and, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { dailyStats } from '@/db/schema';

export async function selectDailyStatsForRange(days: number = 30) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');

  const stats = await db
    .select({
      date: dailyStats.date,
      views: dailyStats.views,
      visitors: dailyStats.visitors,
    })
    .from(dailyStats)
    .where(and(gte(dailyStats.date, startDate), lte(dailyStats.date, today)))
    .orderBy(dailyStats.date);

  return stats;
}

export async function selectStatsSummary() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const [todayStats, yesterdayStats, totalStats] = await Promise.all([
    db
      .select({ views: dailyStats.views, visitors: dailyStats.visitors })
      .from(dailyStats)
      .where(sql`${dailyStats.date} = ${today}`),
    db
      .select({ views: dailyStats.views, visitors: dailyStats.visitors })
      .from(dailyStats)
      .where(sql`${dailyStats.date} = ${yesterday}`),
    db
      .select({
        totalViews: sql<number>`coalesce(sum(${dailyStats.views}), 0)`,
        totalVisitors: sql<number>`coalesce(sum(${dailyStats.visitors}), 0)`,
      })
      .from(dailyStats),
  ]);

  return {
    todayViews: todayStats[0]?.views ?? 0,
    yesterdayViews: yesterdayStats[0]?.views ?? 0,
    totalViews: Number(totalStats[0]?.totalViews ?? 0),
    todayVisitors: todayStats[0]?.visitors ?? 0,
    yesterdayVisitors: yesterdayStats[0]?.visitors ?? 0,
    totalVisitors: Number(totalStats[0]?.totalVisitors ?? 0),
  };
}

/**
 * 선택한 기간(최근 N일)과 그 직전 N일을 비교한다.
 * 예: days=7이면 [오늘-6, 오늘] vs [오늘-13, 오늘-7]
 */
export async function selectPeriodComparison(days: number) {
  const today = new Date();
  const currentStart = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const currentEnd = format(today, 'yyyy-MM-dd');
  const previousStart = format(subDays(today, days * 2 - 1), 'yyyy-MM-dd');
  const previousEnd = format(subDays(today, days), 'yyyy-MM-dd');

  const sumRange = (start: string, end: string) =>
    db
      .select({
        views: sql<number>`coalesce(sum(${dailyStats.views}), 0)`,
        visitors: sql<number>`coalesce(sum(${dailyStats.visitors}), 0)`,
      })
      .from(dailyStats)
      .where(and(gte(dailyStats.date, start), lte(dailyStats.date, end)));

  const [current, previous] = await Promise.all([
    sumRange(currentStart, currentEnd),
    sumRange(previousStart, previousEnd),
  ]);

  return {
    currentViews: Number(current[0]?.views ?? 0),
    previousViews: Number(previous[0]?.views ?? 0),
    currentVisitors: Number(current[0]?.visitors ?? 0),
    previousVisitors: Number(previous[0]?.visitors ?? 0),
  };
}

/**
 * 대시보드용 기간 집계 — 선택 기간과 직전 동일 길이 기간을 함께 담는다.
 * daily 배열은 차트가 두 계열을 겹쳐 그릴 수 있도록 인덱스를 맞춰 합쳐 둔다.
 */
export async function selectDashboardOverview(days: number) {
  const today = new Date();
  const rangeStart = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const rangeEnd = format(today, 'yyyy-MM-dd');
  const prevStart = format(subDays(today, days * 2 - 1), 'yyyy-MM-dd');
  const prevEnd = format(subDays(today, days), 'yyyy-MM-dd');

  const selectRange = (start: string, end: string) =>
    db
      .select({
        date: dailyStats.date,
        views: dailyStats.views,
        visitors: dailyStats.visitors,
      })
      .from(dailyStats)
      .where(and(gte(dailyStats.date, start), lte(dailyStats.date, end)))
      .orderBy(dailyStats.date);

  const [currentRows, previousRows] = await Promise.all([
    selectRange(rangeStart, rangeEnd),
    selectRange(prevStart, prevEnd),
  ]);

  // 데이터가 없는 날은 0으로 채워 두 기간의 길이를 맞춘다.
  const fill = (rows: typeof currentRows, start: string) =>
    Array.from({ length: days }, (_, i) => {
      const date = format(subDays(new Date(`${start}T00:00:00`), -i), 'yyyy-MM-dd');
      const found = rows.find((row) => row.date === date);
      return {
        date,
        views: found?.views ?? 0,
        visitors: found?.visitors ?? 0,
      };
    });

  const current = fill(currentRows, rangeStart);
  const previous = fill(previousRows, prevStart);

  return {
    rangeStart,
    rangeEnd,
    visitors: current.reduce((acc, d) => acc + d.visitors, 0),
    views: current.reduce((acc, d) => acc + d.views, 0),
    previousVisitors: previous.reduce((acc, d) => acc + d.visitors, 0),
    previousViews: previous.reduce((acc, d) => acc + d.views, 0),
    daily: current.map((d, i) => ({
      ...d,
      previousViews: previous[i]?.views ?? 0,
      previousVisitors: previous[i]?.visitors ?? 0,
    })),
  };
}
