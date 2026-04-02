import { getAllPostsForAdmin } from '@/db/queries/posts';
import { DataTable } from '@/components/data-table';
import { postColumns } from './_components/columns';

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">글 관리</h1>
      <DataTable columns={postColumns} data={posts} emptyMessage="작성된 글이 없습니다." />
    </div>
  );
}
