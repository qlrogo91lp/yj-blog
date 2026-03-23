export const revalidate = 60;

import { Card, CardContent } from '@/components/ui/card';
import {
  getDailyStatsForRange,
  getStatsSummary,
} from '@/db/queries/daily-stats';
import { StatCard } from './_components/stat-card';
import { StatsChart } from './_components/stats-chart';

export default async function AdminStatisticsPage() {
  const [summary, dailyStats] = await Promise.all([
    getStatsSummary(),
    getDailyStatsForRange(30),
  ]);

  const viewCards = [
    { label: '오늘 조회수', value: summary.todayViews },
    { label: '어제 조회수', value: summary.yesterdayViews },
    { label: '누적 조회수', value: summary.totalViews },
  ];

  const visitorCards = [
    { label: '오늘 방문자', value: summary.todayVisitors },
    { label: '어제 방문자', value: summary.yesterdayVisitors },
    { label: '누적 방문자', value: summary.totalVisitors },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">방문 통계</h1>

      {/* 통계 카드 */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap divide-x p-0">
          {viewCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
          <div className="mx-2" />
          {visitorCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </CardContent>
      </Card>

      {/* 추이 그래프 */}
      <Card>
        <CardContent className="pt-6">
          {dailyStats.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">
              아직 통계 데이터가 없습니다. 블로그에 방문이 기록되면 그래프가
              표시됩니다.
            </p>
          ) : (
            <StatsChart data={dailyStats} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
