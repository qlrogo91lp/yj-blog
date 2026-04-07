import { Eye, FileText, MessageSquare, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats, getRecentPostsForAdmin } from '@/db/queries/posts';
import { getRecentComments } from '@/db/queries/comments';
import { RecentPostsWidget } from './_components/recent-posts-widget';
import { RecentCommentsWidget } from './_components/recent-comments-widget';
import { QuickActions } from './_components/quick-actions';

export default async function AdminDashboardPage() {
  const [stats, recentPosts, recentComments] = await Promise.all([
    getAdminDashboardStats(),
    getRecentPostsForAdmin(5),
    getRecentComments(5),
  ]);

  const cards = [
    { title: '전체 글', value: stats.totalPosts, icon: FileText },
    { title: '발행됨', value: stats.publishedPosts, icon: Eye },
    { title: '임시저장', value: stats.draftPosts, icon: PenLine },
    { title: '댓글', value: stats.totalComments, icon: MessageSquare },
  ];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <QuickActions />
        <RecentPostsWidget posts={recentPosts} />
        <RecentCommentsWidget comments={recentComments} />
      </div>
    </>
  );
}
