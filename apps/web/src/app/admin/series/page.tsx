import { selectSeriesListForAdmin } from '@/db/queries/series';
import { SeriesStackAction } from './_actions/series-stack.action';

export default async function AdminSeriesPage() {
  const seriesList = await selectSeriesListForAdmin();

  const ongoingCount = seriesList.filter(
    (series) => series.status === 'ongoing'
  ).length;

  return (
    <div>
      <SeriesStackAction
        seriesList={seriesList}
        description={`연재 ${ongoingCount}개 · 완결 ${seriesList.length - ongoingCount}개`}
      />
    </div>
  );
}
