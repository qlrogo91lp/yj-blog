'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { label: '7일', value: '7' },
  { label: '30일', value: '30' },
  { label: '전체', value: 'all' },
];

type Props = {
  basePath: string;
  current: string;
};

export function PeriodFilterAction({ basePath, current }: Props) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      {PERIOD_OPTIONS.map((option) => (
        <Link
          key={option.value}
          href={`${basePath}?days=${option.value}`}
          className={cn(
            'rounded-full px-3 py-1 text-sm transition-colors',
            current === option.value
              ? 'bg-background text-foreground font-medium shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
