import { Suspense } from 'react';
import { getCategories, getCategoryBySlug } from '@/db/queries/categories';
import { getPosts } from '@/db/queries/posts';
import { ViewToggleAction } from '../_actions/view-toggle-action';
import { CategoryFilterAction } from './_actions/category-filter-action';
import { SearchAction } from './_actions/search-action';
import { InfinitePostListAction } from './_actions/infinite-post-list-action';

type Props = {
  searchParams: Promise<{ category?: string; view?: string; search?: string }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, view, search } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';

  const [categoriesData, categoryData] = await Promise.all([
    getCategories(),
    categorySlug ? getCategoryBySlug(categorySlug) : null,
  ]);

  const { items: posts, total } = await getPosts({
    categoryId: categoryData?.id,
    page: 1,
    limit: 10,
    search,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">총 {total}개</span>
          <div className="flex items-center gap-4">
            <Suspense>
              <div className="max-[500px]:hidden">
                <SearchAction />
              </div>
              <ViewToggleAction viewType={viewType} />
            </Suspense>
          </div>
        </div>
        <Suspense>
          <div className="hidden max-[500px]:block">
            <SearchAction />
          </div>
        </Suspense>
        <Suspense>
          <CategoryFilterAction
            categories={categoriesData}
            currentSlug={categorySlug}
          />
        </Suspense>
      </div>
      <Suspense>
        <InfinitePostListAction
          initialPosts={posts}
          initialTotal={total}
          viewType={viewType}
        />
      </Suspense>
    </div>
  );
}
