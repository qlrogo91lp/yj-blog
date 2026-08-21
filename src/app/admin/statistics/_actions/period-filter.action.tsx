'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { label: '7일', value: '7' },
  { label: '30일', value: '30' },
  { label: '전체', value: 'all' },
];

type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value'];

type Props = {
  basePath: string;
  current: string;
  /** 렌더할 옵션의 value 목록. 지정하지 않으면 전체 목록을 렌더한다. */
  options?: PeriodValue[];
};

export function PeriodFilterAction({ basePath, current, options }: Props) {
  const visibleOptions = options
    ? PERIOD_OPTIONS.filter((option) => options.includes(option.value))
    : PERIOD_OPTIONS;

  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      {visibleOptions.map((option) => (
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
