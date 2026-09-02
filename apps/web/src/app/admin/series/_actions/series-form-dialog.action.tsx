'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateSlug } from '@/lib/slugify';
import type { Series } from '@/types';
import { type SeriesFormValues, seriesFormSchema } from '@/types/series';
import { addSeries } from '../_services/add-series';
import { editSeries } from '../_services/edit-series';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series?: Series | null;
};

export function SeriesFormDialogAction({ open, onOpenChange, series }: Props) {
  const isEdit = !!series;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      status: 'ongoing',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: series?.name ?? '',
        slug: series?.slug ?? '',
        description: series?.description ?? '',
        status: series?.status ?? 'ongoing',
      });
    }
  }, [open, series, form]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setError(null);
    }
    onOpenChange(value);
  };

  const onSubmit = async (data: SeriesFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const result = isEdit
      ? await editSeries(series.id, data)
      : await addSeries(data);

    setIsSubmitting(false);

    if (result.success) {
      form.reset();
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  const handleNameBlur = () => {
    const name = form.getValues('name');
    const currentSlug = form.getValues('slug');
    if (name && !currentSlug) {
      form.setValue('slug', generateSlug(name), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '시리즈 수정' : '새 시리즈'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '시리즈 정보를 수정합니다.'
              : '새로운 시리즈를 추가합니다.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="시리즈 이름"
              {...form.register('name')}
              onBlur={handleNameBlur}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="series-slug"
              {...form.register('slug')}
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="시리즈 소개 — 시리즈 상세 페이지와 meta description에 사용됩니다"
              rows={3}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">연재 상태</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) =>
                form.setValue('status', value as SeriesFormValues['status'])
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">연재 중</SelectItem>
                <SelectItem value="completed">완결</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEdit ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
