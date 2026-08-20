export const revalidate = 60;

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  selectDailyStatsForRange,
  selectPeriodComparison,
  selectStatsSummary,
} from '@/db/queries/daily-stats';
import { selectPopularPosts } from '@/db/queries/statistics';
import { AnalyticsLinkButton } from './_components/analytics-link-button';
import { PeriodFilterAction } from './_actions/period-filter.action';
import { StatCard } from './_components/stat-card';
import { StatsChart } from '../_components/stats-chart';

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminStatisticsPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const currentPeriod = daysParam ?? '30';
  const parsed = Number(currentPeriod);
  const days = currentPeriod === 'all' || !Number.isFinite(parsed) || parsed <= 0 ? undefined : parsed;
  const chartDays = days ?? 30; // "전체" 선택 시에도 그래프는 최근 30일 고정

  const [summary, dailyStats, popularPosts, comparison] = await Promise.all([
    selectStatsSummary(),
    selectDailyStatsForRange(chartDays),
    selectPopularPosts(10),
    days ? selectPeriodComparison(days) : Promise.resolve(null),
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">방문 통계</h1>
        <div className="flex items-center gap-2">
          <AnalyticsLinkButton />
          <PeriodFilterAction
            basePath="/admin/statistics"
            current={currentPeriod}
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap p-0">
          {viewCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
          <div className="mx-2" />
          {visitorCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </CardContent>
      </Card>

      {/* 선택한 기간 대비 직전 기간 */}
      {comparison && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap p-0">
            <StatCard
              label={`최근 ${days}일 조회수`}
              value={comparison.currentViews}
              change={{
                current: comparison.currentViews,
                previous: comparison.previousViews,
              }}
            />
            <StatCard
              label={`최근 ${days}일 방문자`}
              value={comparison.currentVisitors}
              change={{
                current: comparison.currentVisitors,
                previous: comparison.previousVisitors,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* 추이 그래프 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {dailyStats.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center">
              아직 통계 데이터가 없습니다. 블로그에 방문이 기록되면 그래프가
              표시됩니다.
            </p>
          ) : (
            <StatsChart data={dailyStats} />
          )}
        </CardContent>
      </Card>

      {/* 인기 글 Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">인기 글 Top 10</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {popularPosts.length === 0 ? (
            <p className="text-muted-foreground px-6 py-10 text-center">
              조회된 글이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-24 text-right">조회수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularPosts.map((post, index) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/statistics/posts/${post.id}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {post.views.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
