'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminCommentThread } from '@/types';
import { CommentAvatar } from '../_components/comment-avatar';
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
      <div className="flex items-start gap-3">
        <CommentAvatar name={thread.isDeleted ? '' : thread.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {thread.isDeleted ? '(삭제됨)' : thread.authorName}
            </span>
            {!thread.isDeleted && thread.isAuthor && (
              <Badge variant="secondary" className="text-xs">
                작성자
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            <a
              href={`/posts/${thread.postSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {thread.postTitle}
            </a>
            {' · '}
            {formatDistanceToNow(new Date(thread.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </p>
        </div>
        {!thread.isDeleted &&
          (hasAdminReply ? (
            <Badge variant="secondary">답변 완료</Badge>
          ) : (
            <Badge variant="outline">답변 대기</Badge>
          ))}
      </div>

      {thread.isDeleted ? (
        <p className="text-muted-foreground ml-11 text-sm italic">
          삭제된 댓글입니다.
        </p>
      ) : (
        <>
          <p className="mt-2 mb-2 ml-11 text-sm whitespace-pre-wrap">
            {thread.content}
          </p>
          <div className="ml-11 flex gap-2">
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
            <div className="mt-3 ml-11">
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
