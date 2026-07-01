import type { CommentWithReplies } from '@/types';
import { CommentItemAction } from '../_actions/comment-item.action';

type Props = {
  comments: CommentWithReplies[];
  postSlug: string;
};

export function CommentList({ comments, postSlug }: Props) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItemAction key={comment.id} comment={comment} postSlug={postSlug} />
      ))}
    </div>
  );
}
