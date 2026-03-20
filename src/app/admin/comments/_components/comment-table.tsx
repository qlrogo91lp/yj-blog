'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Comment } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteCommentDialog } from './_delete-comment'

type AdminComment = Comment & { postTitle: string; postSlug: string }

type Props = {
  comments: AdminComment[]
}

export function CommentTable({ comments }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  if (comments.length === 0) {
    return <p className="text-muted-foreground">댓글이 없습니다.</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">작성자</th>
              <th className="pb-2 pr-4 font-medium">글 제목</th>
              <th className="pb-2 pr-4 font-medium">내용</th>
              <th className="pb-2 pr-4 font-medium">작성일</th>
              <th className="pb-2 pr-4 font-medium">상태</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id} className="border-b">
                <td className="py-3 pr-4">{comment.authorName}</td>
                <td className="py-3 pr-4">
                  <a
                    href={`/posts/${comment.postSlug}`}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {comment.postTitle}
                  </a>
                </td>
                <td className="py-3 pr-4 max-w-xs truncate">{comment.content}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  {format(new Date(comment.createdAt), 'yyyy.M.d HH:mm', { locale: ko })}
                </td>
                <td className="py-3 pr-4">
                  {comment.isDeleted ? (
                    <Badge variant="secondary">삭제됨</Badge>
                  ) : (
                    <Badge>활성</Badge>
                  )}
                </td>
                <td className="py-3">
                  {!comment.isDeleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive text-xs"
                      onClick={() => setDeletingId(comment.id)}
                    >
                      삭제
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteCommentDialog
        commentId={deletingId}
        onClose={() => setDeletingId(null)}
      />
    </>
  )
}
