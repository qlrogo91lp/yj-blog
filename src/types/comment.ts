import { z } from 'zod'
import type { InferSelectModel } from 'drizzle-orm'
import type { comments } from '@/db/schema'

// DB row 타입 (Drizzle 추론)
export type Comment = InferSelectModel<typeof comments>

// 대댓글을 포함한 트리 구조
export type CommentWithReplies = Comment & {
  replies: CommentWithReplies[]
}

// 댓글 작성 폼 스키마 (password는 평문 — actions에서 bcrypt 해싱)
export const commentFormSchema = z.object({
  authorName: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이하여야 합니다'),
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다'),
  content: z
    .string()
    .min(1, '댓글을 입력해주세요')
    .max(2000, '댓글은 2000자 이하여야 합니다'),
  parentId: z.number().int().positive().nullable().optional(),
})

export type CommentFormValues = z.infer<typeof commentFormSchema>

// 댓글 수정/삭제 시 비밀번호 검증 스키마
export const commentPasswordSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type CommentPasswordValues = z.infer<typeof commentPasswordSchema>
