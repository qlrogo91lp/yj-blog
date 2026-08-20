import {
  getCategoriesWithPostCount,
  selectUncategorizedPosts,
} from '@/db/queries/categories';
import { AdminPageHeader } from '../_components/admin-page-header';
import { CategoryBoardAction } from './_actions/category-board.action';
import { UncategorizedBanner } from './_components/uncategorized-banner';

export default async function AdminCategoriesPage() {
  const [categories, uncategorized] = await Promise.all([
    getCategoriesWithPostCount(),
    selectUncategorizedPosts(),
  ]);

  const categorizedCount = categories.reduce(
    (sum, category) => sum + category.postCount,
    0
  );

  return (
    <div>
      <AdminPageHeader
        title="카테고리"
        description={
          uncategorized.length > 0
            ? `글 ${categorizedCount}개가 카테고리에 묶여 있고, ${uncategorized.length}개는 아직 미분류입니다`
            : `글 ${categorizedCount}개가 카테고리에 묶여 있습니다`
        }
      />

      <CategoryBoardAction categories={categories} />
      <UncategorizedBanner posts={uncategorized} />
    </div>
  );
}
