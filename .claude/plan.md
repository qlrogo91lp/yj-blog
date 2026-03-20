# 수정 계획: 댓글 기능 추가

> 작성일: 2026-03-20

## 현재 구조

```
src/
├── db/
│   ├── schema.ts                   ← comments 테이블 존재, email 컬럼 없음
│   └── queries/
│       └── comments.ts             ← getCommentsByPostId() 1개만 존재
├── types/
│   └── comment.ts                  ← 타입·스키마 존재, email 필드 없음
└── app/
    ├── (main)/posts/[slug]/
    │   ├── page.tsx                ← PostDetail만 렌더링
    │   └── _components/
    │       └── post-detail.tsx     ← 댓글 섹션 없음
    └── admin/comments/
        └── page.tsx                ← "준비 중" 플레이스홀더
```

## 분석 요약

| 항목 | 상태 |
|------|------|
| DB 스키마 (`comments` 테이블) | ✅ 존재. `email` 컬럼만 추가 필요 |
| `CommentWithReplies` 타입 | ✅ 존재 |
| `commentFormSchema` (zod) | ⚠️ 존재하나 `email` 필드 없음 |
| `getCommentsByPostId()` 쿼리 | ✅ 존재. 트리 구조 반환 |
| 공개 댓글 UI / 서버 액션 | ❌ 미구현 |
| 관리자 댓글 관리 | ❌ 미구현 |
| 이메일 알림 서비스 | ❌ 없음 (Resend 도입 필요) |

---

## 수정 계획

### 1. DB 스키마 — `email` 컬럼 추가 [High]

**현재 코드** (`src/db/schema.ts` line 55–68)
```ts
export const comments = pgTable('comments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'),
  authorName: text('author_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  content: text('content').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

**수정 후**
```ts
export const comments = pgTable('comments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'),
  authorName: text('author_name').notNull(),
  email: text('email'),                         // nullable — 알림 수신 선택 시만 입력
  passwordHash: text('password_hash').notNull(),
  content: text('content').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

**이유**: 비회원 댓글 작성자가 답글 알림을 받으려면 이메일이 필요. nullable로 두어 선택 입력.

> 변경 후 `npx drizzle-kit push` 실행

---

### 2. 타입 & Zod 스키마 업데이트 [High]

**현재 코드** (`src/types/comment.ts`)
```ts
export const commentFormSchema = z.object({
  authorName: z.string().min(1, '이름을 입력해주세요').max(50, ...),
  password: z.string().min(4, ...).max(100, ...),
  content: z.string().min(1, ...).max(2000, ...),
  parentId: z.number().int().positive().nullable().optional(),
})
```

**수정 후**
```ts
export const commentFormSchema = z.object({
  authorName: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하여야 합니다'),
  email: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),              // 빈 문자열도 허용 (미입력)
  password: z.string().min(4, '비밀번호는 최소 4자 이상이어야 합니다').max(100, ...),
  content: z.string().min(1, '댓글을 입력해주세요').max(2000, ...),
  parentId: z.number().int().positive().nullable().optional(),
})
```

**이유**: 이메일은 선택 입력이므로 optional + 빈 문자열 허용.

---

### 3. DB 쿼리 추가 [High]

**현재** (`src/db/queries/comments.ts`): `getCommentsByPostId()` 1개만 존재.

**추가할 함수들**

```ts
// 댓글 작성
export async function createComment(data: {
  postId: number
  parentId?: number | null
  authorName: string
  email?: string | null
  passwordHash: string
  content: string
}): Promise<Comment>

// 댓글 소프트 삭제 (비밀번호 검증은 action에서)
export async function softDeleteComment(commentId: number): Promise<void>

// 특정 댓글 단건 조회 (비밀번호 검증용)
export async function getCommentById(commentId: number): Promise<Comment | undefined>

// 관리자용 전체 댓글 조회 (post title 포함, 페이지네이션)
export async function getAllCommentsForAdmin(page?: number): Promise<{
  comments: (Comment & { postTitle: string; postSlug: string })[]
  total: number
}>
```

