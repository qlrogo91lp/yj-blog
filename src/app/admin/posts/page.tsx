import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllPostsForAdmin } from '@/db/queries/posts';
import { AdminPageHeader } from '../_components/admin-page-header';
import { PostStatusFilterAction } from './_actions/post-status-filter.action';
import { PostRow } from './_components/post-row';

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminPostsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const current = status === 'published' || status === 'draft' ? status : 'all';

  const allPosts = await getAllPostsForAdmin();
  const posts =
    current === 'all'
      ? allPosts
      : allPosts.filter((post) => post.status === current);

  const publishedCount = allPosts.filter(
    (post) => post.status === 'published'
  ).length;

  return (
    <div>
      <AdminPageHeader
        title="글 관리"
        description={`전체 ${allPosts.length}개 · 발행 ${publishedCount}개 · 임시저장 ${allPosts.length - publishedCount}개`}
        action={
          <div className="flex items-center gap-3">
            <PostStatusFilterAction current={current} />
            <Button className="rounded-full" asChild>
              <Link href="/admin/posts/new">
                <Plus size={16} />
                글쓰기
              </Link>
            </Button>
          </div>
        }
      />

      {posts.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          작성된 글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </ul>
      )}
    </div>
  );
}
