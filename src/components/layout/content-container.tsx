import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function ContentContainer({ className, children }: Props) {
  return (
    <div className={cn('mx-auto w-full max-w-[var(--content-width)] px-4', className)}>
      {children}
    </div>
  );
}
