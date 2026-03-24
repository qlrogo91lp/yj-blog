import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/db/queries/categories';
import { getPosts } from '@/db/queries/posts';
import { ViewToggleAction } from '../../_actions/view-toggle-action';
import { PostListViewHandler } from '../../_handlers/post-list-view-handler';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} 글 목록`,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { view } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const { items: posts, total } = await getPosts({ categoryId: category.id });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">카테고리</p>
            <h1 className="text-2xl font-bold">
              {category.name}{' '}
              <span className="text-base font-normal text-muted-foreground">
                ({total}편)
              </span>
            </h1>
            {category.description && (
              <p className="mt-2 text-muted-foreground">{category.description}</p>
            )}
          </div>
          <ViewToggleAction viewType={viewType} />
        </div>
      </div>

      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
