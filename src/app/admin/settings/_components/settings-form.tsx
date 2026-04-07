'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateSettings } from '../_services/update-settings';
import type { BlogSettings } from '@/db/queries/settings';

const blogSettingsSchema = z.object({
  blogName: z.string().min(1, '블로그 이름은 필수입니다').max(100),
  tagline: z.string().max(255).optional(),
  authorBio: z.string().optional(),
  siteUrl: z
    .string()
    .url('유효한 URL을 입력하세요')
    .max(255)
    .optional()
    .or(z.literal('')),
  defaultMetaDescription: z.string().max(300).optional(),
  github: z.string().url('유효한 URL을 입력하세요').optional().or(z.literal('')),
  twitter: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
});

export type BlogSettingsFormValues = z.infer<typeof blogSettingsSchema>;

type Props = {
  defaultValues?: BlogSettings | null;
};

export function SettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BlogSettingsFormValues>({
    resolver: zodResolver(blogSettingsSchema),
    defaultValues: {
      blogName: defaultValues?.blogName ?? '',
      tagline: defaultValues?.tagline ?? '',
      authorBio: defaultValues?.authorBio ?? '',
      siteUrl: defaultValues?.siteUrl ?? '',
      defaultMetaDescription: defaultValues?.defaultMetaDescription ?? '',
      github: defaultValues?.socialLinks?.github ?? '',
      twitter: defaultValues?.socialLinks?.twitter ?? '',
      linkedin: defaultValues?.socialLinks?.linkedin ?? '',
    },
  });

  const onSubmit = (data: BlogSettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateSettings(data);
        toast.success('설정이 저장되었습니다');
      } catch {
        toast.error('저장 중 오류가 발생했습니다');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">기본 정보</h2>

        <div className="space-y-2">
          <Label htmlFor="blogName">블로그 이름 *</Label>
          <Input id="blogName" {...register('blogName')} />
          {errors.blogName && (
            <p className="text-sm text-destructive">{errors.blogName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">태그라인</Label>
          <Input
            id="tagline"
            placeholder="개발하며 배운 것들을 기록합니다."
            {...register('tagline')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorBio">소개</Label>
          <Textarea
            id="authorBio"
            rows={3}
            placeholder="Frontend · Backend · 일상의 메모"
            {...register('authorBio')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteUrl">사이트 URL</Label>
          <Input
            id="siteUrl"
            placeholder="https://example.com"
            {...register('siteUrl')}
          />
          {errors.siteUrl && (
            <p className="text-sm text-destructive">{errors.siteUrl.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultMetaDescription">기본 메타 설명</Label>
          <Textarea
            id="defaultMetaDescription"
            rows={2}
            placeholder="검색 엔진에 표시될 기본 설명"
            {...register('defaultMetaDescription')}
          />
          {errors.defaultMetaDescription && (
            <p className="text-sm text-destructive">
              {errors.defaultMetaDescription.message}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">소셜 링크</h2>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            placeholder="https://github.com/username"
            {...register('github')}
          />
          {errors.github && (
            <p className="text-sm text-destructive">{errors.github.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter / X</Label>
          <Input
            id="twitter"
            placeholder="https://twitter.com/username"
            {...register('twitter')}
          />
          {errors.twitter && (
            <p className="text-sm text-destructive">{errors.twitter.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            placeholder="https://linkedin.com/in/username"
            {...register('linkedin')}
          />
          {errors.linkedin && (
            <p className="text-sm text-destructive">{errors.linkedin.message}</p>
          )}
        </div>
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
