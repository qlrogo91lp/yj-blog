'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { type AdminReplyFormValues, adminReplyFormSchema } from '@/types';
import { addAdminReply } from '../_services/add-admin-reply';

type Props = {
  postId: number;
  postSlug: string;
  parentId: number;
  onSuccess: () => void;
};

export function CommentReplyFormAction({
  postId,
  postSlug,
  parentId,
  onSuccess,
}: Props) {
  const form = useForm<AdminReplyFormValues>({
    resolver: zodResolver(adminReplyFormSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: AdminReplyFormValues) => {
    const result = await addAdminReply(postId, postSlug, parentId, data);
    if (result.success) {
      form.reset();
      onSuccess();
    } else {
      form.setError('content', { message: result.error });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2">
      <Textarea
        placeholder="답글을 입력하세요"
        {...form.register('content')}
      />
      {form.formState.errors.content && (
        <p className="text-destructive text-sm">
          {form.formState.errors.content.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '등록 중...' : '답글 등록'}
        </Button>
      </div>
    </form>
  );
}
