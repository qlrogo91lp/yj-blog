import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function ContentContainer({ className, children }: Props) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[calc(var(--content-width)+2rem)] px-4',
        className
      )}
    >
      {children}
    </div>
  );
}
