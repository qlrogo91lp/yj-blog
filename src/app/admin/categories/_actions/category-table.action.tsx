'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import type { Category } from '@/types';
import { categoryColumns } from '../_components/columns';
import { CategoryFormDialogAction } from './category-form-dialog.action';

type Props = {
  categories: Category[];
};

export function CategoryTableAction({ categories }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={() => setFormOpen(true)}>새 카테고리</Button>
      </div>

      <DataTable
        columns={categoryColumns}
        data={categories}
        emptyMessage="카테고리가 없습니다."
      />

      <CategoryFormDialogAction
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
