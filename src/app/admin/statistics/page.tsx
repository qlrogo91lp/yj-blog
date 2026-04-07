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
  getDailyStatsForRange,
  getStatsSummary,
} from '@/db/queries/daily-stats';
import { getPopularPosts } from '@/db/queries/statistics';
import { StatCard } from './_components/stat-card';
import { StatsChart } from './_components/stats-chart';

export default async function AdminStatisticsPage() {
  const [summary, dailyStats, popularPosts] = await Promise.all([
    getStatsSummary(),
    getDailyStatsForRange(30),
    getPopularPosts(10),
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

      {/* 추이 그래프 */}
      <Card className="mb-6">
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

      {/* 인기 글 Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">인기 글 Top 10</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {popularPosts.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted-foreground">
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
