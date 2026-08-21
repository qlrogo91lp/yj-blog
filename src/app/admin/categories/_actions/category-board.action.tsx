'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CategoryWithCount } from '@/types';
import { AdminPageHeader } from '../../_components/admin-page-header';
import { CategoryCard } from '../_components/category-card';
import { CategoryFormDialogAction } from './category-form-dialog.action';

type Props = {
  categories: CategoryWithCount[];
  description?: string;
};

export function CategoryBoardAction({ categories, description }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <AdminPageHeader
        title="카테고리"
        description={description}
        action={
          <Button className="rounded-full" onClick={() => setFormOpen(true)}>
            <Plus size={16} />새 카테고리
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}

        <Button
          variant="ghost"
          onClick={() => setFormOpen(true)}
          className="text-muted-foreground h-auto justify-start gap-3 rounded-2xl border border-dashed p-4"
        >
          <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Plus size={18} />
          </span>
          카테고리 추가
        </Button>
      </div>

      <CategoryFormDialogAction open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
