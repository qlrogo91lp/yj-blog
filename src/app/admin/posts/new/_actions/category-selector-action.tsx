'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/types';
import { useNewPostStore } from '../_store';

type Props = {
  categories: Category[];
};

export function CategorySelectorAction({ categories }: Props) {
  const categoryId = useNewPostStore((s) => s.categoryId);
  const setCategoryId = useNewPostStore((s) => s.setCategoryId);

  return (
    <div className="mb-4">
      <Select
        value={categoryId?.toString() ?? ''}
        onValueChange={(value) => setCategoryId(value ? Number(value) : null)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="카테고리 선택" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
