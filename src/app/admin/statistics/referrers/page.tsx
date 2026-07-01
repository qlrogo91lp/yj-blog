import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { selectTopReferrers } from '@/db/queries/statistics';
import { AnalyticsLinkButton } from '../_components/analytics-link-button';
import { ReferrerPeriodFilter } from './_components/referrer-period-filter';

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ days?: string }>;
};

function formatReferrer(referrer: string) {
  if (!referrer) return '직접 접근 (Direct)';
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer;
  }
}

const PERIOD_OPTIONS = [
  { label: '7일', value: '7' },
  { label: '30일', value: '30' },
  { label: '전체', value: 'all' },
];

export default async function AdminReferrersPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const days = daysParam === 'all' || !daysParam ? undefined : Number(daysParam);
  const currentPeriod = daysParam ?? '30';

  const referrerList = await selectTopReferrers(20, days);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">유입 경로</h1>
        <div className="flex items-center gap-2">
          <AnalyticsLinkButton />
          <ReferrerPeriodFilter options={PERIOD_OPTIONS} current={currentPeriod} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            상위 유입 경로 (최대 20개)
          </CardTitle>
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
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>유입 경로</TableHead>
                  <TableHead className="w-24 text-right">방문 수</TableHead>
                  <TableHead className="w-24 text-right">비율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrerList.map((r, index) => (
                  <TableRow key={r.referrer}>
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
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
