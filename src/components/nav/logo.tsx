import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export function LogoMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 543 657"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.4044 103.583C48.6917 81.6407 88.2757 84.7563 110.354 110.93L271.034 301.419L431.711 110.935C453.789 84.7618 493.373 81.6456 519.66 103.588C545.948 125.53 549.737 164.85 527.659 191.023L337 417.053V556.96C337 612.188 292.229 656.96 237 656.96H198V408.671L14.4064 191.018C-7.67141 164.845 -3.88276 125.525 22.4044 103.583Z" />
      <circle cx="270" cy="70" r="70" transform="rotate(-90 270 70)" />
    </svg>
  );
}

export function Logo({ className }: Props) {
  return (
    <span
      aria-label="YJlogs 로고"
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
        className
      )}
    >
      <LogoMark className="size-4" />
    </span>
  );
}
