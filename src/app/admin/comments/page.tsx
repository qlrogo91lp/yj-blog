import { getAllCommentsForAdmin } from '@/db/queries/comments';
import { CommentCardAction } from './_actions/comment-card.action';

export default async function AdminCommentsPage() {
  const { comments, total } = await getAllCommentsForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">댓글 관리</h1>
      <p className="text-muted-foreground mb-4 text-sm">
        전체 스레드 {total}개
      </p>
      {comments.length === 0 ? (
        <p className="text-muted-foreground">댓글이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((thread) => (
            <CommentCardAction key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