---

### 4. 이메일 알림 서비스 도입 [Medium]

**패키지 설치**
```bash
npm install resend
```

**새 파일**: `src/lib/email.ts`
```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReplyNotification({
  to,
  postTitle,
  postSlug,
  authorName,
  replyContent,
}: {
  to: string
  postTitle: string
  postSlug: string
  authorName: string
  replyContent: string
}) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',   // .env에서 관리
    to,
    subject: `[블로그] "${postTitle}" 글에 답글이 달렸습니다`,
    html: `
      <p><strong>${authorName}</strong>님이 답글을 남겼습니다:</p>
      <blockquote>${replyContent}</blockquote>
      <a href="https://yourdomain.com/posts/${postSlug}">글 보러가기</a>
    `,
  })
}
```

**환경 변수** (`.env.local`에 추가)
```
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**이유**: Resend는 Next.js App Router에서 공식 지원, free tier 3,000통/월. 서버 액션에서 직접 호출 가능.

---

### 5. 공개 댓글 Server Actions [High]

**새 파일**: `src/app/(main)/posts/[slug]/_actions/create-comment-action.ts`
```ts
'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { commentFormSchema } from '@/types/comment'
import { createComment, getCommentById } from '@/db/queries/comments'
import { getPostBySlug } from '@/db/queries/posts'
import { sendReplyNotification } from '@/lib/email'

type Result = { success: true } | { success: false; error: string }

export async function createCommentAction(
  postId: number,
  postSlug: string,
  formData: unknown
): Promise<Result> {
  const parsed = commentFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { authorName, email, password, content, parentId } = parsed.data
  const passwordHash = await bcrypt.hash(password, 10)
  const emailValue = email === '' ? null : (email ?? null)

  try {
    await createComment({ postId, parentId, authorName, email: emailValue, passwordHash, content })

    // 답글이고, 부모 댓글에 이메일이 있으면 알림 전송
    if (parentId) {
      const parent = await getCommentById(parentId)
      if (parent?.email) {
        const post = await getPostBySlug(postSlug)
        if (post) {
          await sendReplyNotification({
            to: parent.email,
            postTitle: post.title,
            postSlug,
            authorName,
            replyContent: content,
          }).catch(() => {}) // 알림 실패는 무시
        }
      }
    }

    revalidatePath(`/posts/${postSlug}`)
    return { success: true }
  } catch {
    return { success: false, error: '댓글 작성에 실패했습니다' }
  }
}
```

**새 파일**: `src/app/(main)/posts/[slug]/_actions/delete-comment-action.ts`
```ts
'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { commentPasswordSchema } from '@/types/comment'
import { getCommentById, softDeleteComment } from '@/db/queries/comments'

type Result = { success: true } | { success: false; error: string }

export async function deleteCommentAction(
  commentId: number,
  postSlug: string,
  formData: unknown
): Promise<Result> {
  const parsed = commentPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: '비밀번호를 입력해주세요' }
  }

  const comment = await getCommentById(commentId)
  if (!comment) return { success: false, error: '댓글을 찾을 수 없습니다' }

  const isValid = await bcrypt.compare(parsed.data.password, comment.passwordHash)
  if (!isValid) return { success: false, error: '비밀번호가 올바르지 않습니다' }

  await softDeleteComment(commentId)
  revalidatePath(`/posts/${postSlug}`)
  return { success: true }
}
```

---

### 6. 공개 댓글 UI 컴포넌트 [High]

**파일 구조**
```
src/app/(main)/posts/[slug]/
├── _components/
│   ├── post-detail.tsx              ← comment-section 추가
│   ├── comment-section.tsx          ← 신규 (Server Component)
│   ├── comment-list.tsx             ← 신규 (순수 컴포넌트)
│   ├── comment-item.tsx             ← 신규 (순수 컴포넌트)
│   └── comment-form.tsx             ← 신규 (Client Component, "use client")
└── _actions/
    ├── create-comment-action.ts     ← 신규
    └── delete-comment-action.ts     ← 신규
