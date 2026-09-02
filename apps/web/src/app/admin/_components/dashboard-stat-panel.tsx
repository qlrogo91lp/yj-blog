import { PeriodChangeBadge } from '../statistics/_components/period-change-badge';
import { StatsChart } from './stats-chart';

type Props = {
  visitors: number;
  views: number;
  externalCount: number;
  previousVisitors: number;
  daily: {
    date: string;
    views: number;
    visitors: number;
    previousViews: number;
    previousVisitors: number;
  }[];
};

export function DashboardStatPanel({
  visitors,
  views,
  externalCount,
  previousVisitors,
  daily,
}: Props) {
  const metrics = [
    {
      label: '방문',
      value: visitors,
      change: { current: visitors, previous: previousVisitors },
    },
    { label: '페이지뷰', value: views },
    { label: '외부 유입', value: externalCount },
  ];

  return (
    <div className="bg-sidebar text-sidebar-foreground rounded-2xl p-6">
      <div className="flex flex-wrap gap-8">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-sidebar-foreground/60 text-xs">{metric.label}</p>
            <p className="mt-1 flex items-baseline gap-2 text-3xl font-bold">
              {metric.value.toLocaleString()}
              {metric.change && (
                <PeriodChangeBadge
                  current={metric.change.current}
                  previous={metric.change.previous}
                />
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {daily.length === 0 ? (
          <p className="text-sidebar-foreground/60 py-16 text-center text-sm">
            아직 통계 데이터가 없습니다.
          </p>
        ) : (
          <StatsChart data={daily} showPrevious tone="dark" />
        )}
      </div>
    </div>
  );
}
