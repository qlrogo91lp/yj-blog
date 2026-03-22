'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { type CommentWithReplies } from '@/types';
import { DeleteCommentDialogAction } from '../_actions/delete-comment-dialog-action';
import { CommentForm } from './comment-form';

type Props = {
  comment: CommentWithReplies;
  postSlug: string;
  isReply?: boolean;
};

export function CommentItem({ comment, postSlug, isReply = false }: Props) {
  const [isReplying, setIsReplying] = useState(false);

  const formattedDate = format(new Date(comment.createdAt), 'yyyy.M.d HH:mm', {
    locale: ko,
  });

  if (comment.isDeleted) {
    return (
      <div className={isReply ? 'ml-8 mt-4' : ''}>
        <p className="text-sm text-muted-foreground italic">
          삭제된 댓글입니다.
        </p>
        {comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postSlug={postSlug}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={isReply ? 'ml-8 mt-4' : ''}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold">{comment.authorName}</span>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
      <div className="flex gap-2">
        {!isReply && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setIsReplying(!isReplying)}
          >
            {isReplying ? '취소' : '답글'}
          </Button>
        )}
        <DeleteCommentDialogAction commentId={comment.id} postSlug={postSlug} />
      </div>

      {isReplying && (
        <div className="mt-3 ml-8">
          <CommentForm
            postId={comment.postId}
            postSlug={postSlug}
            parentId={comment.id}
            onSuccess={() => setIsReplying(false)}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postSlug={postSlug}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
