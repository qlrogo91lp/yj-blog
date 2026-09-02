import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { Comment } from '@/types';
import { DeleteCommentDialogAction } from '../_actions/delete-comment-dialog.action';

type Props = {
  reply: Comment;
};

export function CommentReplyRow({ reply }: Props) {
  if (reply.isDeleted) {
    return (
      <div className="border-border mt-3 ml-6 border-l pl-4">
        <p className="text-muted-foreground text-sm italic">
          삭제된 댓글입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border mt-3 ml-6 border-l pl-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-semibold">{reply.authorName}</span>
        {reply.isAuthor && (
          <Badge variant="secondary" className="text-xs">
            작성자
          </Badge>
        )}
        <span className="text-muted-foreground text-xs">
          {format(new Date(reply.createdAt), 'yyyy.M.d HH:mm', {
            locale: ko,
          })}
        </span>
      </div>
      <p className="mb-2 text-sm whitespace-pre-wrap">{reply.content}</p>
      <DeleteCommentDialogAction commentId={reply.id} />
    </div>
  );
}
