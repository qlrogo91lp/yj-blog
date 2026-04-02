'use client';

import { useState } from 'react';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import { DeleteCategoryDialog } from '../_delete-category';

type Props = {
  category: Category;
};

export function DeleteCategoryAction({ category }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>
      <DeleteCategoryDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        category={category}
      />
    </>
  );
}
