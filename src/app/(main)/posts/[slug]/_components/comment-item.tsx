'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { commentPasswordSchema, type CommentPasswordValues, type CommentWithReplies } from '@/types'
import { deleteCommentAction } from '../_actions/delete-comment-action'
import { CommentForm } from './comment-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Props = {
  comment: CommentWithReplies
  postSlug: string
  isReply?: boolean
}

export function CommentItem({ comment, postSlug, isReply = false }: Props) {
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const deleteForm = useForm<CommentPasswordValues>({
    resolver: zodResolver(commentPasswordSchema),
    defaultValues: { password: '' },
  })

  const onDelete = async (data: CommentPasswordValues) => {
    const result = await deleteCommentAction(comment.id, postSlug, data)
    if (result.success) {
      setIsDeleteOpen(false)
      deleteForm.reset()
    } else {
      deleteForm.setError('password', { message: result.error })
    }
  }

  const formattedDate = format(new Date(comment.createdAt), 'yyyy.M.d HH:mm', { locale: ko })

  if (comment.isDeleted) {
    return (
      <div className={isReply ? 'ml-8 mt-4' : ''}>
        <p className="text-sm text-muted-foreground italic">삭제된 댓글입니다.</p>
        {comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} postSlug={postSlug} isReply />
            ))}
          </div>
        )}
      </div>
    )
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
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-destructive">
              삭제
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>댓글 삭제</DialogTitle>
            </DialogHeader>
            <form onSubmit={deleteForm.handleSubmit(onDelete)} className="grid gap-4">
              <Input
                type="password"
                placeholder="댓글 작성 시 입력한 비밀번호"
                {...deleteForm.register('password')}
              />
              {deleteForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {deleteForm.formState.errors.password.message}
                </p>
              )}
              <Button type="submit" variant="destructive" disabled={deleteForm.formState.isSubmitting}>
                {deleteForm.formState.isSubmitting ? '삭제 중...' : '삭제'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
            <CommentItem key={reply.id} comment={reply} postSlug={postSlug} isReply />
          ))}
        </div>
      )}
    </div>
  )
}
