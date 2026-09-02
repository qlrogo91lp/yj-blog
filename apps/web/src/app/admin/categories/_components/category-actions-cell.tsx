import type { Category } from '@/types';
import { DeleteCategoryAction } from '../_actions/delete-category.action';
import { EditCategoryAction } from '../_actions/edit-category.action';

type Props = {
  category: Category;
};

export function CategoryActionsCell({ category }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <EditCategoryAction category={category} />
      <DeleteCategoryAction category={category} />
    </div>
  );
}
