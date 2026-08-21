'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminSeriesItem } from '@/types';
import { AdminPageHeader } from '../../_components/admin-page-header';
import { SeriesStackItem } from '../_components/series-stack-item';
import { SeriesFormDialogAction } from './series-form-dialog.action';

type Props = {
  seriesList: AdminSeriesItem[];
  description?: string;
};

export function SeriesStackAction({ seriesList, description }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(
    seriesList[0]?.id ?? null
  );

  return (
    <>
      <AdminPageHeader
        title="시리즈"
        description={description}
        action={
          <Button className="rounded-full" onClick={() => setFormOpen(true)}>
            <Plus size={16} />새 시리즈
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        {seriesList.map((series) => (
          <SeriesStackItem
            key={series.id}
            series={series}
            isExpanded={expandedId === series.id}
            onToggle={() =>
              setExpandedId((current) =>
                current === series.id ? null : series.id
              )
            }
          />
        ))}

        <Button
          variant="ghost"
          onClick={() => setFormOpen(true)}
          className="text-muted-foreground h-auto justify-center gap-2 rounded-2xl border border-dashed py-3"
        >
          <Plus size={16} />
          시리즈 추가
        </Button>
      </div>

      <SeriesFormDialogAction open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
