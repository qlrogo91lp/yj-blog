'use client';

import { useState } from 'react';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SeriesWithMeta } from '@/types';
import { DeleteSeriesDialogAction } from './delete-series-dialog.action';

type Props = {
  series: SeriesWithMeta;
};

export function DeleteSeriesAction({ series }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>
      <DeleteSeriesDialogAction
        open={isOpen}
        onOpenChange={setIsOpen}
        series={series}
      />
    </>
  );
}
