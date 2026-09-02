import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

export function RalliSectionLabel({ children, className }: Props) {
  return (
    <p
      className={cn(
        'mb-3.5 text-[11px] font-bold tracking-[0.22em] text-ralli-lime',
        className
      )}
    >
      {children}
    </p>
  );
}
