import { getCategories } from '@/db/queries/categories';
import { CategoryTableAction } from './_actions/category-table.action';

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return <CategoryTableAction categories={categories} />;
}
