import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function ArticleContainer({ className, children }: Props) {
  return (
    <div className={cn('mx-auto w-full max-w-[calc(var(--article-width)+2rem)] px-4', className)}>
      {children}
    </div>
  );
}
