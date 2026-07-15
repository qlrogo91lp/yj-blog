'use client';

import { useState } from 'react';
import { PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SeriesWithMeta } from '@/types';
import { SeriesFormDialogAction } from './series-form-dialog.action';

type Props = {
  series: SeriesWithMeta;
};

export function EditSeriesAction({ series }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <PencilIcon size={16} />
        <span className="sr-only">수정</span>
      </Button>
      <SeriesFormDialogAction
        open={isOpen}
        onOpenChange={setIsOpen}
        series={series}
      />
    </>
  );
}
