import { cn } from '@/lib/utils';
import type { GolfStatChip as GolfStatChipData } from '../_utils/golf-counter-content';

type Props = {
  chip: GolfStatChipData;
};

const toneClass = {
  green: 'text-golf-green',
  orange: 'text-golf-orange',
  fg: 'text-golf-fg',
} as const;

export function GolfStatChip({ chip }: Props) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/6 px-4.5 py-3.5 backdrop-blur-2xl">
      <div className="text-[11px] font-bold tracking-[0.14em] text-white/45">{chip.label}</div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-[30px] leading-[1.1] font-bold tracking-[-0.04em]',
            toneClass[chip.tone],
          )}
        >
          {chip.value}
        </span>
        {chip.suffix ? (
          <span data-chip-suffix className="text-sm text-white/45">
            {chip.suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
