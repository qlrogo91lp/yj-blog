'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SeriesWithMeta } from '@/types';
import { removeSeries } from '../_services/remove-series';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: SeriesWithMeta;
};

export function DeleteSeriesDialogAction({ open, onOpenChange, series }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await removeSeries(series.id);

    setIsDeleting(false);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>시리즈 삭제</DialogTitle>
          <DialogDescription>
            &ldquo;{series.name}&rdquo; 시리즈를 삭제하시겠습니까?
            {series.postCount > 0 &&
              ` 글 ${series.postCount}개의 시리즈 지정이 해제됩니다 (글은 삭제되지 않습니다).`}{' '}
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
