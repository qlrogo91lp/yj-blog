import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { selectDashboardOverview } from '@/db/queries/daily-stats';
import { selectDraftQueue } from '@/db/queries/posts';
import { selectPendingComments } from '@/db/queries/comments';
import { selectPopularPosts, selectTopReferrers } from '@/db/queries/statistics';
import { getBlogSettings } from '@/db/queries/settings';
import { AdminPageHeader } from './_components/admin-page-header';
import { DashboardStatPanel } from './_components/dashboard-stat-panel';
import { DashboardRankList } from './_components/dashboard-rank-list';
import { DraftQueueWidget } from './_components/draft-queue-widget';
import { PendingCommentsWidget } from './_components/pending-comments-widget';
import { PeriodFilterAction } from './statistics/_actions/period-filter.action';

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const currentPeriod = daysParam ?? '7';
  const parsed = Number(currentPeriod);
  const days =
    currentPeriod === 'all' || !Number.isFinite(parsed) || parsed <= 0
      ? 30
      : parsed;

  const settings = await getBlogSettings();

  const [overview, popularPosts, referrers, drafts, pendingComments] =
    await Promise.all([
      selectDashboardOverview(days),
      selectPopularPosts(3),
      selectTopReferrers(3, days, settings?.referrerExcludes ?? [], settings?.siteUrl),
      selectDraftQueue(3),
      selectPendingComments(3),
    ]);

  const rangeLabel = `${format(new Date(overview.rangeStart), 'M월 d일', { locale: ko })} – ${format(
    new Date(overview.rangeEnd),
    'M월 d일',
    { locale: ko }
  )}`;

  return (
    <div>
      <AdminPageHeader
        title="대시보드"
        description={rangeLabel}
        action={
          <PeriodFilterAction basePath="/admin" current={currentPeriod} />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DashboardStatPanel
            visitors={overview.visitors}
            views={overview.views}
            externalCount={referrers.externalCount}
            previousVisitors={overview.previousVisitors}
            daily={overview.daily}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardRankList
              title="인기 글"
              moreHref="/admin/statistics"
              items={popularPosts.map((post) => ({
                id: String(post.id),
                label: post.title || '(제목 없음)',
                value: post.views,
                href: `/admin/statistics/posts/${post.id}`,
              }))}
            />
            <DashboardRankList
              title="유입경로"
              variant="percent"
              moreHref="/admin/statistics/referrers"
              items={referrers.rows.map((row) => ({
                id: row.key,
                label: row.label,
                value: row.percentage,
              }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button className="w-full rounded-full" size="lg" asChild>
            <Link href="/admin/posts/new">
              <Plus size={16} />새 글 쓰기
            </Link>
          </Button>
          <DraftQueueWidget drafts={drafts} />
          <PendingCommentsWidget comments={pendingComments} />
        </div>
      </div>
    </div>
  );
}
