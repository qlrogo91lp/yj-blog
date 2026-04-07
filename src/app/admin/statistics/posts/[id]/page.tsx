import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPostById } from '@/db/queries/posts';
import { getPostDailyViews, getReferrersByPost } from '@/db/queries/statistics';
import { PostDailyChart } from './_components/post-daily-chart';

type Props = {
  params: Promise<{ id: string }>;
};

function formatReferrer(referrer: string) {
  if (!referrer) return '직접 접근';
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer;
  }
}

export default async function PostStatsPage({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  const [dailyViews, referrerList] = await Promise.all([
    getPostDailyViews(postId, 30),
    getReferrersByPost(postId),
  ]);

  return (
    <div>
      <Link
        href="/admin/statistics"
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={16} />
        통계로 돌아가기
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          누적 조회수: {post.views.toLocaleString()}회
        </p>
      </div>

      {/* 일별 조회수 추이 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">최근 30일 조회수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyViews.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              기록된 조회 데이터가 없습니다.
            </p>
          ) : (
            <PostDailyChart data={dailyViews} />
          )}
        </CardContent>
      </Card>

      {/* 유입 경로 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">유입 경로</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {referrerList.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted-foreground">
              기록된 유입 경로가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유입 경로</TableHead>
                  <TableHead className="w-24 text-right">방문 수</TableHead>
                  <TableHead className="w-24 text-right">비율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrerList.map((r) => (
                  <TableRow key={r.referrer}>
                    <TableCell className="font-medium">
                      {formatReferrer(r.referrer)}
                    </TableCell>
                    <TableCell className="text-right">{r.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {r.percentage}%
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
