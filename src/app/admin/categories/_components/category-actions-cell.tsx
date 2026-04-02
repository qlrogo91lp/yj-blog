import type { Category } from '@/types';
import { EditCategoryAction } from './_actions/edit-category-action';
import { DeleteCategoryAction } from './_actions/delete-category-action';

type Props = {
  category: Category;
};

export function CategoryActionsCell({ category }: Props) {
  return (
    <div className="flex items-center justify-end gap-1">
      <EditCategoryAction category={category} />
      <DeleteCategoryAction category={category} />
    </div>
  );
}
