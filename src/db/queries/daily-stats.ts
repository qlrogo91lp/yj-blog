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
