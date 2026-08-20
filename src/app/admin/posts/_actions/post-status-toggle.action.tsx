'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { editPostStatus } from '../_services/edit-post-status';

type Props = {
  postId: number;
  status: 'draft' | 'published';
};

export function PostStatusToggleAction({ postId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const isPublished = status === 'published';

  const handleChange = (checked: boolean) => {
    startTransition(async () => {
      const result = await editPostStatus(
        postId,
        checked ? 'published' : 'draft'
      );

      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <Switch
        checked={isPublished}
        disabled={isPending}
        onCheckedChange={handleChange}
        aria-label={`${isPublished ? '비공개로 전환' : '발행'}`}
        className="data-[state=checked]:bg-status-published"
      />
      <span className="text-muted-foreground text-xs">
        {isPublished ? '발행 중' : '비공개'}
      </span>
    </div>
  );
}
