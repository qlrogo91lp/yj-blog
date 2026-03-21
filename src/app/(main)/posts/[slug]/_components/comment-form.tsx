'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { commentFormSchema, type CommentFormValues } from '@/types/comment'
import { createCommentAction } from '../_services/create-comment'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Props = {
  postId: number
  postSlug: string
  parentId?: number
  onSuccess?: () => void
}

export function CommentForm({ postId, postSlug, parentId, onSuccess }: Props) {
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { authorName: '', email: '', password: '', content: '', parentId },
  })

  const onSubmit = async (data: CommentFormValues) => {
    const result = await createCommentAction(postId, postSlug, data)
    if (result.success) {
      form.reset()
      onSuccess?.()
    } else {
      form.setError('root', { message: result.error })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`authorName-${parentId ?? 'root'}`}>이름 *</Label>
          <Input
            id={`authorName-${parentId ?? 'root'}`}
            placeholder="작성자 이름"
            {...form.register('authorName')}
          />
          {form.formState.errors.authorName && (
            <p className="text-sm text-destructive">{form.formState.errors.authorName.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`password-${parentId ?? 'root'}`}>비밀번호 *</Label>
          <Input
            id={`password-${parentId ?? 'root'}`}
            type="password"
            placeholder="수정·삭제 시 사용"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`email-${parentId ?? 'root'}`}>이메일 (선택 — 답글 알림 수신)</Label>
        <Input
          id={`email-${parentId ?? 'root'}`}
          type="email"
          placeholder="답글이 달리면 알려드립니다"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`content-${parentId ?? 'root'}`}>내용 *</Label>
        <Textarea
          id={`content-${parentId ?? 'root'}`}
          placeholder="댓글을 입력해주세요"
          rows={4}
          {...form.register('content')}
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>
      {form.formState.errors.root && (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? '등록 중...' : '댓글 등록'}
      </Button>
    </form>
  )
}
