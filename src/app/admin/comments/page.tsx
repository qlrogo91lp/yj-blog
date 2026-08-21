import { getAllCommentsForAdmin, getPendingReplyCount } from '@/db/queries/comments';
import { AdminPageHeader } from '../_components/admin-page-header';
import { CommentCardAction } from './_actions/comment-card.action';

export default async function AdminCommentsPage() {
  const [{ comments, total }, pendingCount] = await Promise.all([
    getAllCommentsForAdmin(),
    getPendingReplyCount(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="댓글"
        description={`답변 대기 ${pendingCount}개 · 전체 ${total}개`}
      />
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
