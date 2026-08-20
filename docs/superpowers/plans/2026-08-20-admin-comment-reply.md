# 댓글 관리 인라인 답글 구현 계획 (어드민 리디자인 PR 3/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/comments`를 표에서 시안(3b)의 카드형으로 교체하고, 목록을 벗어나지 않고 바로 답글을 다는 관리자 답글 기능 — `comments.isAuthor` 컬럼, `addAdminReply` Server Action, 사이드바 "댓글 관리" 뱃지 연결 — 을 완성한다.

**Architecture:** 최상위 댓글을 페이지네이션 기준으로 삼고 각 댓글에 달린 답글을 함께 묶어 내려주는 스레드 구조로 `getAllCommentsForAdmin`을 재구성한다. 화면은 서버 컴포넌트 `page.tsx`가 스레드 목록을 내려주고, 순수 컴포넌트(`_components`)가 대댓글 한 건을 표현하며, 답글 열림 상태를 스스로 소유하는 클라이언트 컴포넌트(`_actions/comment-card.action.tsx`)가 카드 전체를 조립한다 — 독자 페이지 `CommentItemAction`과 동일한 "자기 상태를 스스로 갖는 아이템 컴포넌트" 패턴이다. 관리자 답글은 `addAdminReply` Server Action이 작성자명을 블로그 설정값으로, 비밀번호를 방문자가 알 수 없는 랜덤 해시로 고정해 `insertComment`에 `isAuthor: true`로 남긴다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui + radix-ui, Drizzle ORM(neon-http), react-hook-form + zod, Vitest + Testing Library

**Spec:** [2026-08-20-admin-cell-a-redesign-design.md](../specs/2026-08-20-admin-cell-a-redesign-design.md)

## Global Constraints

- Tailwind v4 문법만 쓴다 — CSS 변수는 `max-w-(--content-width)`, 그라디언트는 `bg-linear-to-*`, spacing 스케일의 4배수 px 임의값은 숫자 유틸리티(`max-w-[1180px]` → `max-w-295`). v3 문법은 경고 없이 컴파일되므로 린트가 잡아주지 않는다.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다.
- React hook·타입은 named import (`import { useState } from 'react'`). `React.useState`와 네임스페이스 import 금지.
- 색상 hex를 컴포넌트에 직접 쓰지 않는다. 상태 색은 PR 1이 정의한 `--status-published` / `--status-draft` / `--status-danger` 토큰의 Tailwind 유틸을 쓴다.
- CRUD 동사 컨벤션 — Server Action은 `add`/`get`/`edit`/`remove`, DB 쿼리는 `insert`/`select`/`update`/`delete`. 서비스 파일명은 동사+명사 kebab, 접미사 없음(`add-admin-reply.ts`).
- Server Action의 반환 타입은 항상 `{ success: true } | { success: false; error: string }` 유니언이다. 예외를 던지지 않고 `try/catch`로 감싸 값으로 반환한다 (기존 `addComment`/`editPostStatus`/`removeUnusedTags` 패턴).
- 조건부 클래스명은 템플릿 리터럴 대신 `cn()`을 쓴다 (`.claude/rules/component.md`).
- 날짜 포맷·연산은 date-fns를 쓴다. `toLocaleDateString` 등 네이티브 날짜 메서드 금지.
- `console.log`를 커밋하지 않는다.
- 폴더·파일 네이밍은 `.claude/rules/page-folder.md`를 따른다 — `_actions/*.action.tsx`, `_components/kebab-case.tsx`, `_services/kebab-case.ts`. 상태를 소유하는 컴포넌트는 `_components`가 아니라 `_actions`에 둔다.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 만든다. **단, DB 쿼리 함수(`src/db/queries/*.ts`)는 이 저장소에 mock 기반 단위 테스트 컨벤션이 없다** — PR 1·PR 2도 쿼리 함수 자체는 테스트하지 않고, 그 쿼리를 호출하는 Server Action 테스트에서 쿼리 모듈을 mock한다. 이 PR도 동일하게 따른다.
- 스키마 변경은 `npx drizzle-kit push`로 반영한다. 이 PR의 변경은 컬럼 추가 하나뿐이라 데이터 손실 위험이 없다.

## 이 PR의 범위 밖

아래는 후속 PR에서 다루거나, 스펙에서 명시적으로 제외했거나, 이 PR이 만지지 않는 기존 결함이다.

- 대시보드(2c)·방문 통계(3c)·유입경로(3e)·블로그 설정(3f) — PR 4
- 댓글 관리 페이지네이션 UI 추가 — 현재도 페이지네이션 컨트롤이 없다(`getAllCommentsForAdmin`이 `page`/`limit` 인자를 받지만 호출부는 항상 기본값). 이 PR은 페이지네이션 기준을 "댓글 20개"에서 "스레드 20개"로 바꿀 뿐, 컨트롤 UI를 새로 만들지 않는다.
- PR 1·PR 2 최종 리뷰에서 보류(parked)한 항목 — 브레드크럼 `key`, "블로그 보기" 링크 스타일, 뱃지 라우트 리터럴, `nav-links.tsx`와의 경로 매칭 중복, 미사용 `--sidebar-primary` 토큰, `save-post.ts`의 `publishedAt` 리셋 불일치. 이 PR이 해당 파일을 건드릴 일이 없다.
- `admin/settings/_services/edit-settings.ts`에 Clerk `auth()` 검사가 빠져 있는 기존 결함 — PR 4가 그 파일을 다룰 때 판단한다.
- Clerk `UserButton` 다크 팝오버 대응(`@clerk/themes`) — 범위 밖, 현재도 동일한 상태라 회귀 아님.

---

## 로드맵 — 어드민 리디자인 4개 PR

