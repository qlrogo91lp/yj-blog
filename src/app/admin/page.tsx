import { Eye, FileText, MessageSquare, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats } from '@/db/queries/posts';

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const cards = [
    { title: '전체 글', value: stats.totalPosts, icon: FileText },
    { title: '발행됨', value: stats.publishedPosts, icon: Eye },
    { title: '임시저장', value: stats.draftPosts, icon: PenLine },
    { title: '댓글', value: stats.totalComments, icon: MessageSquare },
  ];

  return (
    <div>
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
    </div>
  );
}
