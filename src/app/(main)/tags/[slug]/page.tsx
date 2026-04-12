import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTagBySlug, getPostsByTag } from '@/db/queries/tags';
import { ViewToggleAction } from '../../_actions/view-toggle-action';
import { PostListViewHandler } from '../../_handlers/post-list-view-handler';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};

  return {
    title: `#${tag.name} 태그 글 목록`,
    description: `${tag.name} 태그가 붙은 글 목록입니다.`,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { view } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { items: posts, total } = await getPostsByTag(tag.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">태그</p>
            <h1 className="text-2xl font-bold">
              #{tag.name}{' '}
              <span className="text-base font-normal text-muted-foreground">
                ({total}편)
              </span>
            </h1>
          </div>
          <ViewToggleAction viewType={viewType} />
        </div>
      </div>

      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
