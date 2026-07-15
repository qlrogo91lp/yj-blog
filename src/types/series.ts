import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import type { series } from '@/db/schema';

// DB row 타입 (Drizzle 추론)
export type Series = InferSelectModel<typeof series>;

// 시리즈 목록용 (published 글 집계 포함)
export type SeriesWithMeta = Series & {
  postCount: number;
  thumbnailUrl: string | null; // 시리즈 내 썸네일이 있는 첫 글의 썸네일
  lastPublishedAt: Date | null;
};

// 시리즈 내 글 요약 (글 상세 시리즈 박스용)
export type SeriesPostItem = {
  id: number;
  title: string;
  slug: string;
  publishedAt: Date | null;
};

// 시리즈 상세 페이지용 글 항목
export type SeriesDetailPost = SeriesPostItem & {
  excerpt: string | null;
  thumbnailUrl: string | null;
};

// 시리즈 상세 (published 글 목록 포함, publishedAt ASC)
export type SeriesDetail = Series & {
  posts: SeriesDetailPost[];
};

// 글 상세 시리즈 박스/이전·다음 네비게이션용
export type SeriesNav = {
  name: string;
  slug: string;
  posts: SeriesPostItem[];
};

// 시리즈 생성/수정 폼 스키마
export const seriesFormSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(100, '이름은 100자 이하여야 합니다'),
  slug: z
    .string()
    .min(1, 'slug를 입력해주세요')
    .max(100, 'slug는 100자 이하여야 합니다')
    .regex(/^[a-z0-9가-힣-]+$/, '영소문자, 숫자, 한글, 하이픈만 사용 가능합니다'),
  description: z.string().max(500, '설명은 500자 이하여야 합니다').optional(),
});

export type SeriesFormValues = z.infer<typeof seriesFormSchema>;
