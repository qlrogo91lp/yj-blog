import { Suspense } from 'react';
import { getCategories, selectCategoryBySlug } from '@/db/queries/categories';
import { selectPosts } from '@/db/queries/posts';
import { getAllTags, getTagBySlug, selectTagsByPostIds } from '@/db/queries/tags';
import { ViewToggleAction } from '../_actions/view-toggle.action';
import { CategoryFilterAction } from './_actions/category-filter.action';
import { SearchAction } from './_actions/search.action';
import { TagFilterAction } from './_actions/tag-filter.action';
import { InfinitePostListAction } from './_actions/infinite-post-list.action';

type Props = {
  searchParams: Promise<{
    category?: string;
    view?: string;
    search?: string;
    tag?: string;
  }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, view, search, tag: tagSlug } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';

  const [categoriesData, categoryData, tagsData, tagData] = await Promise.all([
    getCategories(),
    categorySlug ? selectCategoryBySlug(categorySlug) : null,
    getAllTags(),
    tagSlug ? getTagBySlug(tagSlug) : null,
  ]);

  const { items: posts, total } = await selectPosts({
    categoryId: categoryData?.id,
    tagId: tagData?.id,
    page: 1,
    limit: 10,
    search,
  });

  const postTagsMap = await selectTagsByPostIds(posts.map((p) => p.id));
  const serializedTagsMap = Object.fromEntries(postTagsMap);

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
        <Suspense>
          <TagFilterAction tags={tagsData} currentSlug={tagSlug} />
        </Suspense>
      </div>
      <Suspense>
        <InfinitePostListAction
          initialPosts={posts}
          initialTotal={total}
          viewType={viewType}
          initialTagsMap={serializedTagsMap}
        />
      </Suspense>
    </div>
  );
}
