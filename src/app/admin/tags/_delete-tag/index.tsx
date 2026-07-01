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
import type { TagRow } from '../_components/columns';
import { removeTag } from '../_services/remove-tag';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: TagRow;
};

export function DeleteTagDialog({ open, onOpenChange, tag }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await removeTag(tag.id);

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
          <DialogTitle>태그 삭제</DialogTitle>
          <DialogDescription>
            &ldquo;{tag.name}&rdquo; 태그를 삭제하시겠습니까?
            {tag.postCount > 0 && (
              <> 이 태그가 연결된 {tag.postCount}개의 글에서 태그가 제거됩니다.</>
            )}
            {' '}이 작업은 되돌릴 수 없습니다.
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
