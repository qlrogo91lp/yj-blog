import { z } from 'zod'
import type { InferSelectModel } from 'drizzle-orm'
import type { series } from '@/db/schema'

// DB row 타입 (Drizzle 추론)
export type Series = InferSelectModel<typeof series>

// 시리즈 생성/수정 폼 스키마
export const seriesFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하여야 합니다'),
  slug: z
    .string()
    .min(1, 'slug를 입력해주세요')
    .max(100, 'slug는 100자 이하여야 합니다')
    .regex(/^[a-z0-9-]+$/, '영소문자, 숫자, 하이픈만 사용 가능합니다'),
  description: z.string().max(1000, '설명은 1000자 이하여야 합니다').optional(),
  thumbnailUrl: z.string().optional(),
})

export type SeriesFormValues = z.infer<typeof seriesFormSchema>
