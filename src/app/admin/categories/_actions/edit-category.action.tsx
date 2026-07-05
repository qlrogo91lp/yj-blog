'use client';

import { useState } from 'react';
import { PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import { CategoryFormDialogAction } from './category-form-dialog.action';

type Props = {
  category: Category;
};

export function EditCategoryAction({ category }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <PencilIcon size={16} />
        <span className="sr-only">수정</span>
      </Button>
      <CategoryFormDialogAction
        open={isOpen}
        onOpenChange={setIsOpen}
        category={category}
      />
    </>
  );
}
