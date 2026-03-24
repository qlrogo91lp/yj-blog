import { Suspense } from 'react';
import { getCategories, getCategoryBySlug } from '@/db/queries/categories';
import { getPosts } from '@/db/queries/posts';
import { ViewToggleAction } from '../_actions/view-toggle-action';
import { PostListViewHandler } from '../_handlers/post-list-view-handler';
import { CategoryFilterAction } from './_actions/category-filter-action';

type Props = {
  searchParams: Promise<{ category?: string; page?: string; view?: string }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, page: pageStr, view } = await searchParams;
  const page = Number(pageStr) || 1;
  const viewType = view === 'list' ? 'list' : 'card';

  const [categoriesData, categoryData] = await Promise.all([
    getCategories(),
    categorySlug ? getCategoryBySlug(categorySlug) : null,
  ]);

  const { items: posts, total } = await getPosts({
    categoryId: categoryData?.id,
    page,
    limit: 10,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            글 목록{' '}
            <span className="text-base font-normal text-muted-foreground">
              ({total}편)
            </span>
          </h1>
          <ViewToggleAction viewType={viewType} />
        </div>
        <Suspense>
          <CategoryFilterAction
            categories={categoriesData}
            currentSlug={categorySlug}
          />
        </Suspense>
      </div>

      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
