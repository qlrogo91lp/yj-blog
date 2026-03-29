import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import type { posts } from '@/db/schema';
import type { Category } from './category';

// DB row 타입 (Drizzle 추론)
export type Post = InferSelectModel<typeof posts>;

// 목록/상세 페이지용 (category join)
export type PostWithCategory = Post & {
  category: Category | null;
};

// 글 생성/수정 폼 스키마
export const postFormSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이하여야 합니다'),
  slug: z
    .string()
    .min(1, 'slug를 입력해주세요')
    .max(200, 'slug는 200자 이하여야 합니다')
    .regex(/^[a-z0-9\uAC00-\uD7A3-]+$/, '영소문자, 숫자, 한글, 하이픈만 사용 가능합니다'),
  content: z.string().min(1, '내용을 입력해주세요'),
  contentFormat: z.enum(['markdown', 'html']),
  excerpt: z.string().max(500, '요약은 500자 이하여야 합니다').optional(),
  thumbnailUrl: z.string().optional(),
  status: z.enum(['draft', 'published']),
  categoryId: z.number().int().positive().nullable(),
  metaTitle: z
    .string()
    .max(100, 'meta 제목은 100자 이하여야 합니다')
    .optional(),
  metaDescription: z
    .string()
    .max(200, 'meta 설명은 200자 이하여야 합니다')
    .optional(),
});

export type PostFormValues = z.infer<typeof postFormSchema>;
