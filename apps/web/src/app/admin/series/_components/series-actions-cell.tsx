import type { Series } from '@/types';
import { DeleteSeriesAction } from '../_actions/delete-series.action';
import { EditSeriesAction } from '../_actions/edit-series.action';

type Props = {
  series: Series;
};

export function SeriesActionsCell({ series }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <EditSeriesAction series={series} />
      <DeleteSeriesAction series={series} />
    </div>
  );
}
