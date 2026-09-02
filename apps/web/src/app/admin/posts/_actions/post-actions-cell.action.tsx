'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeletePostDialogAction } from './delete-post-dialog.action';

type Props = {
  postId: number;
  postTitle: string;
};

export function PostActionsCellAction({ postId, postTitle }: Props) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/admin/posts/${postId}/edit`}>
          <PencilIcon size={16} />
          <span className="sr-only">수정</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setIsDeleteOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>

      <DeletePostDialogAction
        postId={postId}
        postTitle={postTitle}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
}
