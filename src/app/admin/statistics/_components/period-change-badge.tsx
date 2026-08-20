import { cn } from '@/lib/utils';

type Props = {
  current: number;
  previous: number;
};

export function PeriodChangeBadge({ current, previous }: Props) {
  if (previous === 0) {
    if (current === 0) return null;
    return (
      <span className="text-status-published text-xs font-medium">신규</span>
    );
  }

  const changePercent = Math.round(((current - previous) / previous) * 1000) / 10;

  if (changePercent === 0) {
    return <span className="text-muted-foreground text-xs">변동 없음</span>;
  }

  const isUp = changePercent > 0;

  return (
    <span
      className={cn(
        'text-xs font-medium',
        isUp ? 'text-status-published' : 'text-status-danger'
      )}
    >
      {isUp ? '+' : ''}
      {changePercent}%
    </span>
  );
}
