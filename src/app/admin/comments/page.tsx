import { getAllCommentsForAdmin } from '@/db/queries/comments';
import { CommentTable } from './_components/comment-table';

export default async function AdminCommentsPage() {
  const { comments, total } = await getAllCommentsForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">댓글 관리</h1>
      <p className="text-sm text-muted-foreground mb-4">전체 {total}개</p>
      <CommentTable comments={comments} />
    </div>
  );
}
