'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { type CommentPasswordValues, commentPasswordSchema } from '@/types';
import { deleteCommentAction } from '../_services/delete-comment';

type Props = {
  commentId: number;
  postSlug: string;
};

export function DeleteCommentDialogAction({ commentId, postSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CommentPasswordValues>({
    resolver: zodResolver(commentPasswordSchema),
    defaultValues: { password: '' },
  });

  const onDelete = async (data: CommentPasswordValues) => {
    const result = await deleteCommentAction(commentId, postSlug, data);
    if (result.success) {
      setIsOpen(false);
      form.reset();
    } else {
      form.setError('password', { message: result.error });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2 text-destructive"
        >
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>댓글 삭제</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onDelete)} className="grid gap-4">
          <Input
            type="password"
            placeholder="댓글 작성 시 입력한 비밀번호"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
          <Button
            type="submit"
            variant="destructive"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? '삭제 중...' : '삭제'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
