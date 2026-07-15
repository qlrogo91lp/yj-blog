import type { Metadata } from 'next';
import { selectSeriesList } from '@/db/queries/series';
import { SeriesCard } from './_components/series-card';

export const metadata: Metadata = {
  title: '시리즈',
  description: '연재 중인 시리즈 목록입니다.',
};

export default async function SeriesPage() {
  const seriesList = (await selectSeriesList()).filter((s) => s.postCount > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">시리즈</h1>
      {seriesList.length === 0 ? (
        <p className="text-muted-foreground">아직 연재 중인 시리즈가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {seriesList.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
}
