import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { selectTopReferrers } from '@/db/queries/statistics';
import { getBlogSettings } from '@/db/queries/settings';
import { AdminPageHeader } from '../../_components/admin-page-header';
import { AnalyticsLinkButton } from '../_components/analytics-link-button';
import { PeriodFilterAction } from '../_actions/period-filter.action';
import { ReferrerExcludesFormAction } from './_actions/referrer-excludes-form.action';
import { DevTrafficNoticeAction } from './_actions/dev-traffic-notice.action';
import { ReferrerRow } from './_components/referrer-row';

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminReferrersPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const parsed = Number(daysParam);
  const days =
    daysParam === 'all' || !daysParam || !Number.isFinite(parsed) || parsed <= 0
      ? undefined
      : parsed;
  const currentPeriod = daysParam ?? '30';

  const settings = await getBlogSettings();
  const result = await selectTopReferrers(
    20,
    days,
    settings?.referrerExcludes ?? [],
    settings?.siteUrl
  );

  const periodLabel = days ? `${days}일` : '전체 기간';

  return (
    <div>
      <AdminPageHeader
        title="유입경로"
        description={`${periodLabel} · 방문 ${result.totalCount.toLocaleString()}회 중 외부 유입 ${result.externalCount.toLocaleString()}회`}
        action={
          <div className="flex items-center gap-2">
            <AnalyticsLinkButton />
            <PeriodFilterAction
              basePath="/admin/statistics/referrers"
              current={currentPeriod}
            />
          </div>
        }
      />

      <DevTrafficNoticeAction count={result.devTrafficCount} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">항상 제외</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferrerExcludesFormAction
            excludes={settings?.referrerExcludes ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {result.rows.length === 0 ? (
            <p className="text-muted-foreground px-6 py-10 text-center">
              기록된 유입 경로가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>유입 경로</TableHead>
                  <TableHead className="w-24 text-right">방문</TableHead>
                  <TableHead className="w-24 text-right">비율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row, index) => (
                  <ReferrerRow key={row.key} row={row} rank={index + 1} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
