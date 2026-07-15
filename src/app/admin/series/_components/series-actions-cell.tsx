import type { SeriesWithMeta } from '@/types';
import { EditSeriesAction } from '../_actions/edit-series.action';
import { DeleteSeriesAction } from '../_actions/delete-series.action';

type Props = {
  series: SeriesWithMeta;
};

export function SeriesActionsCell({ series }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <EditSeriesAction series={series} />
      <DeleteSeriesAction series={series} />
    </div>
  );
}
