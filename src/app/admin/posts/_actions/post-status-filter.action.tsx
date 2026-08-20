'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const options = [
  { label: '전체', value: 'all' },
  { label: '발행', value: 'published' },
  { label: '임시', value: 'draft' },
];

type Props = {
  current: string;
};

export function PostStatusFilterAction({ current }: Props) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      {options.map((option) => (
        <Link
          key={option.value}
          href={
            option.value === 'all'
              ? '/admin/posts'
              : `/admin/posts?status=${option.value}`
          }
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
