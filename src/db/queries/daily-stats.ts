import { format, subDays } from 'date-fns';
import { and, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { dailyStats } from '@/db/schema';

export async function getDailyStatsForRange(days: number = 30) {
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

export async function getStatsSummary() {
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
