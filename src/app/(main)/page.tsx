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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          최신 글{' '}
          <span className="text-base font-normal text-muted-foreground">
            ({total}편)
          </span>
        </h1>
        <ViewToggleAction viewType={viewType} />
      </div>
      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
