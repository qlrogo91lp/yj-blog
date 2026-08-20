import { Eye, FileText, MessageSquare, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats, getRecentPostsForAdmin } from '@/db/queries/posts';
import { getRecentComments } from '@/db/queries/comments';
import { selectDailyStatsForRange } from '@/db/queries/daily-stats';
import { AdminPageHeader } from './_components/admin-page-header';
import { RecentPostsWidget } from './_components/recent-posts-widget';
import { RecentCommentsWidget } from './_components/recent-comments-widget';
import { QuickActions } from './_components/quick-actions';
import { StatsChart } from './_components/stats-chart';

export default async function AdminDashboardPage() {
  const [stats, recentPosts, recentComments, dailyStats] = await Promise.all([
    getAdminDashboardStats(),
    getRecentPostsForAdmin(5),
    getRecentComments(5),
    selectDailyStatsForRange(30),
  ]);

  const cards = [
    { title: '전체 글', value: stats.totalPosts, icon: FileText },
    { title: '발행됨', value: stats.publishedPosts, icon: Eye },
    { title: '임시저장', value: stats.draftPosts, icon: PenLine },
    { title: '댓글', value: stats.totalComments, icon: MessageSquare },
  ];

  return (
    <>
      <AdminPageHeader title="대시보드" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">최근 30일 방문 추이</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {dailyStats.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center">
              아직 통계 데이터가 없습니다.
            </p>
          ) : (
            <StatsChart data={dailyStats} />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <QuickActions />
        <RecentPostsWidget posts={recentPosts} />
        <RecentCommentsWidget comments={recentComments} />
      </div>
    </>
  );
}