```

**`comment-section.tsx`** (Server Component)
```tsx
import { getCommentsByPostId } from '@/db/queries/comments'
import { CommentList } from './comment-list'
import { CommentForm } from './comment-form'

type Props = {
  postId: number
  postSlug: string
}

export async function CommentSection({ postId, postSlug }: Props) {
  const comments = await getCommentsByPostId(postId)

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 border-t">
      <h2 className="text-xl font-bold mb-6">댓글 {comments.length}개</h2>
      <CommentList comments={comments} postSlug={postSlug} />
      <div className="mt-8">
        <h3 className="text-base font-semibold mb-4">댓글 작성</h3>
        <CommentForm postId={postId} postSlug={postSlug} />
      </div>
    </section>
  )
}
```

**`comment-form.tsx`** (Client Component — 폼 상태 관리)
```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { commentFormSchema, type CommentFormValues } from '@/types/comment'
import { createCommentAction } from '../_actions/create-comment-action'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Props = {
  postId: number
  postSlug: string
  parentId?: number
  onSuccess?: () => void
}

export function CommentForm({ postId, postSlug, parentId, onSuccess }: Props) {
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { authorName: '', email: '', password: '', content: '', parentId },
  })

  const onSubmit = async (data: CommentFormValues) => {
    const result = await createCommentAction(postId, postSlug, data)
    if (result.success) {
      form.reset()
      onSuccess?.()
    } else {
      form.setError('root', { message: result.error })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="authorName">이름 *</Label>
          <Input id="authorName" placeholder="작성자 이름" {...form.register('authorName')} />
          {form.formState.errors.authorName && (
            <p className="text-sm text-destructive">{form.formState.errors.authorName.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">비밀번호 *</Label>
          <Input id="password" type="password" placeholder="수정·삭제 시 사용" {...form.register('password')} />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">이메일 (선택 — 답글 알림 수신)</Label>
        <Input id="email" type="email" placeholder="답글이 달리면 알려드립니다" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="content">내용 *</Label>
        <Textarea id="content" placeholder="댓글을 입력해주세요" rows={4} {...form.register('content')} />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>
      {form.formState.errors.root && (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? '등록 중...' : '댓글 등록'}
      </Button>
    </form>
  )
}
```

**`comment-item.tsx`** (순수 컴포넌트 + 삭제 다이얼로그)
- 댓글 작성자, 날짜, 내용 표시
- 소프트 삭제된 댓글은 "삭제된 댓글입니다" 표시 (대댓글은 유지)
- 삭제 버튼 클릭 → Dialog로 비밀번호 입력 → `deleteCommentAction` 호출
- 답글 버튼 클릭 → 인라인 `CommentForm` 토글 (parentId 세팅)

**`comment-list.tsx`** (순수 컴포넌트)
- `CommentWithReplies[]`를 받아 `CommentItem` 트리 렌더링
- 1단계 대댓글만 지원 (replies의 replies는 렌더링 안 함)

**`post-detail.tsx` 수정**
```tsx
// 현재: PostDetail 내부에 article만 있음
// 수정: CommentSection을 article 아래에 추가

import { CommentSection } from './comment-section'

// ...
return (
  <>
    <article className="mx-auto max-w-3xl px-4 py-8">
      {/* 기존 내용 */}
    </article>
    <CommentSection postId={post.id} postSlug={post.slug} />
  </>
)
```

> `PostDetail`은 현재 순수 Server Component이므로 `CommentSection`(Server Component) 직접 사용 가능.

---

### 7. 관리자 댓글 관리 페이지 [Medium]

**파일 구조**
```
src/app/admin/comments/
├── page.tsx                              ← 기존 플레이스홀더 교체
└── _components/
    ├── comment-table.tsx                 ← 댓글 목록 테이블
    └── _delete-comment/
        ├── index.tsx                     ← 삭제 다이얼로그
        └── _actions/
            └── delete-comment-action.ts  ← 관리자 강제 삭제 액션
```

**`page.tsx`** (Server Component)
```tsx
import { getAllCommentsForAdmin } from '@/db/queries/comments'
import { CommentTable } from './_components/comment-table'

export default async function AdminCommentsPage() {
  const { comments, total } = await getAllCommentsForAdmin()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">댓글 관리</h1>
      <p className="text-sm text-muted-foreground mb-4">전체 {total}개</p>
      <CommentTable comments={comments} />
    </div>
  )
}
```

**`comment-table.tsx`** (Client Component — 삭제 상태 관리)
- 컬럼: 작성자, 글 제목(링크), 내용(미리보기), 작성일, 삭제 여부, 삭제 버튼
- 삭제 버튼 → `_delete-comment` Dialog 호출

**`_delete-comment/_actions/delete-comment-action.ts`** (Server Action)
```ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { softDeleteComment } from '@/db/queries/comments'

type Result = { success: true } | { success: false; error: string }

export async function adminDeleteCommentAction(commentId: number): Promise<Result> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: '인증이 필요합니다' }

  try {
    await softDeleteComment(commentId)
    revalidatePath('/admin/comments')
    return { success: true }
  } catch {
    return { success: false, error: '삭제에 실패했습니다' }
  }
}
```

---

### 8. bcryptjs 패키지 확인 [High]

현재 `bcryptjs`가 설치되어 있는지 확인 후, 없으면 설치:
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## 변경 후 구조

```
src/
├── db/
│   ├── schema.ts                         ← email 컬럼 추가
│   └── queries/
│       └── comments.ts                   ← 4개 함수 추가
├── lib/
│   └── email.ts                          ← 신규 (Resend 래퍼)
├── types/
│   └── comment.ts                        ← email 필드 추가
└── app/
    ├── (main)/posts/[slug]/
    │   ├── page.tsx                      ← 변경 없음
    │   ├── _components/
    │   │   ├── post-detail.tsx           ← CommentSection 추가
    │   │   ├── comment-section.tsx       ← 신규
    │   │   ├── comment-list.tsx          ← 신규
    │   │   ├── comment-item.tsx          ← 신규
    │   │   └── comment-form.tsx          ← 신규
    │   └── _actions/
    │       ├── create-comment-action.ts  ← 신규
    │       └── delete-comment-action.ts  ← 신규
    └── admin/comments/
        ├── page.tsx                      ← 구현
        └── _components/
            ├── comment-table.tsx         ← 신규
            └── _delete-comment/
                ├── index.tsx             ← 신규
                └── _actions/
                    └── delete-comment-action.ts ← 신규
```

---

## 체크리스트

### 환경 설정
- [ ] `bcryptjs` 설치 확인 (`npm install bcryptjs @types/bcryptjs`)
- [ ] `resend` 설치 (`npm install resend`)
- [ ] `.env.local`에 `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` 추가

### DB
- [ ] `schema.ts` — `comments` 테이블에 `email text` 컬럼 추가
- [ ] `npx drizzle-kit push` 실행

### 타입
- [ ] `src/types/comment.ts` — `commentFormSchema`에 `email` 필드 추가

### 쿼리
- [ ] `createComment()` 추가
- [ ] `softDeleteComment()` 추가
- [ ] `getCommentById()` 추가
- [ ] `getAllCommentsForAdmin()` 추가

### 이메일
- [ ] `src/lib/email.ts` 생성

### 공개 댓글
- [ ] `create-comment-action.ts` 생성
- [ ] `delete-comment-action.ts` 생성
- [ ] `comment-section.tsx` 생성
- [ ] `comment-list.tsx` 생성
- [ ] `comment-item.tsx` 생성 (삭제 다이얼로그 포함)
- [ ] `comment-form.tsx` 생성
- [ ] `post-detail.tsx` — `CommentSection` 렌더링 추가

### 관리자
- [ ] `admin/comments/page.tsx` 구현
- [ ] `comment-table.tsx` 생성
- [ ] `_delete-comment/index.tsx` 생성
- [ ] `adminDeleteCommentAction` 생성
