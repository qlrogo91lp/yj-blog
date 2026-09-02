import { FolderOpen } from 'lucide-react';
import type { CategoryWithCount } from '@/types';
import { CategoryActionsCell } from './category-actions-cell';

type Props = {
  category: CategoryWithCount;
};

export function CategoryCard({ category }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-4">
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
        <FolderOpen size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{category.name}</span>
          <span className="text-muted-foreground font-mono text-xs">
            /{category.slug}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">
          {category.description
            ? `${category.description} · 글 ${category.postCount}개`
            : `글 ${category.postCount}개`}
        </p>
      </div>

      <CategoryActionsCell category={category} />
    </div>
  );
}
