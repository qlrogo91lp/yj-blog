import { selectSeriesList } from '@/db/queries/series';
import { SeriesTableAction } from './_actions/series-table.action';

export default async function AdminSeriesPage() {
  const seriesList = await selectSeriesList();

  return <SeriesTableAction seriesList={seriesList} />;
}
