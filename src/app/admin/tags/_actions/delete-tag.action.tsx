'use client';

import { useState } from 'react';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TagRow } from '../_components/columns';
import { DeleteTagDialog } from '../_delete-tag';

type Props = {
  tag: TagRow;
};

export function DeleteTagAction({ tag }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>
      <DeleteTagDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        tag={tag}
      />
    </>
  );
}
