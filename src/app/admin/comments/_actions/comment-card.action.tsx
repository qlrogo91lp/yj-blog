'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminCommentThread } from '@/types';
import { CommentReplyRow } from '../_components/comment-reply-row';
import { CommentReplyFormAction } from './comment-reply-form.action';
import { DeleteCommentDialogAction } from './delete-comment-dialog.action';

type Props = {
  thread: AdminCommentThread;
};

export function CommentCardAction({ thread }: Props) {
  const [isReplying, setIsReplying] = useState(false);
  const hasAdminReply = thread.replies.some((reply) => reply.isAuthor);

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <a
          href={`/posts/${thread.postSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm hover:underline"
        >
          {thread.postTitle}
        </a>
        {!thread.isDeleted &&
          (hasAdminReply ? (
            <Badge variant="secondary">답변 완료</Badge>
          ) : (
            <Badge variant="outline">답변 대기</Badge>
          ))}
      </div>

      {thread.isDeleted ? (
        <p className="text-muted-foreground text-sm italic">
          삭제된 댓글입니다.
        </p>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold">{thread.authorName}</span>
            {thread.isAuthor && (
              <Badge variant="secondary" className="text-xs">
                작성자
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {format(new Date(thread.createdAt), 'yyyy.M.d HH:mm', {
                locale: ko,
              })}
            </span>
          </div>
          <p className="mb-2 text-sm whitespace-pre-wrap">{thread.content}</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setIsReplying((prev) => !prev)}
            >
              {isReplying ? '취소' : '답글'}
            </Button>
            <DeleteCommentDialogAction commentId={thread.id} />
          </div>
          {isReplying && (
            <div className="mt-3 ml-6">
              <CommentReplyFormAction
                postId={thread.postId}
                postSlug={thread.postSlug}
                parentId={thread.id}
                onSuccess={() => setIsReplying(false)}
              />
            </div>
          )}
        </>
      )}

      {thread.replies.map((reply) => (
        <CommentReplyRow key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
