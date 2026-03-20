'use client'

import { useState } from 'react'
import { adminDeleteCommentAction } from './_actions/delete-comment-action'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type Props = {
  commentId: number | null
  onClose: () => void
}

export function DeleteCommentDialog({ commentId, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!commentId) return
    setIsSubmitting(true)
    setError(null)

    const result = await adminDeleteCommentAction(commentId)
    setIsSubmitting(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }
  }

  return (
    <Dialog open={commentId !== null} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>댓글 삭제</DialogTitle>
          <DialogDescription>이 댓글을 삭제하시겠습니까? 삭제된 댓글은 &quot;삭제된 댓글입니다&quot;로 표시됩니다.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
