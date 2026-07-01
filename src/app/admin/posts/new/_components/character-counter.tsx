import { cn } from '@/lib/utils';

type Props = {
  value: string;
  recommendedMax: number;
  hardMax?: number;
};

export function CharacterCounter({ value, recommendedMax, hardMax }: Props) {
  const length = value.length;
  const overHard = hardMax !== undefined && length > hardMax;
  const overRecommended = !overHard && length > recommendedMax;

  return (
    <span
      className={cn(
        'text-xs',
        !overRecommended && !overHard && 'text-muted-foreground',
        overRecommended && 'text-yellow-600',
        overHard && 'text-destructive',
      )}
    >
      {length} / {recommendedMax}
    </span>
  );
}
