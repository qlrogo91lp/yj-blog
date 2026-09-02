'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SeriesWithMeta } from '@/types';
import { useNewPostStore } from '../_store';

type Props = {
  seriesList: SeriesWithMeta[];
};

export function SeriesSelectorAction({ seriesList }: Props) {
  const seriesId = useNewPostStore((s) => s.seriesId);
  const setSeriesId = useNewPostStore((s) => s.setSeriesId);

  return (
    <div className="mb-3">
      <Select
        value={seriesId?.toString() ?? 'none'}
        onValueChange={(value) =>
          setSeriesId(value === 'none' ? null : Number(value))
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="시리즈 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">시리즈 없음</SelectItem>
          {seriesList.map((s) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
