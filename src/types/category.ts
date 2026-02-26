import { z } from 'zod'
import type { InferSelectModel } from 'drizzle-orm'
import type { categories } from '@/db/schema'

// DB row 타입 (Drizzle 추론)
export type Category = InferSelectModel<typeof categories>

// 카테고리 생성/수정 폼 스키마
export const categoryFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하여야 합니다'),
  slug: z
    .string()
    .min(1, 'slug를 입력해주세요')
    .max(100, 'slug는 100자 이하여야 합니다')
    .regex(/^[a-z0-9-]+$/, '영소문자, 숫자, 하이픈만 사용 가능합니다'),
  description: z.string().max(500, '설명은 500자 이하여야 합니다').optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
