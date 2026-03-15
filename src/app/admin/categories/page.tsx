import { getCategories } from '@/db/queries/categories'
import { CategoryTable } from './_components/category-table'

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return <CategoryTable categories={categories} />
}
