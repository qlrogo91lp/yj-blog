'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BlogSettings } from '@/db/queries/settings';
import { editSettings } from '../_services/edit-settings';

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
  github: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
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

export function SettingsFormAction({ defaultValues }: Props) {
  const defaultFormValues: BlogSettingsFormValues = {
    blogName: defaultValues?.blogName ?? '',
    tagline: defaultValues?.tagline ?? '',
    authorBio: defaultValues?.authorBio ?? '',
    siteUrl: defaultValues?.siteUrl ?? '',
    defaultMetaDescription: defaultValues?.defaultMetaDescription ?? '',
    github: defaultValues?.socialLinks?.github ?? '',
    twitter: defaultValues?.socialLinks?.twitter ?? '',
    linkedin: defaultValues?.socialLinks?.linkedin ?? '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<BlogSettingsFormValues>({
    resolver: zodResolver(blogSettingsSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: BlogSettingsFormValues) => {
    const result = await editSettings(data);
    if (result.success) {
      toast.success('설정이 저장되었습니다');
      reset(data);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      <section id="basic" className="space-y-4">
        <h2 className="text-lg font-semibold">기본 정보</h2>

        <div className="space-y-2">
          <Label htmlFor="blogName">블로그 이름 *</Label>
          <Input id="blogName" {...register('blogName')} />
          {errors.blogName && (
            <p className="text-destructive text-sm">
              {errors.blogName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">한 줄 소개</Label>
          <Input
            id="tagline"
            placeholder="개발하며 배운 것들을 기록합니다."
            {...register('tagline')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorBio">홈 문구</Label>
          <Textarea
            id="authorBio"
            rows={3}
            placeholder="Frontend · Backend · 일상의 메모"
            {...register('authorBio')}
          />
        </div>
      </section>

      <section id="seo" className="space-y-4">
        <h2 className="text-lg font-semibold">SEO · 공유</h2>

        <div className="space-y-2">
          <Label htmlFor="siteUrl">사이트 URL</Label>
          <Input
            id="siteUrl"
            placeholder="https://example.com"
            {...register('siteUrl')}
          />
          {errors.siteUrl && (
            <p className="text-destructive text-sm">{errors.siteUrl.message}</p>
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
            <p className="text-destructive text-sm">
              {errors.defaultMetaDescription.message}
            </p>
          )}
        </div>
      </section>

      <section id="social" className="space-y-4">
        <h2 className="text-lg font-semibold">소셜 링크</h2>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            placeholder="https://github.com/username"
            {...register('github')}
          />
          {errors.github && (
            <p className="text-destructive text-sm">{errors.github.message}</p>
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
            <p className="text-destructive text-sm">{errors.twitter.message}</p>
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
            <p className="text-destructive text-sm">
              {errors.linkedin.message}
            </p>
          )}
        </div>
      </section>

      {isDirty && (
        <div className="pointer-events-none sticky bottom-6 z-10 flex justify-center">
          <div className="bg-foreground text-background pointer-events-auto flex items-center gap-3 rounded-full py-2 pr-2 pl-5 shadow-lg">
            <span className="text-sm">
              변경사항 {Object.keys(dirtyFields).length}개
            </span>
            <button
              type="button"
              onClick={() => reset(defaultFormValues)}
              disabled={isSubmitting}
              className="text-background/70 hover:text-background text-sm transition-colors disabled:opacity-50"
            >
              되돌리기
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-background text-foreground hover:bg-background/90 rounded-full"
              size="sm"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
