'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import type { SeriesWithMeta } from '@/types';
import { seriesColumns } from '../_components/columns';
import { SeriesFormDialogAction } from './series-form-dialog.action';

type Props = {
  seriesList: SeriesWithMeta[];
};

export function SeriesTableAction({ seriesList }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">시리즈 관리</h1>
        <Button onClick={() => setFormOpen(true)}>새 시리즈</Button>
      </div>

      <DataTable
        columns={seriesColumns}
        data={seriesList}
        emptyMessage="시리즈가 없습니다."
      />

      <SeriesFormDialogAction open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