| 순서 | 브랜치 | plan 문서 | 상태 |
|---|---|---|---|
| 1 | `refactor/admin-shell-cell-a` | [2026-08-20-admin-shell-cell-a.md](./2026-08-20-admin-shell-cell-a.md) | 완료 (PR [#83](https://github.com/qlrogo91lp/yj-blog/pull/83) 머지) |
| 2 | `refactor/admin-content-screens` | [2026-08-20-admin-content-screens.md](./2026-08-20-admin-content-screens.md) | 완료 (PR [#84](https://github.com/qlrogo91lp/yj-blog/pull/84) 머지) |
| 3 | `feature/admin-comment-reply` | 이 문서 | 진행 예정 |
| 4 | `refactor/admin-stats-settings` | 미작성 | 대시보드·방문 통계·유입경로·블로그 설정 |

---

## 결정 사항

플랜 작성 중 확정한 판단이다. 실행 전에 이견이 있으면 여기부터 고친다.

### 관리자 답글의 작성자명은 `blogSettings.blogName`을 재사용한다

스펙은 "작성자명은 블로그 설정값으로 고정"이라고만 쓰여 있고, 「스키마 변경」표(스펙 106-114행)에는 `blog_settings`에 신규 컬럼을 추가하는 항목이 없다 — 즉 기존 필드 중 하나를 쓰라는 뜻이다. `blogSettings`에는 `blogName`(블로그 이름)·`tagline`·`authorBio`(자기소개문)·`siteUrl`·`socialLinks`·`defaultMetaDescription`뿐이고, 이 중 "필자 이름"에 해당하는 건 `blogName`이 유일하다. `authorBio`는 문장형 자기소개라 이름 자리에 넣기 부적절하다. 따라서 `getBlogSettings().blogName`을 관리자 답글의 `authorName`으로 쓴다. 설정값이 없으면(row가 아직 없는 경우) `'운영자'`로 fallback한다.

### 관리자 답글의 비밀번호는 `crypto.randomUUID()`를 해싱해 저장한다

방문자용 삭제/수정 경로(`(main)/posts/[slug]/_services/remove-comment.ts`)는 비밀번호 검증을 통과해야 동작한다. 관리자 답글에 방문자가 재현 가능한 비밀번호를 주면 방문자가 관리자 답글을 지울 수 있게 된다. `crypto.randomUUID()`로 아무도 알 수 없는 값을 만들어 `bcrypt.hash`하면, 관리자 답글의 삭제는 Clerk 인증만으로 동작하는 어드민 `remove-comment.ts` 경로로만 가능해진다 — 스펙이 요구하는 "본인 확인" 경계와 일치한다.

### Discord 알림은 건너뛰고, 이메일 알림은 기존 로직을 그대로 재사용한다

스펙 결정 그대로다. `addAdminReply`는 `sendCommentNotification`(Discord)을 아예 import하지 않는다. `sendReplyNotification`(이메일)은 부모 댓글에 `email`이 있을 때만 발송하는 `add-comment.ts`의 로직을 그대로 가져온다.

### `getAllCommentsForAdmin`을 스레드(최상위 + 답글) 구조로 재구성한다

기존 함수는 최상위 댓글과 대댓글을 구분 없이 한 목록에 평평하게 넣고 `createdAt` 역순으로 페이지네이션했다 — 대댓글이 부모와 다른 페이지에 놓일 수 있어 "이 댓글에 바로 답글을 단다"는 카드형 UI와 맞지 않는다. 최상위 댓글(`parentId IS NULL`)만 페이지네이션 기준으로 삼고, 그 페이지에 속한 최상위 댓글들의 답글을 전부 함께 조회해 각 카드에 묶어 반환하도록 바꾼다. `limit`의 의미가 "댓글 20개"에서 "스레드 20개"로 바뀌는 게 이 리팩터의 트레이드오프다(스레드에 답글이 여럿이면 화면에 그려지는 실제 댓글 수는 20보다 많아진다).

### 답변 대기 판정은 "대댓글 중 `isAuthor=true`가 하나도 없는 최상위 댓글"이다

스펙이 명시한 정의다("대댓글이 하나라도 있으면 답변 완료"로 근사하면 방문자끼리 주고받은 대댓글도 완료로 잡혀 부정확해진다). 소프트 삭제된 최상위 댓글은 애초에 답변 대상이 아니므로 판정에서 제외한다.

### 카드 컴포넌트는 `_components`가 아니라 `_actions`에서 상태를 직접 소유한다

댓글 카드는 "이 카드의 답글 폼이 열려 있는가"라는, 다른 카드에 영향을 주지 않는 로컬 상태가 필요하다. 독자 페이지의 `CommentItemAction`이 이미 같은 문제를 `_actions`에서 `useState`로 풀고 있으므로 그 패턴을 그대로 가져온다. 표시 전용인 대댓글 한 줄(`comment-reply-row.tsx`)만 `_components`에 남긴다 — `PostRow`(`_components`)가 `PostStatusToggleAction`(`_actions`)을 자식으로 그대로 렌더하는 PR 2의 선례와 같은 조합 방식이다.

### 어드민 삭제 다이얼로그를 컨트롤드에서 self-contained 트리거로 리팩터한다

기존 `admin/comments/_actions/delete-comment-dialog.action.tsx`는 `commentId: number | null`을 부모가 들고 있다가 넘겨주는 컨트롤드 패턴이다. 카드가 여러 개 독립적으로 존재하는 구조에서 이 패턴을 쓰려면 부모(리스트)가 "지금 어떤 댓글을 지우려는 중인지" 전역 상태를 들고 모든 카드와 결합돼야 한다. 독자 페이지의 `DeleteCommentDialogAction`(자신의 트리거 버튼 + `isOpen` 상태를 스스로 가짐)과 같은 self-contained 패턴으로 바꾸면 각 카드가 자신의 삭제 다이얼로그를 독립적으로 소유해 결합이 사라진다.

## 스키마 변경

`npx drizzle-kit push` 한 번으로 반영된다. 컬럼 추가 하나뿐이라 데이터 손실 위험이 없다.

| 테이블 | 컬럼 | 용도 |
|---|---|---|
| `comments` | `isAuthor` | 관리자 답글 구분. 독자 페이지 "작성자" 뱃지 + 어드민 "답변 대기" 판정에 쓰인다 |

---

## File Structure

**생성**

| 파일 | 책임 |
|---|---|
| `src/app/admin/comments/_services/add-admin-reply.ts` | 관리자 답글 Server Action |
| `src/app/admin/comments/_services/add-admin-reply.test.ts` | 인증·검증·알림 분기 검증 |
| `src/app/admin/comments/_actions/comment-reply-form.action.tsx` | 답글 입력 폼 (react-hook-form) |
| `src/app/admin/comments/_actions/comment-reply-form.action.test.tsx` | 폼 검증·제출·에러 검증 |
| `src/app/admin/comments/_actions/comment-card.action.tsx` | 댓글 카드 — 답글 토글 상태 소유, 뱃지·답글폼·삭제 다이얼로그 합성 |
| `src/app/admin/comments/_actions/comment-card.action.test.tsx` | 카드 렌더·뱃지·답글 토글 검증 |
| `src/app/admin/comments/_actions/delete-comment-dialog.action.test.tsx` | 트리거·삭제·에러 분기 검증 (기존 컴포넌트를 리팩터하며 신설) |
| `src/app/admin/comments/_components/comment-reply-row.tsx` | 대댓글 한 건 표시 (순수) |
| `src/app/admin/comments/_components/comment-reply-row.test.tsx` | 대댓글 렌더 검증 |
| `src/app/(main)/posts/[slug]/_actions/comment-item.action.test.tsx` | 작성자 뱃지 렌더 검증 (기존 컴포넌트에 신설) |

**수정**

| 파일 | 변경 |
|---|---|
| `src/db/schema.ts` | `comments.isAuthor` 컬럼 추가 |
| `src/db/queries/comments.ts` | `insertComment`에 `isAuthor` 파라미터, `getPendingReplyCount` 신규, `getAllCommentsForAdmin` 스레드 구조로 재작성 |
| `src/types/comment.ts` | `adminReplyFormSchema`/`AdminReplyFormValues`, `AdminCommentThread` 타입 추가 |
| `src/types/index.ts` | 위 신규 export 반영 |
| `src/app/admin/layout.tsx` | `getPendingReplyCount()` 호출 후 `AdminSidebarAction`에 주입 |
| `src/app/admin/comments/page.tsx` | 표 → 카드 리스트 |
| `src/app/admin/comments/loading.tsx` | 카드 스켈레톤 |
| `src/app/admin/comments/_actions/delete-comment-dialog.action.tsx` | 컨트롤드 → self-contained 트리거로 리팩터 |
| `src/app/(main)/posts/[slug]/_actions/comment-item.action.tsx` | `isAuthor`면 "작성자" 뱃지 렌더 |

**삭제**

| 파일 | 이유 |
|---|---|
| `src/app/admin/comments/_actions/comment-table.action.tsx` | 카드 리스트로 대체 |

---

## Task 1: `comments.isAuthor` 컬럼 + `insertComment` 확장 + 독자 페이지 작성자 뱃지

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/queries/comments.ts` (`insertComment`)
- Modify: `src/app/(main)/posts/[slug]/_actions/comment-item.action.tsx`
- Test: `src/app/(main)/posts/[slug]/_actions/comment-item.action.test.tsx` (신규)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `comments.isAuthor: boolean`, `notNull().default(false)` — `Comment` 타입(`InferSelectModel<typeof comments>`)에 자동 전파된다
  - `insertComment(data: { ...; isAuthor?: boolean })` — Task 3의 `addAdminReply`가 `isAuthor: true`로 호출한다
  - 독자 페이지 "작성자" 뱃지 렌더링

- [ ] **Step 1: 실패하는 컴포넌트 테스트 작성**

`src/app/(main)/posts/[slug]/_actions/comment-item.action.test.tsx` 신규 생성:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CommentWithReplies } from '@/types';
import { CommentItemAction } from './comment-item.action';

function makeComment(
  overrides: Partial<CommentWithReplies> = {}
): CommentWithReplies {
  return {
    id: 1,
    postId: 1,
    parentId: null,
    authorName: '홍길동',
    email: null,
    passwordHash: 'hash',
    content: '댓글 내용',
    isDeleted: false,
    isAuthor: false,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    replies: [],
    ...overrides,
  };
}

describe('CommentItemAction', () => {
  it('isAuthor가 true면 작성자 뱃지를 렌더한다', () => {
    render(
      <CommentItemAction
        comment={makeComment({ isAuthor: true })}
        postSlug="my-post"
      />
    );
    expect(screen.getByText('작성자')).toBeInTheDocument();
  });

  it('isAuthor가 false면 작성자 뱃지를 렌더하지 않는다', () => {
    render(
      <CommentItemAction
        comment={makeComment({ isAuthor: false })}
        postSlug="my-post"
      />
    );
    expect(screen.queryByText('작성자')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/\(main\)/posts/\[slug\]/_actions/comment-item.action.test.tsx
```

기대: "작성자" 텍스트를 찾지 못해 FAIL (뱃지 렌더링이 아직 없다).

- [ ] **Step 3: 스키마에 컬럼 추가**

`src/db/schema.ts:103` (`isDeleted` 다음 줄)에 추가:

```ts
  isAuthor: boolean('is_author').notNull().default(false), // 관리자 답글 여부 — 독자 페이지 "작성자" 뱃지 + 사이드바 답변 대기 판정에 사용
```

- [ ] **Step 4: DB에 반영**

```bash
npx drizzle-kit push
```

기대: 컬럼 추가만 감지됨(데이터 손실 경고 없음).

- [ ] **Step 5: `insertComment` 확장**

`src/db/queries/comments.ts`의 `insertComment` 시그니처와 `values`를 수정:

```ts
export async function insertComment(data: {
  postId: number;
  parentId?: number | null;
  authorName: string;
  email?: string | null;
  passwordHash: string;
  content: string;
  isAuthor?: boolean;
}): Promise<Comment> {
  const result = await db
    .insert(comments)
    .values({
      postId: data.postId,
      parentId: data.parentId ?? null,
      authorName: data.authorName,
      email: data.email ?? null,
      passwordHash: data.passwordHash,
      content: data.content,
      isAuthor: data.isAuthor ?? false,
    })
    .returning();

  return result[0];
}
```

- [ ] **Step 6: 독자 페이지에 뱃지 추가**

`src/app/(main)/posts/[slug]/_actions/comment-item.action.tsx`에 `Badge` import 추가하고, 작성자명 옆에 조건부 렌더:

```tsx
import { Badge } from '@/components/ui/badge';
```

```tsx
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold">{comment.authorName}</span>
        {comment.isAuthor && (
          <Badge variant="secondary" className="text-xs">
            작성자
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
```

- [ ] **Step 7: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/\(main\)/posts/\[slug\]/_actions/comment-item.action.test.tsx
```

기대: 2개 테스트 모두 PASS.

- [ ] **Step 8: 커밋**

```bash
git add src/db/schema.ts src/db/queries/comments.ts \
  "src/app/(main)/posts/[slug]/_actions/comment-item.action.tsx" \
  "src/app/(main)/posts/[slug]/_actions/comment-item.action.test.tsx"
git commit -m "✨ feat: comments.isAuthor 컬럼과 독자 페이지 작성자 뱃지 추가"
```

---

## Task 2: `getPendingReplyCount` 쿼리 + 사이드바 뱃지 연결

**Files:**
- Modify: `src/db/queries/comments.ts` (`getPendingReplyCount` 신규)
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: Task 1의 `comments.isAuthor`
- Produces: `getPendingReplyCount(): Promise<number>` — `admin/layout.tsx`가 매 어드민 페이지 로드마다 호출해 `AdminSidebarAction`의 `pendingReplyCount` prop(PR 1이 이미 만든 뱃지 슬롯)을 채운다

이 태스크는 DB 쿼리 함수 추가라 「Global Constraints」에 적은 대로 전용 단위 테스트를 만들지 않는다. `npx tsc --noEmit`로 타입 정합성만 확인하고, 실제 개수 표시는 Task 9의 브라우저 육안 확인에서 검증한다.

- [ ] **Step 1: `getPendingReplyCount` 구현**

`src/db/queries/comments.ts` 상단 import에 `and`, `isNull`, `notExists`를 추가하고 `drizzle-orm/pg-core`에서 `alias`를 가져온다:

```ts
import { unstable_cache } from 'next/cache';
import { and, count, desc, eq, isNull, notExists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { comments, posts } from '@/db/schema';
import type { Comment, CommentWithReplies } from '@/types';
```

파일 하단에 추가:

```ts
const replyComments = alias(comments, 'reply_comments');

/**
 * 답변 대기 중인 최상위 댓글 수 — 대댓글 중 관리자 답글(isAuthor=true)이
 * 하나도 없는, 삭제되지 않은 최상위 댓글의 개수. 사이드바 뱃지에 쓰인다.
 */
export async function getPendingReplyCount(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(comments)
    .where(
      and(
        isNull(comments.parentId),
        eq(comments.isDeleted, false),
        notExists(
          db
            .select({ id: replyComments.id })
            .from(replyComments)
            .where(
              and(
                eq(replyComments.parentId, comments.id),
                eq(replyComments.isAuthor, true)
              )
            )
        )
      )
    );

  return result[0].value;
}
```

- [ ] **Step 2: 사이드바에 값 주입**

`src/app/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeaderAction } from './_actions/admin-header.action';
import { AdminSidebarAction } from './_actions/admin-sidebar.action';
import { AdminMainContainerHandler } from './_handlers/admin-main-container.handler';
import { getPendingReplyCount } from '@/db/queries/comments';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const pendingReplyCount = await getPendingReplyCount();

  return (
    <SidebarProvider>
      <AdminSidebarAction pendingReplyCount={pendingReplyCount} />
      <SidebarInset>
        <AdminHeaderAction />
        <main className="flex-1 px-8 py-8">
          <AdminMainContainerHandler>{children}</AdminMainContainerHandler>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/db/queries/comments.ts src/app/admin/layout.tsx
git commit -m "✨ feat: 답변 대기 댓글 수를 사이드바 뱃지에 연결"
```

---

## Task 3: 관리자 답글 Zod 스키마 + `addAdminReply` Server Action

**Files:**
- Modify: `src/types/comment.ts`
- Modify: `src/types/index.ts`
- Create: `src/app/admin/comments/_services/add-admin-reply.ts`
- Test: `src/app/admin/comments/_services/add-admin-reply.test.ts`

**Interfaces:**
- Consumes: Task 1의 `insertComment({ ...; isAuthor })`, 기존 `selectCommentById`(`@/db/queries/comments`), `selectPostBySlug`(`@/db/queries/posts`), `getBlogSettings`(`@/db/queries/settings`), `sendReplyNotification`(`@/lib/email`)
- Produces:
  - `adminReplyFormSchema`(zod, `{ content: string }`), `AdminReplyFormValues`
  - `addAdminReply(postId: number, postSlug: string, parentId: number, formData: unknown): Promise<{ success: true } | { success: false; error: string }>` — Task 6의 답글 폼이 호출한다

- [ ] **Step 1: zod 스키마 추가**

`src/types/comment.ts`의 `commentPasswordSchema`/`CommentPasswordValues` 아래에 추가:

```ts
// 관리자 답글 폼 스키마 — 작성자명·비밀번호는 서버에서 고정하므로 content만 받는다
export const adminReplyFormSchema = z.object({
  content: z
    .string()
    .min(1, '답글을 입력해주세요')
    .max(2000, '답글은 2000자 이하여야 합니다'),
});

export type AdminReplyFormValues = z.infer<typeof adminReplyFormSchema>;
```

- [ ] **Step 2: `src/types/index.ts`에 재export 추가**

```ts
export type {
  Comment,
  CommentWithReplies,
  CommentFormValues,
  CommentPasswordValues,
  AdminReplyFormValues,
} from './comment';
export { commentFormSchema, commentPasswordSchema, adminReplyFormSchema } from './comment';
```

- [ ] **Step 3: 실패하는 Server Action 테스트 작성**

`src/app/admin/comments/_services/add-admin-reply.test.ts` 신규 생성:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAdminReply } from './add-admin-reply';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const insertCommentMock = vi.fn(async () => ({ id: 1 }));
const selectCommentByIdMock = vi.fn(
  async () => null as { email: string | null } | null
);
vi.mock('@/db/queries/comments', () => ({
  insertComment: (...args: unknown[]) => insertCommentMock(...args),
  selectCommentById: (...args: unknown[]) => selectCommentByIdMock(...args),
}));

const selectPostBySlugMock = vi.fn(async () => ({ id: 1, title: '테스트 글' }));
vi.mock('@/db/queries/posts', () => ({
  selectPostBySlug: (...args: unknown[]) => selectPostBySlugMock(...args),
}));

const getBlogSettingsMock = vi.fn(async () => ({ blogName: '운영자블로그' }));
vi.mock('@/db/queries/settings', () => ({
  getBlogSettings: () => getBlogSettingsMock(),
}));

const sendReplyNotificationMock = vi.fn(async () => {});
vi.mock('@/lib/email', () => ({
  sendReplyNotification: (...args: unknown[]) => sendReplyNotificationMock(...args),
}));

describe('addAdminReply', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    insertCommentMock.mockClear();
    selectCommentByIdMock.mockReset();
    selectCommentByIdMock.mockResolvedValue(null);
    selectPostBySlugMock.mockClear();
    getBlogSettingsMock.mockClear();
    sendReplyNotificationMock.mockClear();
  });

  it('로그인하지 않았으면 실패하고 댓글을 남기지 않는다', async () => {
    authState.userId = null;
    const result = await addAdminReply(1, 'my-post', 10, { content: '답글' });
    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(insertCommentMock).not.toHaveBeenCalled();
  });

  it('내용이 비어있으면 실패한다', async () => {
    const result = await addAdminReply(1, 'my-post', 10, { content: '' });
    expect(result.success).toBe(false);
    expect(insertCommentMock).not.toHaveBeenCalled();
  });

  it('성공하면 블로그 이름을 작성자명으로, isAuthor=true로 댓글을 남긴다', async () => {
    const result = await addAdminReply(1, 'my-post', 10, {
      content: '답글입니다',
    });
    expect(result).toEqual({ success: true });
    expect(insertCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 1,
        parentId: 10,
        authorName: '운영자블로그',
        content: '답글입니다',
        isAuthor: true,
      })
    );
  });

  it('블로그 설정이 없으면 작성자명을 "운영자"로 대체한다', async () => {
    getBlogSettingsMock.mockResolvedValue(undefined);
    await addAdminReply(1, 'my-post', 10, { content: '답글입니다' });
    expect(insertCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: '운영자' })
    );
  });

  it('부모 댓글에 이메일이 있으면 답글 알림 이메일을 보낸다', async () => {
    selectCommentByIdMock.mockResolvedValue({ email: 'parent@example.com' });
    await addAdminReply(1, 'my-post', 10, { content: '답글입니다' });
    expect(sendReplyNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'parent@example.com' })
    );
  });

  it('부모 댓글에 이메일이 없으면 알림을 보내지 않는다', async () => {
    selectCommentByIdMock.mockResolvedValue({ email: null });
    await addAdminReply(1, 'my-post', 10, { content: '답글입니다' });
    expect(sendReplyNotificationMock).not.toHaveBeenCalled();
  });

  it('DB 저장 중 예외가 발생하면 실패를 반환한다', async () => {
    insertCommentMock.mockRejectedValueOnce(new Error('db error'));
    const result = await addAdminReply(1, 'my-post', 10, {
      content: '답글입니다',
    });
    expect(result).toEqual({ success: false, error: '답글 작성에 실패했습니다' });
  });
});
```

- [ ] **Step 4: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/comments/_services/add-admin-reply.test.ts
```

기대: `./add-admin-reply` 모듈이 없어 FAIL.

- [ ] **Step 5: `add-admin-reply.ts` 구현**

```ts
'use server';

import crypto from 'crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { insertComment, selectCommentById } from '@/db/queries/comments';
import { selectPostBySlug } from '@/db/queries/posts';
import { getBlogSettings } from '@/db/queries/settings';
import { sendReplyNotification } from '@/lib/email';
import { adminReplyFormSchema } from '@/types/comment';

type Result = { success: true } | { success: false; error: string };

export async function addAdminReply(
  postId: number,
  postSlug: string,
  parentId: number,
  formData: unknown
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const parsed = adminReplyFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const settings = await getBlogSettings();
    const authorName = settings?.blogName ?? '운영자';
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

    await insertComment({
      postId,
      parentId,
      authorName,
      email: null,
      passwordHash,
      content: parsed.data.content,
      isAuthor: true,
    });

    const [post, parent] = await Promise.all([
      selectPostBySlug(postSlug),
      selectCommentById(parentId),
    ]);

    if (post && parent?.email) {
      await sendReplyNotification({
        to: parent.email,
        postTitle: post.title,
        postSlug,
        authorName,
        replyContent: parsed.data.content,
      }).catch(() => {});
    }

    // 관리자 답글에는 Discord 알림(sendCommentNotification)을 태우지 않는다 — 본인 답글까지 울리면 소음이다
    revalidateTag(CACHE_TAGS.comments, 'max');
    revalidatePath(`/posts/${postSlug}`);
    revalidatePath('/admin/comments');
    return { success: true };
  } catch {
    return { success: false, error: '답글 작성에 실패했습니다' };
  }
}
```

- [ ] **Step 6: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/comments/_services/add-admin-reply.test.ts
```

기대: 7개 테스트 모두 PASS.

- [ ] **Step 7: 커밋**

```bash
git add src/types/comment.ts src/types/index.ts \
  src/app/admin/comments/_services/add-admin-reply.ts \
  src/app/admin/comments/_services/add-admin-reply.test.ts
git commit -m "✨ feat: 관리자 댓글 답글 Server Action 추가"
```

---

## Task 4: `getAllCommentsForAdmin` 스레드 구조 재구성

**Files:**
- Modify: `src/db/queries/comments.ts` (`getAllCommentsForAdmin`)
- Modify: `src/types/comment.ts` (`AdminCommentThread`)
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: Task 1의 `comments.isAuthor` (반환 데이터에 자동 포함)
- Produces:
  - `AdminCommentThread = Comment & { postTitle: string; postSlug: string; replies: Comment[] }`
  - `getAllCommentsForAdmin(page?: number, limit?: number): Promise<{ comments: AdminCommentThread[]; total: number }>` — Task 7의 카드 컴포넌트, Task 8의 `page.tsx`가 소비한다

DB 쿼리 재작성이라 「Global Constraints」에 따라 전용 단위 테스트는 만들지 않는다.

- [ ] **Step 1: `AdminCommentThread` 타입 추가**

`src/types/comment.ts`의 `CommentWithReplies` 타입 정의 바로 아래에 추가:

```ts
export type AdminCommentThread = Comment & {
  postTitle: string;
  postSlug: string;
  replies: Comment[];
};
```

- [ ] **Step 2: `src/types/index.ts`에 재export 추가**

```ts
export type {
  Comment,
  CommentWithReplies,
  AdminCommentThread,
  CommentFormValues,
  CommentPasswordValues,
  AdminReplyFormValues,
} from './comment';
```

- [ ] **Step 3: `getAllCommentsForAdmin` 재작성**

`src/db/queries/comments.ts` 상단 import에 `inArray`, `isNull` 추가(이미 Task 2에서 `isNull`은 추가했다면 `inArray`만 추가):

```ts
import { and, count, desc, eq, inArray, isNull, notExists } from 'drizzle-orm';
```

기존 `getAllCommentsForAdmin` 전체를 아래로 교체:

```ts
/**
 * 관리자용 댓글 스레드 조회 — 최상위 댓글을 페이지네이션 기준으로 삼고,
 * 그 안에 속한 답글을 전부 함께 반환한다 (post title/slug 포함)
 */
export const getAllCommentsForAdmin = unstable_cache(
  async (
    page = 1,
    limit = 20
  ): Promise<{ comments: AdminCommentThread[]; total: number }> => {
    const offset = (page - 1) * limit;

    const [topLevelRows, totalResult] = await Promise.all([
      db
        .select({
          comment: comments,
          postTitle: posts.title,
          postSlug: posts.slug,
        })
        .from(comments)
        .innerJoin(posts, eq(comments.postId, posts.id))
        .where(isNull(comments.parentId))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(comments)
        .where(isNull(comments.parentId)),
    ]);

    const topLevelIds = topLevelRows.map(({ comment }) => comment.id);
    const replyRows =
      topLevelIds.length > 0
        ? await db
            .select()
            .from(comments)
            .where(inArray(comments.parentId, topLevelIds))
            .orderBy(comments.createdAt)
        : [];

    const repliesByParent = new Map<number, Comment[]>();
    for (const reply of replyRows) {
      const list = repliesByParent.get(reply.parentId!) ?? [];
      list.push(reply);
      repliesByParent.set(reply.parentId!, list);
    }

    return {
      comments: topLevelRows.map(({ comment, postTitle, postSlug }) => ({
        ...comment,
        postTitle,
        postSlug,
        replies: repliesByParent.get(comment.id) ?? [],
      })),
      total: totalResult[0].total,
    };
  },
  ['admin-comments-list'],
  { tags: [CACHE_TAGS.comments] }
);
```

> `AdminCommentThread`를 쓰려면 파일 상단 타입 import에 추가한다: `import type { AdminCommentThread, Comment, CommentWithReplies } from '@/types';`

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건. (기존 `comment-table.action.tsx`가 이 함수를 계속 쓰지만 구조적으로 호환되므로 컴파일은 통과한다 — 실제 화면 반영은 Task 8에서 끝난다.)

- [ ] **Step 5: 커밋**

```bash
git add src/db/queries/comments.ts src/types/comment.ts src/types/index.ts
git commit -m "♻️ refactor: 어드민 댓글 목록을 스레드 구조로 재구성"
```

---

## Task 5: 어드민 삭제 다이얼로그를 self-contained 트리거로 리팩터

**Files:**
- Modify: `src/app/admin/comments/_actions/delete-comment-dialog.action.tsx`
- Test: `src/app/admin/comments/_actions/delete-comment-dialog.action.test.tsx` (신규)

**Interfaces:**
- Consumes: 기존 `removeComment(commentId: number)`(`../_services/remove-comment`)
- Produces: `DeleteCommentDialogAction({ commentId: number })` — 자신의 트리거 버튼과 `isOpen` 상태를 스스로 가진다. Task 7의 카드 컴포넌트가 각 댓글/답글마다 하나씩 렌더한다

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/comments/_actions/delete-comment-dialog.action.test.tsx` 신규 생성:

```tsx
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeComment } from '../_services/remove-comment';
import { DeleteCommentDialogAction } from './delete-comment-dialog.action';

vi.mock('../_services/remove-comment', () => ({
  removeComment: vi.fn(),
}));

describe('DeleteCommentDialogAction', () => {
  beforeEach(() => {
    vi.mocked(removeComment).mockReset();
  });

  it('삭제 버튼을 누르면 확인 다이얼로그가 뜬다', () => {
    render(<DeleteCommentDialogAction commentId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('삭제를 확정하면 removeComment(commentId)를 호출하고 다이얼로그를 닫는다', async () => {
    vi.mocked(removeComment).mockResolvedValue({ success: true });
    render(<DeleteCommentDialogAction commentId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(removeComment).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('실패하면 다이얼로그 안에 에러 메시지를 보여준다', async () => {
    vi.mocked(removeComment).mockResolvedValue({
      success: false,
      error: '삭제 실패',
    });
    render(<DeleteCommentDialogAction commentId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('삭제 실패')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/comments/_actions/delete-comment-dialog.action.test.tsx
```

기대: 현재 컴포넌트가 `commentId: number | null` + `onClose`를 요구해 트리거 버튼이 없으므로 FAIL.

- [ ] **Step 3: self-contained 트리거로 재작성**

`src/app/admin/comments/_actions/delete-comment-dialog.action.tsx` 전체 교체:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { removeComment } from '../_services/remove-comment';

type Props = {
  commentId: number;
};

export function DeleteCommentDialogAction({ commentId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await removeComment(commentId);
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive h-7 px-2 text-xs"
        >
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>댓글 삭제</DialogTitle>
          <DialogDescription>
            이 댓글을 삭제하시겠습니까? 삭제된 댓글은 &quot;삭제된
            댓글입니다&quot;로 표시됩니다.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/comments/_actions/delete-comment-dialog.action.test.tsx
```

기대: 3개 테스트 모두 PASS.

> `comment-table.action.tsx`가 옛 시그니처(`commentId`/`onClose`)로 이 컴포넌트를 계속 쓰고 있어 이 시점엔 `npx tsc --noEmit`에서 타입 에러가 난다. Task 8에서 `comment-table.action.tsx`를 삭제하며 해소된다 — 예상된 중간 상태다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/comments/_actions/delete-comment-dialog.action.tsx \
  src/app/admin/comments/_actions/delete-comment-dialog.action.test.tsx
git commit -m "♻️ refactor: 어드민 삭제 다이얼로그를 self-contained 트리거로 변경"
```

---

## Task 6: 관리자 답글 폼

**Files:**
- Create: `src/app/admin/comments/_actions/comment-reply-form.action.tsx`
- Test: `src/app/admin/comments/_actions/comment-reply-form.action.test.tsx`

**Interfaces:**
- Consumes: Task 3의 `addAdminReply`, `adminReplyFormSchema`, `AdminReplyFormValues`
- Produces: `CommentReplyFormAction({ postId, postSlug, parentId, onSuccess })` — Task 7의 카드 컴포넌트가 답글 열림 상태일 때 렌더한다

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/comments/_actions/comment-reply-form.action.test.tsx` 신규 생성:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAdminReply } from '../_services/add-admin-reply';
import { CommentReplyFormAction } from './comment-reply-form.action';

vi.mock('../_services/add-admin-reply', () => ({
  addAdminReply: vi.fn(),
}));

describe('CommentReplyFormAction', () => {
  beforeEach(() => {
    vi.mocked(addAdminReply).mockReset();
  });

  it('내용을 비우고 제출하면 검증 에러를 보여주고 액션을 호출하지 않는다', async () => {
    render(
      <CommentReplyFormAction
        postId={1}
        postSlug="p"
        parentId={2}
        onSuccess={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));

    expect(await screen.findByText('답글을 입력해주세요')).toBeInTheDocument();
    expect(addAdminReply).not.toHaveBeenCalled();
  });

  it('성공하면 addAdminReply를 호출하고 onSuccess를 부른다', async () => {
    vi.mocked(addAdminReply).mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    render(
      <CommentReplyFormAction
        postId={1}
        postSlug="p"
        parentId={2}
        onSuccess={onSuccess}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('답글을 입력하세요'), {
      target: { value: '답글 내용' },
    });
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));

    await waitFor(() =>
      expect(addAdminReply).toHaveBeenCalledWith(1, 'p', 2, {
        content: '답글 내용',
      })
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('실패하면 폼 안에 에러 메시지를 보여준다', async () => {
    vi.mocked(addAdminReply).mockResolvedValue({
      success: false,
      error: '실패했습니다',
    });
    render(
      <CommentReplyFormAction
        postId={1}
        postSlug="p"
        parentId={2}
        onSuccess={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('답글을 입력하세요'), {
      target: { value: '답글 내용' },
    });
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));

    expect(await screen.findByText('실패했습니다')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/comments/_actions/comment-reply-form.action.test.tsx
```

기대: `./comment-reply-form.action` 모듈이 없어 FAIL.

- [ ] **Step 3: 구현**

```tsx
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
```

- [ ] **Step 4: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/comments/_actions/comment-reply-form.action.test.tsx
```

기대: 3개 테스트 모두 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/comments/_actions/comment-reply-form.action.tsx \
  src/app/admin/comments/_actions/comment-reply-form.action.test.tsx
git commit -m "✨ feat: 관리자 답글 폼 추가"
```

---

## Task 7: 대댓글 행 + 댓글 카드

**Files:**
- Create: `src/app/admin/comments/_components/comment-reply-row.tsx`
- Test: `src/app/admin/comments/_components/comment-reply-row.test.tsx`
- Create: `src/app/admin/comments/_actions/comment-card.action.tsx`
- Test: `src/app/admin/comments/_actions/comment-card.action.test.tsx`

**Interfaces:**
- Consumes: Task 4의 `AdminCommentThread`, Task 5의 `DeleteCommentDialogAction`, Task 6의 `CommentReplyFormAction`
- Produces: `CommentReplyRow({ reply: Comment })`(순수), `CommentCardAction({ thread: AdminCommentThread })` — Task 8의 `page.tsx`가 스레드 배열을 map으로 렌더한다

- [ ] **Step 1: 대댓글 행 — 실패하는 테스트 작성**

`src/app/admin/comments/_components/comment-reply-row.test.tsx` 신규 생성:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Comment } from '@/types';
import { CommentReplyRow } from './comment-reply-row';

vi.mock('../_actions/delete-comment-dialog.action', () => ({
  DeleteCommentDialogAction: ({ commentId }: { commentId: number }) => (
    <button>삭제-{commentId}</button>
  ),
}));

function makeReply(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 2,
    postId: 1,
    parentId: 1,
    authorName: '운영자블로그',
    email: null,
    passwordHash: 'hash',
    content: '답글 내용',
    isDeleted: false,
    isAuthor: true,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    ...overrides,
  };
}

describe('CommentReplyRow', () => {
  it('isAuthor면 작성자 뱃지와 내용을 렌더한다', () => {
    render(<CommentReplyRow reply={makeReply()} />);
    expect(screen.getByText('작성자')).toBeInTheDocument();
    expect(screen.getByText('답글 내용')).toBeInTheDocument();
    expect(screen.getByText('삭제-2')).toBeInTheDocument();
  });

  it('삭제된 답글이면 안내 문구만 보여주고 삭제 버튼을 숨긴다', () => {
    render(<CommentReplyRow reply={makeReply({ isDeleted: true })} />);
    expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument();
    expect(screen.queryByText('답글 내용')).not.toBeInTheDocument();
    expect(screen.queryByText('삭제-2')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/comments/_components/comment-reply-row.test.tsx
```

기대: `./comment-reply-row` 모듈이 없어 FAIL.

- [ ] **Step 3: 대댓글 행 구현**

```tsx
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { Comment } from '@/types';
import { DeleteCommentDialogAction } from '../_actions/delete-comment-dialog.action';

type Props = {
  reply: Comment;
};

export function CommentReplyRow({ reply }: Props) {
  if (reply.isDeleted) {
    return (
      <div className="border-border mt-3 ml-6 border-l pl-4">
        <p className="text-muted-foreground text-sm italic">
          삭제된 댓글입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border mt-3 ml-6 border-l pl-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-semibold">{reply.authorName}</span>
        {reply.isAuthor && (
          <Badge variant="secondary" className="text-xs">
            작성자
          </Badge>
        )}
        <span className="text-muted-foreground text-xs">
          {format(new Date(reply.createdAt), 'yyyy.M.d HH:mm', {
            locale: ko,
          })}
        </span>
      </div>
      <p className="mb-2 text-sm whitespace-pre-wrap">{reply.content}</p>
      <DeleteCommentDialogAction commentId={reply.id} />
    </div>
  );
}
```

- [ ] **Step 4: 대댓글 행 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/comments/_components/comment-reply-row.test.tsx
```

기대: 2개 테스트 모두 PASS.

- [ ] **Step 5: 댓글 카드 — 실패하는 테스트 작성**

`src/app/admin/comments/_actions/comment-card.action.test.tsx` 신규 생성:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminCommentThread, Comment } from '@/types';
import { CommentCardAction } from './comment-card.action';

vi.mock('./comment-reply-form.action', () => ({
  CommentReplyFormAction: () => <div data-testid="reply-form" />,
}));
vi.mock('./delete-comment-dialog.action', () => ({
  DeleteCommentDialogAction: ({ commentId }: { commentId: number }) => (
    <button>삭제-{commentId}</button>
  ),
}));
vi.mock('../_components/comment-reply-row', () => ({
  CommentReplyRow: ({ reply }: { reply: Comment }) => (
    <div data-testid={`reply-${reply.id}`}>{reply.content}</div>
  ),
}));

function makeThread(
  overrides: Partial<AdminCommentThread> = {}
): AdminCommentThread {
  return {
    id: 1,
    postId: 10,
    parentId: null,
    authorName: '홍길동',
    email: null,
    passwordHash: 'hash',
    content: '댓글 내용',
    isDeleted: false,
    isAuthor: false,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    postTitle: '테스트 글',
    postSlug: 'test-post',
    replies: [],
    ...overrides,
  };
}

function makeReply(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 2,
    postId: 10,
    parentId: 1,
    authorName: '운영자',
    email: null,
    passwordHash: 'hash',
    content: '답글',
    isDeleted: false,
    isAuthor: true,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    ...overrides,
  };
}

describe('CommentCardAction', () => {
  it('답변이 없으면 답변 대기 뱃지를 보여준다', () => {
    render(<CommentCardAction thread={makeThread()} />);
    expect(screen.getByText('답변 대기')).toBeInTheDocument();
  });

  it('관리자 답글이 있으면 답변 완료 뱃지를 보여준다', () => {
    render(
      <CommentCardAction thread={makeThread({ replies: [makeReply()] })} />
    );
    expect(screen.getByText('답변 완료')).toBeInTheDocument();
  });

  it('답글 버튼을 누르면 답글 폼이 열리고 다시 누르면 닫힌다', () => {
    render(<CommentCardAction thread={makeThread()} />);
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '답글' }));
    expect(screen.getByTestId('reply-form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();
  });

  it('삭제된 댓글이면 내용 대신 안내 문구를 보여주고 답글 버튼을 숨긴다', () => {
    render(<CommentCardAction thread={makeThread({ isDeleted: true })} />);
    expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument();
    expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '답글' })).not.toBeInTheDocument();
  });

  it('답글 목록을 렌더한다', () => {
    render(
      <CommentCardAction
        thread={makeThread({ replies: [makeReply({ id: 3 })] })}
      />
    );
    expect(screen.getByTestId('reply-3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/comments/_actions/comment-card.action.test.tsx
```

기대: `./comment-card.action` 모듈이 없어 FAIL.

- [ ] **Step 7: 댓글 카드 구현**

```tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminCommentThread } from '@/types';
import { CommentReplyRow } from '../_components/comment-reply-row';
import { CommentReplyFormAction } from './comment-reply-form.action';
import { DeleteCommentDialogAction } from './delete-comment-dialog.action';

type Props = {
  thread: AdminCommentThread;
};

export function CommentCardAction({ thread }: Props) {
  const [isReplying, setIsReplying] = useState(false);
  const hasAdminReply = thread.replies.some((reply) => reply.isAuthor);

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <a
          href={`/posts/${thread.postSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm hover:underline"
        >
          {thread.postTitle}
        </a>
        {!thread.isDeleted &&
          (hasAdminReply ? (
            <Badge variant="secondary">답변 완료</Badge>
          ) : (
            <Badge variant="outline">답변 대기</Badge>
          ))}
      </div>

      {thread.isDeleted ? (
        <p className="text-muted-foreground text-sm italic">
          삭제된 댓글입니다.
        </p>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold">{thread.authorName}</span>
            {thread.isAuthor && (
              <Badge variant="secondary" className="text-xs">
                작성자
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {format(new Date(thread.createdAt), 'yyyy.M.d HH:mm', {
                locale: ko,
              })}
            </span>
          </div>
          <p className="mb-2 text-sm whitespace-pre-wrap">{thread.content}</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setIsReplying((prev) => !prev)}
            >
              {isReplying ? '취소' : '답글'}
            </Button>
            <DeleteCommentDialogAction commentId={thread.id} />
          </div>
          {isReplying && (
            <div className="mt-3 ml-6">
              <CommentReplyFormAction
                postId={thread.postId}
                postSlug={thread.postSlug}
                parentId={thread.id}
                onSuccess={() => setIsReplying(false)}
              />
            </div>
          )}
        </>
      )}

      {thread.replies.map((reply) => (
        <CommentReplyRow key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
```

> 뱃지·간격의 정확한 색·여백은 시안 3b 이미지와 나란히 놓고 미세 조정한다 — 위 값은 기존 카드류(`category-card.tsx`, `tag-chip.tsx`)와 톤을 맞춘 출발점이다.

- [ ] **Step 8: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/comments/_actions/comment-card.action.test.tsx
```

기대: 5개 테스트 모두 PASS.

- [ ] **Step 9: 커밋**

```bash
git add src/app/admin/comments/_components/comment-reply-row.tsx \
  src/app/admin/comments/_components/comment-reply-row.test.tsx \
  src/app/admin/comments/_actions/comment-card.action.tsx \
  src/app/admin/comments/_actions/comment-card.action.test.tsx
git commit -m "✨ feat: 댓글 카드와 대댓글 행 컴포넌트 추가"
```

---

## Task 8: `admin/comments` 화면 재조립 + 구 테이블 제거

**Files:**
- Modify: `src/app/admin/comments/page.tsx`
- Modify: `src/app/admin/comments/loading.tsx`
- Delete: `src/app/admin/comments/_actions/comment-table.action.tsx`

**Interfaces:**
- Consumes: Task 4의 `getAllCommentsForAdmin`, Task 7의 `CommentCardAction`
- Produces: 없음 (화면 조립 전용)

- [ ] **Step 1: 남은 사용처 확인**

```bash
grep -rn "CommentTableAction" src/
```

기대: `page.tsx`와 `comment-table.action.tsx` 자신에서만 나온다.

- [ ] **Step 2: `page.tsx` 재조립**

```tsx
import { getAllCommentsForAdmin } from '@/db/queries/comments';
import { CommentCardAction } from './_actions/comment-card.action';

export default async function AdminCommentsPage() {
  const { comments, total } = await getAllCommentsForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">댓글 관리</h1>
      <p className="text-muted-foreground mb-4 text-sm">전체 {total}개</p>
      {comments.length === 0 ? (
        <p className="text-muted-foreground">댓글이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((thread) => (
            <CommentCardAction key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 스켈레톤을 카드 레이아웃에 맞춰 교체**

`src/app/admin/comments/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCommentsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <Skeleton className="mb-3 h-4 w-40" />
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 구 테이블 컴포넌트 삭제**

```bash
git rm src/app/admin/comments/_actions/comment-table.action.tsx
```

- [ ] **Step 5: 전체 검증**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 전부 PASS, tsc 신규 에러 0건. Task 5에서 예상했던 `comment-table.action.tsx`발 타입 에러가 이 삭제로 해소된다.

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/comments/page.tsx src/app/admin/comments/loading.tsx
git commit -m "♻️ refactor: 댓글 관리 화면을 카드형으로 교체"
```

---

## Task 9: 검증

**Files:** 없음 (검증 전용)

**Interfaces:**
- Consumes: Task 1~8 전부
- Produces: 없음

- [ ] **Step 1: 단위 테스트 전체 실행**

```bash
npm run test:run
```

기대: 전부 PASS.

- [ ] **Step 2: 린트**

```bash
npm run lint
```

기대: 이 PR이 건드린 파일에서 신규 에러 0건.

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건.

- [ ] **Step 4: 빌드**

```bash
npm run build
```

기대: 타입스크립트 컴파일 통과.

- [ ] **Step 5: 브라우저 육안 확인 (사용자 확인 필요)**

`/admin/*`은 Clerk 인증을 요구하므로 로그인 세션 없이는 에이전트가 확인할 수 없다. **아래는 사용자가 직접 확인한다.**

- [ ] 댓글 관리: 최상위 댓글이 카드로, 답글이 카드 안 들여쓰기로 뜬다
- [ ] 댓글 관리: 답글이 없는 카드는 "답변 대기", 관리자 답글이 하나라도 있는 카드는 "답변 완료"로 표시된다
- [ ] 댓글 관리: [답글] 버튼을 누르면 폼이 열리고, 등록하면 카드 안에 바로 답글이 나타나며 뱃지가 "답변 완료"로 바뀐다
- [ ] 댓글 관리: 등록된 관리자 답글의 작성자명이 블로그 설정의 블로그 이름과 같다
- [ ] 댓글 관리: [삭제] 버튼이 최상위 댓글·답글 각각에서 독립적으로 동작한다
- [ ] 사이드바: "댓글 관리" 메뉴에 답변 대기 수 뱃지가 뜨고, 답글을 달면 숫자가 줄어든다
- [ ] 독자 페이지(`/posts/[slug]`): 관리자가 단 답글에 "작성자" 뱃지가 뜨고, 부모 댓글 작성자에게 이메일 알림이 간다(이메일을 입력해 두었다면)
- [ ] 독자 페이지: 관리자 답글에는 Discord 알림이 오지 않는다(일반 방문자 댓글에는 계속 온다)
- [ ] 다크 모드에서 카드·뱃지 대비가 읽을 만하다
- [ ] 글 관리·카테고리·태그·시리즈 화면(PR 2 산출물)이 이 PR 전후로 달라지지 않았다

- [ ] **Step 6: plan 문서 완료 기록**

이 문서 상단에 완료 일자와 결과 요약을 추가하고, 모든 체크박스를 `- [x]`로 반영한다.

- [ ] **Step 7: PR 생성 (사용자 확인 필요)**

`develop`으로의 PR 생성은 공유 브랜치에 영향을 주므로 사용자 확인 없이 진행하지 않는다. 머지는 squash 금지, `--no-ff` 머지 커밋 방식이다.

---
