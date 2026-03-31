import { getPosts } from '@/db/queries/posts';
import { ViewToggleAction } from './_actions/view-toggle-action';
import { PostListViewHandler } from './_handlers/post-list-view-handler';

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { view } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';
  const { items: posts, total } = await getPosts({ limit: 10 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-bold text-primary">
          총{' '}{total}개
        </span>
        <ViewToggleAction viewType={viewType} />
      </div>
      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
