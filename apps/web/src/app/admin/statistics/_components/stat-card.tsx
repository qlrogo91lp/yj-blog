import { PeriodChangeBadge } from './period-change-badge';

type Props = {
  label: string;
  value: number;
  change?: { current: number; previous: number };
};

export function StatCard({ label, value, change }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-2xl font-bold">{value.toLocaleString()}</span>
      {change && (
        <PeriodChangeBadge
          current={change.current}
          previous={change.previous}
        />
      )}
    </div>
  );
}
