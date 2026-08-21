# 어드민 콘텐츠 화면 셀 A 구현 계획 (어드민 리디자인 PR 2/4)

> **완료: 2026-08-20.** Task 1~9 전부 완료. SDD(subagent-driven-development)로 실행 — 태스크별 구현·리뷰 후 전체 브랜치 최종 리뷰까지 마쳤다. 결과 요약:
> - Task 1~8: 전부 태스크 리뷰 통과. 플랜 자체의 결함 2건(Task 4의 "이어서 쓰기"/"삭제" 버튼 미구현, Task 7의 시리즈 삭제 확인 문구 postCount 전제 오류)은 사용자 확인을 거쳐 현재 구현을 유지하기로 결정.
> - Task 9 검증 중 회귀 발견·수정: Task 1 수정 라운드가 유발한 `zodResolver` 제네릭 타입 충돌 → `SeriesFormValues`를 `z.input`으로 수정.
> - 전체 브랜치 최종 리뷰(opus)에서 추가 발견·수정: 글 삭제 시 `CACHE_TAGS.tags` 무효화 누락(Task 6에서 고친 것과 같은 계열의 결함이 `remove-post.ts`에 남아있었음).
> - 자동 검증 전부 통과: 단위 테스트 89 files/482 tests, 린트 신규 에러 0건, tsc 신규 에러 0건, 빌드 성공.
> - 브라우저 육안 확인(Step 9 Step 5)은 Clerk 인증이 필요해 에이전트가 확인할 수 없음 — PR 리뷰 중 사용자가 직접 확인 예정.
> - PR: [#84](https://github.com/qlrogo91lp/yj-blog/pull/84) (`refactor/admin-content-screens` → `develop`)
> - SDD 원장: `.superpowers/sdd/2026-08-20-admin-content-screens/progress.md` (deferred/parked 항목 전체 목록)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 글 관리·카테고리·태그·시리즈 네 화면을 표에서 시안(1b·3a·1d·3d)의 카드/행/칩/스택 형태로 교체하고, 그 결과 사용처를 잃는 `@tanstack/react-table`을 저장소에서 제거한다.

**Architecture:** 화면마다 서버 컴포넌트 `page.tsx`가 DB 쿼리를 호출해 데이터를 내려주고, 순수 표현 컴포넌트(`_components`)가 렌더링을, 상태·서버 액션이 필요한 조각(`_actions`)이 인터랙션을 맡는다. 새 mutation은 전부 `_services`의 Server Action이 `db/queries`의 SQL 동사 함수를 호출하는 2계층 구조를 따른다 — 서비스는 인증·검증·revalidate만, 쿼리는 SQL만. 발행 토글처럼 낙관적 UI가 필요한 곳은 `useTransition` + `router.refresh()` 대신 Server Action 결과로 `revalidatePath`를 태워 서버 상태를 단일 진실로 유지한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui + radix-ui, Drizzle ORM(neon-http), Vitest + Testing Library

**Spec:** [2026-08-20-admin-cell-a-redesign-design.md](../specs/2026-08-20-admin-cell-a-redesign-design.md)

## Global Constraints

- Tailwind v4 문법만 쓴다 — CSS 변수는 `max-w-(--content-width)`, 그라디언트는 `bg-linear-to-*`, spacing 스케일의 4배수 px 임의값은 숫자 유틸리티(`max-w-[1180px]` → `max-w-295`). v3 문법은 경고 없이 컴파일되므로 린트가 잡아주지 않는다.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다.
- React hook·타입은 named import (`import { useState } from 'react'`). `React.useState`와 `import * as React` 네임스페이스 import 금지. **PR 1에서 이 규칙 위반이 세 번 반복됐으니 새 파일마다 확인한다.**
- 색상 hex를 컴포넌트에 직접 쓰지 않는다. 상태 색은 PR 1이 정의한 `--status-published` / `--status-draft` / `--status-danger` 토큰의 Tailwind 유틸(`bg-status-published`, `text-status-danger` 등)을 쓴다.
- CRUD 동사 컨벤션 — Server Action은 `add`/`get`/`edit`/`remove`, DB 쿼리는 `insert`/`select`/`update`/`delete`. 서비스 파일명은 동사+명사 kebab (`edit-post-status.ts`), 접미사 없음.
- 날짜 포맷·연산은 date-fns를 쓴다. `toLocaleDateString` 등 네이티브 날짜 메서드 금지.
- `console.log`를 커밋하지 않는다.
- 폴더·파일 네이밍은 `.claude/rules/page-folder.md`를 따른다 — `_actions/*.action.tsx`, `_components/kebab-case.tsx`, `_services/kebab-case.ts`, `_utils/kebab-case.ts`.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 만든다.
- 스키마 변경은 `npx drizzle-kit push`로 반영한다. 이 PR의 변경은 컬럼 추가 하나뿐이라 데이터 손실 위험이 없다.

## 이 PR의 범위 밖

아래는 후속 PR에서 다루거나, 스펙에서 명시적으로 제외한 것이다. 이 PR에서 미리 손대지 않는다.

- 댓글 관리(3b)·`comments.isAuthor`·관리자 답글 — PR 3
- 대시보드(2c)·방문 통계(3c)·유입경로(3e)·블로그 설정(3f) — PR 4
- **시리즈 회차 드래그 정렬** — 스펙에서 제외 결정. 순서는 `publishedAt ASC` 유지, 시안의 드래그 핸들(⠿) 아이콘은 그리지 않는다.
- **태그 이름 바꾸기·병합·태그별 글 목록 펼치기** — 시안 1d의 안내 박스가 이 셋을 설명하지만, 스펙이 태그에 대해 승인한 신규 작업은 "미사용 태그 일괄 정리"뿐이다. 현재 태그 화면에도 수정 기능이 없어 기능 후퇴가 아니다. 안내 박스는 그리지 않는다.
- PR 1이 만든 `AdminSidebarAction`의 `pendingReplyCount` 실제 연결 — PR 3
- PR 1 최종 리뷰에서 보류(parked)한 항목들 — 브레드크럼 `key`, "블로그 보기" 링크 스타일, 뱃지 라우트 리터럴, `nav-links.tsx`와의 경로 매칭 중복, 미사용 `--sidebar-primary` 토큰. 이 PR이 해당 파일을 건드릴 일이 없다.

---

## 로드맵 — 어드민 리디자인 4개 PR

| 순서 | 브랜치 | plan 문서 | 상태 |
|---|---|---|---|
| 1 | `refactor/admin-shell-cell-a` | [2026-08-20-admin-shell-cell-a.md](./2026-08-20-admin-shell-cell-a.md) | 완료 (PR #83 머지, 육안 확인 미완) |
| 2 | `refactor/admin-content-screens` | 이 문서 | 진행 예정 |
| 3 | `feature/admin-comment-reply` | 미작성 | 댓글 관리 + `comments.isAuthor` + 관리자 답글 |
| 4 | `refactor/admin-stats-settings` | 미작성 | 대시보드·방문 통계·유입경로·블로그 설정 |

---

## 결정 사항

플랜 작성 중 확정한 판단이다. 실행 전에 이견이 있으면 여기부터 고친다.

### 발행 토글은 `publishedAt`을 보존한다

기존 `save-post.ts:75`는 `status === 'published' ? (current.publishedAt ?? new Date()) : null` — 즉 임시저장으로 되돌리면 `publishedAt`을 `null`로 지운다. 이 PR의 원클릭 토글은 **그 동작을 따르지 않고 `publishedAt`을 그대로 둔다.**

이유: 목록에서 스위치를 잘못 눌렀다가 되돌리면, `save-post` 방식에서는 발행일이 "지금"으로 리셋되어 블로그 목록 최상단으로 글이 튀어오른다. 에디터에서 명시적으로 저장할 때와 달리 한 번의 클릭으로 데이터가 조용히 바뀌는 건 위험하다.

부작용: 토글로 내린 글은 `publishedAt`이 남고, 에디터에서 임시저장하면 지워져 두 경로의 결과가 다르다. `save-post.ts`도 보존하도록 통일하는 편이 옳아 보이지만 이 PR의 범위가 아니라 건드리지 않는다. 후속 정리 후보.

### 미분류 배너의 [지정하기]는 가장 오래된 미분류 글의 편집 화면으로 보낸다

시안 3a의 배너는 미분류 글 1개를 가정하고 제목 하나와 [지정하기] 버튼 하나를 보여준다. 실제로는 N개일 수 있으므로: 배너 문구는 `미분류 글 N개`, 본문은 가장 오래된 미분류 글 제목(+ N>1이면 `외 N-1개`), 버튼은 그 글의 `/admin/posts/{id}/edit`로 보낸다. 미분류가 0개면 배너 자체를 렌더하지 않는다.

### 시리즈 "이 시리즈에 글 추가"는 새 글 작성으로 보낸다

시안 3d의 점선 버튼. 기존 글을 시리즈에 편입하는 피커를 새로 만들지 않고 `/admin/posts/new`로 링크한다 — 그 화면의 `SeriesSelectorAction`으로 시리즈를 고를 수 있다.

### 글 관리 필터는 searchParams로 처리한다

시안 1b의 [전체][발행][임시] 세그먼트. 저장소에 이미 같은 패턴(`referrer-period-filter.action.tsx`)이 있고, URL로 상태가 공유되는 편이 낫다. 클라이언트 필터링 대신 `page.tsx`가 `searchParams.status`를 읽어 걸러낸다.

---

## File Structure

**생성**

| 파일 | 책임 |
|---|---|
| `src/app/admin/posts/_services/edit-post-status.ts` | 발행 상태 토글 Server Action |
| `src/app/admin/posts/_services/edit-post-status.test.ts` | 인증·검증·쿼리 호출 검증 |
| `src/app/admin/posts/_actions/post-status-toggle.action.tsx` | 발행 스위치 (클라이언트) |
| `src/app/admin/posts/_actions/post-status-toggle.action.test.tsx` | 토글 렌더·호출 검증 |
| `src/app/admin/posts/_actions/post-status-filter.action.tsx` | 전체/발행/임시 세그먼트 |
| `src/app/admin/posts/_components/post-row.tsx` | 썸네일 중심 글 행 (순수) |
| `src/app/admin/posts/_components/post-row.test.tsx` | 행 렌더 검증 |
| `src/app/admin/categories/_components/category-card.tsx` | 카테고리 카드 (순수) |
| `src/app/admin/categories/_components/category-card.test.tsx` | 카드 렌더 검증 |
| `src/app/admin/categories/_components/uncategorized-banner.tsx` | 미분류 글 배너 (순수) |
| `src/app/admin/categories/_components/uncategorized-banner.test.tsx` | 배너 렌더·분기 검증 |
| `src/app/admin/categories/_actions/category-board.action.tsx` | 카드 그리드 + 새 카테고리 다이얼로그 |
| `src/app/admin/tags/_services/remove-unused-tags.ts` | 미사용 태그 일괄 삭제 Server Action |
| `src/app/admin/tags/_services/remove-unused-tags.test.ts` | 인증·쿼리 호출 검증 |
| `src/app/admin/tags/_components/tag-chip.tsx` | 태그 칩 (순수) |
| `src/app/admin/tags/_components/tag-chip.test.tsx` | 칩 렌더 검증 |
| `src/app/admin/tags/_actions/tag-board.action.tsx` | 칩 보드 + 새 태그 입력 + 미사용 정리 |
| `src/app/admin/tags/_actions/tag-board.action.test.tsx` | 보드 렌더·구분 검증 |
| `src/app/admin/series/_components/series-stack-item.tsx` | 시리즈 한 건 + 회차 목록 (순수) |
| `src/app/admin/series/_components/series-stack-item.test.tsx` | 스택 아이템 렌더·접힘 검증 |
| `src/app/admin/series/_actions/series-stack.action.tsx` | 스택 + 펼침 상태 + 새 시리즈 다이얼로그 |

**수정**

| 파일 | 변경 |
|---|---|
| `src/db/schema.ts` | `seriesStatusEnum` + `series.status` 컬럼 추가 |
| `src/types/series.ts` | `seriesFormSchema`에 `status` 추가 |
| `src/types/series.test.ts` | `status` 검증 테스트 추가 |
| `src/types/tag.ts` | `TagWithCount` 타입 추가 (삭제될 `columns.tsx`의 `TagRow` 대체) |
| `src/types/index.ts` | `TagWithCount` 재export |
| `src/db/queries/series.ts` | `insertSeries`/`updateSeries`에 `status` 반영, `selectSeriesListForAdmin` 추가 |
| `src/db/queries/posts.ts` | `getAllPostsForAdmin`에 댓글 수·태그 추가, `updatePostStatus` 추가 |
| `src/db/queries/categories.ts` | `getCategoriesWithPostCount`, `selectUncategorizedPosts` 추가 |
| `src/db/queries/tags.ts` | `deleteUnusedTags` 추가 |
| `src/app/admin/series/_actions/series-form-dialog.action.tsx` | 연재 중/완결 선택 필드 추가 |
| `src/app/admin/posts/new/_services/save-post.ts` | `post_tags`를 다시 쓰면서 `CACHE_TAGS.tags`를 무효화하지 않던 결함 수정 (Task 6) |
| `src/app/admin/posts/page.tsx` | 표 → 썸네일 행 목록 + 필터 |
| `src/app/admin/categories/page.tsx` | 표 → 카드 그리드 + 미분류 배너 |
| `src/app/admin/tags/page.tsx` | 표 → 칩 보드 |
| `src/app/admin/series/page.tsx` | 표 → 접힘 스택 |
| `src/app/admin/posts/loading.tsx` | 새 레이아웃에 맞는 스켈레톤 |
| `src/app/admin/categories/loading.tsx` | 새 레이아웃에 맞는 스켈레톤 |
| `src/app/admin/series/loading.tsx` | 새 레이아웃에 맞는 스켈레톤 |
| `package.json` | `@tanstack/react-table` 제거 |

**삭제**

| 파일 | 이유 |
|---|---|
| `src/components/data-table.tsx` | 마지막 사용처가 사라짐 |
| `src/app/admin/posts/_components/columns.tsx` | 표 제거 |
| `src/app/admin/categories/_components/columns.tsx` | 표 제거 |
| `src/app/admin/series/_components/columns.tsx` | 표 제거 |
| `src/app/admin/tags/_components/columns.tsx` | 표 제거 (`TagRow` 타입은 `types/tag.ts`로 이동) |
| `src/app/admin/tags/_components/tag-table.tsx` | `tag-board.action.tsx`로 대체 |
| `src/app/admin/tags/_components/tag-actions-cell.tsx` | 칩이 삭제 버튼을 직접 품음 |
| `src/app/admin/categories/_actions/category-table.action.tsx` | `category-board.action.tsx`로 대체 |
| `src/app/admin/series/_actions/series-table.action.tsx` | `series-stack.action.tsx`로 대체 |

> `src/components/ui/table.tsx`는 남긴다 — 유입경로(3e)가 표를 유지하고, `admin/comments`도 자체 `<table>` 마크업을 쓴다.

---

## Task 1: `series.status` 스키마·타입·폼

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/types/series.ts`
- Modify: `src/db/queries/series.ts:115-145` (`insertSeries`, `updateSeries`)
- Modify: `src/app/admin/series/_actions/series-form-dialog.action.tsx`
- Test: `src/types/series.test.ts` (기존 파일에 추가)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `seriesStatusEnum` — pg enum `series_status`, 값 `'ongoing' | 'completed'`
  - `series.status` 컬럼 — `notNull().default('ongoing')`
  - `SeriesFormValues`에 `status: 'ongoing' | 'completed'` 필드 추가
  - Task 7의 시리즈 스택이 `series.status`로 연재 중/완결 뱃지를 그린다

- [x] **Step 1: 실패하는 테스트 작성**

`src/types/series.test.ts`의 마지막 `describe('description', ...)` 블록 **뒤, 최상위 `describe`가 닫히기 전**에 추가한다.

```ts
  describe('status', () => {
    it('ongoing이면 성공', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, status: 'ongoing' }).success
      ).toBe(true);
    });

    it('completed면 성공', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, status: 'completed' }).success
      ).toBe(true);
    });

    it('정의되지 않은 값이면 실패', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, status: 'paused' }).success
      ).toBe(false);
    });

    it('생략하면 ongoing으로 채워진다', () => {
      const result = seriesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBe('ongoing');
    });
  });
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/types/series.test.ts
```

기대: 4개 중 최소 2개 FAIL — `status` 필드가 스키마에 없어 `'paused'`도 통과하고(3번째 실패), 기본값이 채워지지 않는다(4번째 실패).

- [x] **Step 3: 스키마에 enum·컬럼 추가**

`src/db/schema.ts`의 Enums 블록에서 `postStatusEnum` 바로 아래에 추가한다.

```ts
export const seriesStatusEnum = pgEnum('series_status', [
  'ongoing',
  'completed',
]);
```

이어서 `series` 테이블 정의의 `description` 줄 바로 뒤에 컬럼을 추가한다.

```ts
  status: seriesStatusEnum('status').notNull().default('ongoing'), // 연재 중 / 완결
```

- [x] **Step 4: 폼 스키마에 status 추가**

`src/types/series.ts`의 `seriesFormSchema`에서 `description` 줄 뒤에 추가한다.

```ts
  status: z.enum(['ongoing', 'completed']).default('ongoing'),
```

- [x] **Step 5: 테스트 통과 확인**

```bash
npm run test:run -- src/types/series.test.ts
```

기대: `status` 4개 포함 전부 PASS.

- [x] **Step 6: 쿼리에 status 반영**

`src/db/queries/series.ts`의 `insertSeries`에서 `.values({...})`에 추가한다.

```ts
      status: data.status,
```

`updateSeries`의 `.set({...})`에도 같은 줄을 추가한다.

- [x] **Step 7: 폼 다이얼로그에 선택 필드 추가**

`src/app/admin/series/_actions/series-form-dialog.action.tsx`를 수정한다.

import에 Select를 추가한다(`Textarea` import 아래).

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

`useForm`의 `defaultValues`에 추가한다.

```tsx
      status: 'ongoing',
```

`useEffect`의 `form.reset({...})`에도 추가한다.

```tsx
        status: series?.status ?? 'ongoing',
```

`description` 필드 `<div className="grid gap-2">` 블록 **뒤**, `{error && ...}` 앞에 필드를 추가한다. `Select`는 `register`로 제어할 수 없으므로 `watch`/`setValue`로 연결한다.

```tsx
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
```

- [x] **Step 8: DB에 반영**

```bash
npx drizzle-kit push
```

기대: `series_status` enum 생성 + `series.status` 컬럼 추가. 기존 행은 `default 'ongoing'`으로 채워진다. 데이터 손실 경고가 뜨면 중단하고 보고한다 — 이 변경은 컬럼 추가뿐이라 경고가 나오면 안 된다.

- [x] **Step 9: 전체 테스트·타입 확인**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 전부 PASS. tsc는 기존 에러 1건(`e2e/ralli.spec.ts:57`)만 남고 신규 에러 0건.

- [x] **Step 10: 커밋**

```bash
git add src/db/schema.ts src/types/series.ts src/types/series.test.ts src/db/queries/series.ts src/app/admin/series/_actions/series-form-dialog.action.tsx
git commit -m "✨ feat: 시리즈에 연재 중/완결 상태 추가"
```

---

## Task 2: 발행 상태 토글 Server Action

**Files:**
- Modify: `src/db/queries/posts.ts` (`updatePostStatus` 추가)
- Create: `src/app/admin/posts/_services/edit-post-status.ts`
- Test: `src/app/admin/posts/_services/edit-post-status.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `updatePostStatus(id: number, status: 'draft' | 'published'): Promise<{ id: number }[]>` — DB 쿼리. `status`가 `'published'`이고 기존 `publishedAt`이 `null`이면 현재 시각을 채우고, 그 외에는 **`publishedAt`을 건드리지 않는다**(「결정 사항」 참조). `returning({ id })`로 갱신된 행을 돌려주므로 빈 배열이면 대상 글이 없다는 뜻이다.
  - `editPostStatus(postId: number, status: 'draft' | 'published'): Promise<{ success: true } | { success: false; error: string }>` — Server Action. Task 3의 토글 컴포넌트가 호출한다.

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/_services/edit-post-status.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updatePostStatus } from '@/db/queries/posts';
import { editPostStatus } from './edit-post-status';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/db/queries/posts', () => ({
  updatePostStatus: vi.fn(async () => [{ id: 1 }]),
}));

describe('editPostStatus', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    vi.mocked(updatePostStatus).mockClear();
    vi.mocked(updatePostStatus).mockResolvedValue([{ id: 1 }]);
  });

  it('로그인하지 않았으면 실패하고 DB를 건드리지 않는다', async () => {
    authState.userId = null;

    const result = await editPostStatus(1, 'published');

    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(updatePostStatus).not.toHaveBeenCalled();
  });

  it('발행으로 전환하면 쿼리를 published로 호출한다', async () => {
    const result = await editPostStatus(7, 'published');

    expect(result).toEqual({ success: true });
    expect(updatePostStatus).toHaveBeenCalledWith(7, 'published');
  });

  it('임시저장으로 전환하면 쿼리를 draft로 호출한다', async () => {
    const result = await editPostStatus(7, 'draft');

    expect(result).toEqual({ success: true });
    expect(updatePostStatus).toHaveBeenCalledWith(7, 'draft');
  });

  it('정의되지 않은 상태값이면 실패한다', async () => {
    // @ts-expect-error 런타임 방어를 검증한다
    const result = await editPostStatus(7, 'archived');

    expect(result).toEqual({ success: false, error: '잘못된 상태값입니다' });
    expect(updatePostStatus).not.toHaveBeenCalled();
  });

  it('갱신된 행이 없으면 실패한다', async () => {
    vi.mocked(updatePostStatus).mockResolvedValue([]);

    const result = await editPostStatus(999, 'published');

    expect(result).toEqual({ success: false, error: '글을 찾을 수 없습니다' });
  });

  it('쿼리가 던지면 실패 결과로 감싼다', async () => {
    vi.mocked(updatePostStatus).mockRejectedValue(new Error('db down'));

    const result = await editPostStatus(7, 'published');

    expect(result).toEqual({ success: false, error: '상태 변경에 실패했습니다' });
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/posts/_services/edit-post-status.test.ts
```

기대: FAIL — `Failed to resolve import "./edit-post-status"`.

- [x] **Step 3: DB 쿼리 추가**

`src/db/queries/posts.ts`의 맨 끝(`deletePostById` 뒤)에 추가한다.

**먼저 import를 고친다** — 확인 결과 이 파일의 drizzle-orm import는 `{ and, count, desc, eq, ilike, or }`라 `sql`이 없다. 아래처럼 추가한다 (Task 4에서도 같은 `sql`을 쓴다).

```ts
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
```

스키마 import(`categories, comments, postTags, posts, tags`)는 이미 전부 들어 있어 손댈 필요가 없다.

```ts
/**
 * 글의 발행 상태만 변경한다.
 *
 * publishedAt은 처음 발행할 때(null → published)만 채우고, 그 외에는 건드리지
 * 않는다. 목록의 원클릭 토글로 발행일이 리셋되면 블로그 정렬이 조용히 바뀌기
 * 때문이다. (에디터의 savePost는 draft 전환 시 null로 지우는 다른 정책을 쓴다)
 */
export async function updatePostStatus(
  id: number,
  status: 'draft' | 'published'
) {
  return db
    .update(posts)
    .set({
      status,
      publishedAt:
        status === 'published'
          ? sql`coalesce(${posts.publishedAt}, now())`
          : posts.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning({ id: posts.id });
}
```

- [x] **Step 4: Server Action 작성**

`src/app/admin/posts/_services/edit-post-status.ts`:

```ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updatePostStatus } from '@/db/queries/posts';

type Result = { success: true } | { success: false; error: string };

export async function editPostStatus(
  postId: number,
  status: 'draft' | 'published'
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  if (status !== 'draft' && status !== 'published') {
    return { success: false, error: '잘못된 상태값입니다' };
  }

  try {
    const updated = await updatePostStatus(postId, status);

    if (updated.length === 0) {
      return { success: false, error: '글을 찾을 수 없습니다' };
    }

    revalidateTag(CACHE_TAGS.posts, 'max');
    revalidatePath('/admin/posts');
    return { success: true };
  } catch {
    return { success: false, error: '상태 변경에 실패했습니다' };
  }
}
```

- [x] **Step 5: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/posts/_services/edit-post-status.test.ts
```

기대: 6개 PASS.

- [x] **Step 6: 커밋**

```bash
git add src/db/queries/posts.ts src/app/admin/posts/_services/edit-post-status.ts src/app/admin/posts/_services/edit-post-status.test.ts
git commit -m "✨ feat: 글 발행 상태 토글 Server Action 추가"
```

---

## Task 3: 미사용 태그 일괄 정리 Server Action

**Files:**
- Modify: `src/db/queries/tags.ts` (`deleteUnusedTags` 추가)
- Modify: `src/types/tag.ts` (`TagWithCount` 추가)
- Modify: `src/types/index.ts` (재export)
- Create: `src/app/admin/tags/_services/remove-unused-tags.ts`
- Test: `src/app/admin/tags/_services/remove-unused-tags.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `TagWithCount = Tag & { postCount: number }` — `getAllTags()`의 반환 원소 타입. 삭제될 `tags/_components/columns.tsx`의 `TagRow`를 대체한다. Task 6의 칩 보드가 이 타입을 쓴다.
  - `deleteUnusedTags(): Promise<{ id: number }[]>` — `post_tags`에 한 건도 없는 태그를 모두 지우고 지워진 id 목록을 돌려준다.
  - `removeUnusedTags(): Promise<{ success: true; removed: number } | { success: false; error: string }>` — Server Action. `removed`는 삭제된 개수.

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/tags/_services/remove-unused-tags.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteUnusedTags } from '@/db/queries/tags';
import { removeUnusedTags } from './remove-unused-tags';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/db/queries/tags', () => ({
  deleteUnusedTags: vi.fn(async () => [{ id: 1 }, { id: 2 }]),
}));

describe('removeUnusedTags', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    vi.mocked(deleteUnusedTags).mockClear();
    vi.mocked(deleteUnusedTags).mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  it('로그인하지 않았으면 실패하고 DB를 건드리지 않는다', async () => {
    authState.userId = null;

    const result = await removeUnusedTags();

    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(deleteUnusedTags).not.toHaveBeenCalled();
  });

  it('삭제된 태그 개수를 돌려준다', async () => {
    const result = await removeUnusedTags();

    expect(result).toEqual({ success: true, removed: 2 });
  });

  it('지울 태그가 없어도 성공하고 0을 돌려준다', async () => {
    vi.mocked(deleteUnusedTags).mockResolvedValue([]);

    const result = await removeUnusedTags();

    expect(result).toEqual({ success: true, removed: 0 });
  });

  it('쿼리가 던지면 실패 결과로 감싼다', async () => {
    vi.mocked(deleteUnusedTags).mockRejectedValue(new Error('db down'));

    const result = await removeUnusedTags();

    expect(result).toEqual({
      success: false,
      error: '미사용 태그 정리에 실패했습니다',
    });
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/tags/_services/remove-unused-tags.test.ts
```

기대: FAIL — `Failed to resolve import "./remove-unused-tags"`.

- [x] **Step 3: 타입 추가**

`src/types/tag.ts` 끝에 추가한다.

```ts
/** 글 수를 함께 집계한 태그 (어드민 태그 보드용) */
export type TagWithCount = Tag & { postCount: number };
```

`src/types/index.ts`의 태그 줄을 교체한다.

```ts
export type { Tag, TagSummary, TagWithCount } from './tag';
```

- [x] **Step 4: DB 쿼리 추가**

`src/db/queries/tags.ts`의 `deleteTag` 뒤에 추가한다.

**먼저 import를 고친다** — 확인 결과 이 파일의 drizzle-orm import는 `{ count, desc, eq, inArray }`라 `notExists`가 없다.

```ts
import { count, desc, eq, inArray, notExists } from 'drizzle-orm';
```

스키마 import(`postTags`, `tags`)는 이미 들어 있다.

```ts
/**
 * 어떤 글에도 붙어 있지 않은 태그를 일괄 삭제한다.
 */
export async function deleteUnusedTags(): Promise<{ id: number }[]> {
  return db
    .delete(tags)
    .where(
      notExists(
        db
          .select({ postId: postTags.postId })
          .from(postTags)
          .where(eq(postTags.tagId, tags.id))
      )
    )
    .returning({ id: tags.id });
}
```

- [x] **Step 5: Server Action 작성**

`src/app/admin/tags/_services/remove-unused-tags.ts`:

```ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deleteUnusedTags } from '@/db/queries/tags';

type Result =
  | { success: true; removed: number }
  | { success: false; error: string };

export async function removeUnusedTags(): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    const removed = await deleteUnusedTags();

    revalidateTag(CACHE_TAGS.tags, 'max');
    revalidatePath('/admin/tags');
    return { success: true, removed: removed.length };
  } catch {
    return { success: false, error: '미사용 태그 정리에 실패했습니다' };
  }
}
```

- [x] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/tags/_services/remove-unused-tags.test.ts
```

기대: 4개 PASS.

- [x] **Step 7: 커밋**

```bash
git add src/types/tag.ts src/types/index.ts src/db/queries/tags.ts src/app/admin/tags/_services/remove-unused-tags.ts src/app/admin/tags/_services/remove-unused-tags.test.ts
git commit -m "✨ feat: 미사용 태그 일괄 정리 Server Action 추가"
```

---

## Task 4: 글 관리 화면 (시안 1b)

**Files:**
- Modify: `src/db/queries/posts.ts` (`getAllPostsForAdmin` 확장)
- Create: `src/app/admin/posts/_components/post-row.tsx`
- Test: `src/app/admin/posts/_components/post-row.test.tsx`
- Create: `src/app/admin/posts/_actions/post-status-toggle.action.tsx`
- Test: `src/app/admin/posts/_actions/post-status-toggle.action.test.tsx`
- Create: `src/app/admin/posts/_actions/post-status-filter.action.tsx`
- Modify: `src/app/admin/posts/page.tsx`

**Interfaces:**
- Consumes: Task 2의 `editPostStatus`. PR 1의 `AdminPageHeader`, `Switch`, `--status-*` 토큰.
- Produces:
  - `AdminPostRow = PostWithCategory & { commentCount: number; tagNames: string[] }` — `src/types/post.ts`에 추가하고 `types/index.ts`에서 재export한다. `getAllPostsForAdmin`의 새 반환 타입.
  - `PostRow({ post }: { post: AdminPostRow })` — 순수 행 컴포넌트.
  - `PostStatusToggleAction({ postId, status }: { postId: number; status: 'draft' | 'published' })`.

**시안 반영 항목**

- 행 왼쪽에 썸네일(없으면 회색 플레이스홀더 + "썸네일 없음"), 오른쪽에 발행 스위치 + 상태 라벨(발행 중 / 비공개)
- 제목 옆에 카테고리 뱃지, 임시저장 글은 `bg-status-draft` 뱃지
- 메타 줄: 발행일 · 조회 N · 댓글 N · #태그
- 임시저장 행은 발행일 대신 `본문 N자 · {수정 시각} 자동 저장`, [이어서 쓰기] [삭제] 버튼

- [x] **Step 1: 실패하는 테스트 작성 — 행 컴포넌트**

`src/app/admin/posts/_components/post-row.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminPostRow } from '@/types';
import { PostRow } from './post-row';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('../_actions/post-status-toggle.action', () => ({
  PostStatusToggleAction: ({ status }: { status: string }) => (
    <div data-testid="status-toggle">{status}</div>
  ),
}));

vi.mock('../_actions/post-actions-cell.action', () => ({
  PostActionsCellAction: () => <div data-testid="post-actions" />,
}));

const publishedPost = {
  id: 1,
  title: 'DELL S2725QC 모니터 리뷰',
  slug: 'dell-s2725qc',
  content: '본문',
  contentFormat: 'html',
  excerpt: '4K 27인치 USB-C 모니터를 두 달 써보고 남기는 기록.',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  status: 'published',
  views: 1204,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2026-04-20'),
  createdAt: new Date('2026-04-20'),
  updatedAt: new Date('2026-04-20'),
  category: { id: 1, name: '리뷰', slug: 'review', description: null, createdAt: new Date() },
  commentCount: 3,
  tagNames: ['4k모니터', 'dell'],
} as unknown as AdminPostRow;

const draftPost = {
  ...publishedPost,
  id: 2,
  title: '키보드 배열 바꾸고 3개월',
  status: 'draft',
  thumbnailUrl: null,
  publishedAt: null,
  views: 0,
  commentCount: 0,
  tagNames: [],
  content: 'a'.repeat(320),
} as unknown as AdminPostRow;

describe('PostRow', () => {
  it('발행 글의 제목·카테고리·메타를 렌더한다', () => {
    render(<PostRow post={publishedPost} />);

    expect(
      screen.getByRole('link', { name: 'DELL S2725QC 모니터 리뷰' })
    ).toHaveAttribute('href', '/posts/dell-s2725qc');
    expect(screen.getByText('리뷰')).toBeInTheDocument();
    expect(screen.getByText(/조회 1,204/)).toBeInTheDocument();
    expect(screen.getByText(/댓글 3/)).toBeInTheDocument();
    expect(screen.getByText('#4k모니터')).toBeInTheDocument();
  });

  it('발행 글은 썸네일을 렌더한다', () => {
    render(<PostRow post={publishedPost} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg'
    );
  });

  it('임시저장 글은 제목이 편집 화면을 가리키고 임시저장 뱃지를 단다', () => {
    render(<PostRow post={draftPost} />);

    expect(
      screen.getByRole('link', { name: '키보드 배열 바꾸고 3개월' })
    ).toHaveAttribute('href', '/admin/posts/2/edit');
    expect(screen.getByText('임시저장')).toBeInTheDocument();
  });

  it('임시저장 글은 본문 길이와 자동 저장 시각을 보여준다', () => {
    render(<PostRow post={draftPost} />);
    expect(screen.getByText(/본문 320자/)).toBeInTheDocument();
  });

  it('썸네일이 없으면 플레이스홀더를 보여준다', () => {
    render(<PostRow post={draftPost} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('썸네일 없음')).toBeInTheDocument();
  });

  it('제목이 비어 있으면 (제목 없음)으로 표시한다', () => {
    render(<PostRow post={{ ...draftPost, title: '' } as AdminPostRow} />);
    expect(screen.getByRole('link', { name: '(제목 없음)' })).toBeInTheDocument();
  });

  it('발행 상태 토글을 렌더한다', () => {
    render(<PostRow post={publishedPost} />);
    expect(screen.getByTestId('status-toggle')).toHaveTextContent('published');
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/posts/_components/post-row.test.tsx
```

기대: FAIL — `Failed to resolve import "./post-row"`.

- [x] **Step 3: 타입 추가**

`src/types/post.ts`의 `PostWithCategory` 정의 뒤에 추가한다.

```ts
/** 어드민 글 목록 행 — 카테고리 + 댓글 수 + 태그명 집계 */
export type AdminPostRow = PostWithCategory & {
  commentCount: number;
  tagNames: string[];
};
```

`src/types/index.ts`의 post 줄에 `AdminPostRow`를 추가한다.

```ts
export type { Post, PostWithCategory, PostWithTags, PostWithCategoryAndTags, AdminPostRow, PostFormValues } from './post';
```

- [x] **Step 4: 행 컴포넌트 작성**

`src/app/admin/posts/_components/post-row.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { AdminPostRow } from '@/types';
import { PostActionsCellAction } from '../_actions/post-actions-cell.action';
import { PostStatusToggleAction } from '../_actions/post-status-toggle.action';

type Props = {
  post: AdminPostRow;
};

export function PostRow({ post }: Props) {
  const isDraft = post.status === 'draft';
  const href = isDraft ? `/admin/posts/${post.id}/edit` : `/posts/${post.slug}`;

  return (
    <li className="flex items-center gap-4 rounded-2xl border p-4">
      <div className="bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          '썸네일 없음'
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className={
              post.title
                ? 'font-semibold hover:underline'
                : 'text-muted-foreground font-semibold italic hover:underline'
            }
          >
            {post.title || '(제목 없음)'}
          </Link>
          {post.category && (
            <Badge variant="secondary">{post.category.name}</Badge>
          )}
          {isDraft && (
            <Badge className="bg-status-draft text-foreground">임시저장</Badge>
          )}
        </div>

        {post.excerpt && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
            {post.excerpt}
          </p>
        )}

        <p className="text-muted-foreground mt-1.5 text-xs">
          {isDraft ? (
            <>
              본문 {post.content.length}자 ·{' '}
              {formatDistanceToNow(new Date(post.updatedAt), {
                addSuffix: true,
                locale: ko,
              })}{' '}
              자동 저장
            </>
          ) : (
            <>
              {post.publishedAt &&
                format(new Date(post.publishedAt), 'M월 d일', { locale: ko })}
              {' · '}조회 {post.views.toLocaleString()}
              {' · '}댓글 {post.commentCount}
              {post.tagNames.length > 0 &&
                ` · ${post.tagNames.map((name) => `#${name}`).join(' ')}`}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <PostActionsCellAction postId={post.id} postTitle={post.title} />
        <PostStatusToggleAction postId={post.id} status={post.status} />
      </div>
    </li>
  );
}
```

- [x] **Step 5: 실패하는 테스트 작성 — 토글**

`src/app/admin/posts/_actions/post-status-toggle.action.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editPostStatus } from '../_services/edit-post-status';
import { PostStatusToggleAction } from './post-status-toggle.action';

vi.mock('../_services/edit-post-status', () => ({
  editPostStatus: vi.fn(async () => ({ success: true })),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('PostStatusToggleAction', () => {
  beforeEach(() => {
    vi.mocked(editPostStatus).mockClear();
    vi.mocked(editPostStatus).mockResolvedValue({ success: true });
  });

  it('발행 글은 켜진 스위치와 "발행 중" 라벨을 보여준다', () => {
    render(<PostStatusToggleAction postId={1} status="published" />);

    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
    expect(screen.getByText('발행 중')).toBeInTheDocument();
  });

  it('임시저장 글은 꺼진 스위치와 "비공개" 라벨을 보여준다', () => {
    render(<PostStatusToggleAction postId={1} status="draft" />);

    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('켜면 published로 서버 액션을 호출한다', async () => {
    render(<PostStatusToggleAction postId={7} status="draft" />);

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(editPostStatus).toHaveBeenCalledWith(7, 'published')
    );
  });

  it('끄면 draft로 서버 액션을 호출한다', async () => {
    render(<PostStatusToggleAction postId={7} status="published" />);

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() => expect(editPostStatus).toHaveBeenCalledWith(7, 'draft'));
  });
});
```

- [x] **Step 6: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/posts/_actions/post-status-toggle.action.test.tsx
```

기대: FAIL — `Failed to resolve import "./post-status-toggle.action"`.

- [x] **Step 7: 토글 컴포넌트 작성**

`src/app/admin/posts/_actions/post-status-toggle.action.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { editPostStatus } from '../_services/edit-post-status';

type Props = {
  postId: number;
  status: 'draft' | 'published';
};

export function PostStatusToggleAction({ postId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const isPublished = status === 'published';

  const handleChange = (checked: boolean) => {
    startTransition(async () => {
      const result = await editPostStatus(
        postId,
        checked ? 'published' : 'draft'
      );

      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <Switch
        checked={isPublished}
        disabled={isPending}
        onCheckedChange={handleChange}
        aria-label={`${isPublished ? '비공개로 전환' : '발행'}`}
        className="data-[state=checked]:bg-status-published"
      />
      <span className="text-muted-foreground text-xs">
        {isPublished ? '발행 중' : '비공개'}
      </span>
    </div>
  );
}
```

- [x] **Step 8: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/posts/_components/post-row.test.tsx src/app/admin/posts/_actions/post-status-toggle.action.test.tsx
```

기대: 7 + 4 = 11개 PASS.

- [x] **Step 9: 쿼리 확장**

`src/db/queries/posts.ts`의 `getAllPostsForAdmin`을 교체한다. 필요한 import는 Task 2 Step 3에서 이미 다 넣었다 — 스키마의 `comments`·`postTags`·`tags`는 원래부터 있었고 `sql`은 그때 추가했다. `AdminPostRow` 타입 import만 더한다.

```ts
import type { AdminPostRow, PostWithCategory, PostWithCategoryAndTags } from '@/types';
```

```ts
export const getAllPostsForAdmin = unstable_cache(
  async (): Promise<AdminPostRow[]> => {
    const result = await db
      .select({
        post: posts,
        category: categories,
        commentCount: sql<number>`(
          select count(*) from ${comments} where ${comments.postId} = ${posts.id}
        )`.mapWith(Number),
        tagNames: sql<string[]>`coalesce((
          select array_agg(${tags.name})
          from ${postTags}
          join ${tags} on ${tags.id} = ${postTags.tagId}
          where ${postTags.postId} = ${posts.id}
        ), '{}')`,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.updatedAt));

    return result.map(({ post, category, commentCount, tagNames }) => ({
      ...post,
      category,
      commentCount,
      tagNames,
    })) as AdminPostRow[];
  },
  ['admin-posts-list'],
  { tags: [CACHE_TAGS.posts, CACHE_TAGS.comments, CACHE_TAGS.tags] }
);
```

> 정렬을 `publishedAt DESC`에서 `updatedAt DESC`로 바꾼다 — 임시저장 글은 `publishedAt`이 `null`이라 기존 정렬에서는 목록 끝으로 밀려났는데, 시안 1b는 임시저장 글을 목록 안에 섞어 보여준다.

- [x] **Step 10: 필터 컴포넌트 작성**

`src/app/admin/posts/_actions/post-status-filter.action.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const options = [
  { label: '전체', value: 'all' },
  { label: '발행', value: 'published' },
  { label: '임시', value: 'draft' },
];

type Props = {
  current: string;
};

export function PostStatusFilterAction({ current }: Props) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      {options.map((option) => (
        <Link
          key={option.value}
          href={
            option.value === 'all'
              ? '/admin/posts'
              : `/admin/posts?status=${option.value}`
          }
          className={cn(
            'rounded-full px-3 py-1 text-sm transition-colors',
            current === option.value
              ? 'bg-background text-foreground font-medium shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
```

- [x] **Step 11: 페이지 교체**

`src/app/admin/posts/page.tsx`:

```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllPostsForAdmin } from '@/db/queries/posts';
import { AdminPageHeader } from '../_components/admin-page-header';
import { PostStatusFilterAction } from './_actions/post-status-filter.action';
import { PostRow } from './_components/post-row';

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminPostsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const current = status === 'published' || status === 'draft' ? status : 'all';

  const allPosts = await getAllPostsForAdmin();
  const posts =
    current === 'all'
      ? allPosts
      : allPosts.filter((post) => post.status === current);

  const publishedCount = allPosts.filter(
    (post) => post.status === 'published'
  ).length;

  return (
    <div>
      <AdminPageHeader
        title="글 관리"
        description={`전체 ${allPosts.length}개 · 발행 ${publishedCount}개 · 임시저장 ${allPosts.length - publishedCount}개`}
        action={
          <div className="flex items-center gap-3">
            <PostStatusFilterAction current={current} />
            <Button className="rounded-full" asChild>
              <Link href="/admin/posts/new">
                <Plus size={16} />
                글쓰기
              </Link>
            </Button>
          </div>
        }
      />

      {posts.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          작성된 글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [x] **Step 12: 전체 테스트 확인**

```bash
npm run test:run
```

기대: 전부 PASS. `columns.tsx`는 아직 남아 있으므로 기존 `columns.test.tsx`도 통과해야 한다.

- [x] **Step 13: 커밋**

```bash
git add src/types/post.ts src/types/index.ts src/db/queries/posts.ts src/app/admin/posts/
git commit -m "💄 style: 글 관리를 썸네일 행 목록 + 발행 토글로 교체"
```

---

## Task 5: 카테고리 화면 (시안 3a)

**Files:**
- Modify: `src/db/queries/categories.ts` (`getCategoriesWithPostCount`, `selectUncategorizedPosts` 추가)
- Create: `src/app/admin/categories/_components/category-card.tsx`
- Test: `src/app/admin/categories/_components/category-card.test.tsx`
- Create: `src/app/admin/categories/_components/uncategorized-banner.tsx`
- Test: `src/app/admin/categories/_components/uncategorized-banner.test.tsx`
- Create: `src/app/admin/categories/_actions/category-board.action.tsx`
- Modify: `src/app/admin/categories/page.tsx`

**Interfaces:**
- Consumes: PR 1의 `AdminPageHeader`. 기존 `CategoryActionsCell`, `CategoryFormDialogAction`을 그대로 재사용한다.
- Produces:
  - `CategoryWithCount = Category & { postCount: number }` — `src/types/category.ts`에 추가하고 `types/index.ts`에서 재export.
  - `getCategoriesWithPostCount(): Promise<CategoryWithCount[]>`
  - `selectUncategorizedPosts(): Promise<{ id: number; title: string }[]>` — `categoryId`가 `null`인 글, 오래된 순.

- [x] **Step 1: 실패하는 테스트 작성 — 카드**

`src/app/admin/categories/_components/category-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryWithCount } from '@/types';
import { CategoryCard } from './category-card';

vi.mock('../_components/category-actions-cell', () => ({
  CategoryActionsCell: () => <div data-testid="category-actions" />,
}));

const category: CategoryWithCount = {
  id: 1,
  name: '리뷰',
  slug: 'review',
  description: '제품 리뷰',
  createdAt: new Date('2026-01-01'),
  postCount: 3,
};

describe('CategoryCard', () => {
  it('이름·slug·설명·글 수를 렌더한다', () => {
    render(<CategoryCard category={category} />);

    expect(screen.getByText('리뷰')).toBeInTheDocument();
    expect(screen.getByText('/review')).toBeInTheDocument();
    expect(screen.getByText(/제품 리뷰/)).toBeInTheDocument();
    expect(screen.getByText(/글 3개/)).toBeInTheDocument();
  });

  it('설명이 없으면 글 수만 보여준다', () => {
    render(<CategoryCard category={{ ...category, description: null }} />);

    expect(screen.getByText('글 3개')).toBeInTheDocument();
    expect(screen.queryByText(/제품 리뷰/)).not.toBeInTheDocument();
  });

  it('수정·삭제 액션을 렌더한다', () => {
    render(<CategoryCard category={category} />);
    expect(screen.getByTestId('category-actions')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패하는 테스트 작성 — 배너**

`src/app/admin/categories/_components/uncategorized-banner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UncategorizedBanner } from './uncategorized-banner';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('UncategorizedBanner', () => {
  it('미분류 글이 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<UncategorizedBanner posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('1개면 제목과 지정하기 링크를 보여준다', () => {
    render(<UncategorizedBanner posts={[{ id: 5, title: '테스트' }]} />);

    expect(screen.getByText('미분류 글 1개')).toBeInTheDocument();
    expect(screen.getByText(/“테스트”/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '지정하기' })).toHaveAttribute(
      'href',
      '/admin/posts/5/edit'
    );
  });

  it('여러 개면 개수와 "외 N개"를 함께 보여준다', () => {
    render(
      <UncategorizedBanner
        posts={[
          { id: 5, title: '테스트' },
          { id: 6, title: '두 번째' },
          { id: 7, title: '세 번째' },
        ]}
      />
    );

    expect(screen.getByText('미분류 글 3개')).toBeInTheDocument();
    expect(screen.getByText(/외 2개/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '지정하기' })).toHaveAttribute(
      'href',
      '/admin/posts/5/edit'
    );
  });
});
```

- [x] **Step 3: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/categories/_components/
```

기대: 두 파일 모두 FAIL — import 해결 실패.

- [x] **Step 4: 타입 추가**

`src/types/category.ts` 끝에 추가한다.

```ts
/** 글 수를 함께 집계한 카테고리 (어드민 카테고리 보드용) */
export type CategoryWithCount = Category & { postCount: number };
```

`src/types/index.ts`의 category 줄을 교체한다.

```ts
export type { Category, CategoryWithCount, CategoryFormValues } from './category';
```

- [x] **Step 5: 컴포넌트 작성**

`src/app/admin/categories/_components/category-card.tsx`:

```tsx
import { FolderOpen } from 'lucide-react';
import type { CategoryWithCount } from '@/types';
import { CategoryActionsCell } from './category-actions-cell';

type Props = {
  category: CategoryWithCount;
};

export function CategoryCard({ category }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-4">
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
        <FolderOpen size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{category.name}</span>
          <span className="text-muted-foreground font-mono text-xs">
            /{category.slug}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">
          {category.description
            ? `${category.description} · 글 ${category.postCount}개`
            : `글 ${category.postCount}개`}
        </p>
      </div>

      <CategoryActionsCell category={category} />
    </div>
  );
}
```

`src/app/admin/categories/_components/uncategorized-banner.tsx`:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  posts: { id: number; title: string }[];
};

export function UncategorizedBanner({ posts }: Props) {
  if (posts.length === 0) return null;

  const [first, ...rest] = posts;

  return (
    <div className="bg-muted mt-6 flex items-center gap-4 rounded-2xl px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">미분류 글 {posts.length}개</p>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">
          “{first.title || '(제목 없음)'}”
          {rest.length > 0 && ` 외 ${rest.length}개`} — 카테고리를 지정하면
          블로그 목록에서 필터링됩니다
        </p>
      </div>
      <Button className="rounded-full" asChild>
        <Link href={`/admin/posts/${first.id}/edit`}>지정하기</Link>
      </Button>
    </div>
  );
}
```

- [x] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/categories/_components/
```

기대: 3 + 3 = 6개 PASS.

- [x] **Step 7: 쿼리 추가**

`src/db/queries/categories.ts`의 `getCategories` 뒤에 추가한다.

**먼저 import를 고친다** — 확인 결과 이 파일은 drizzle-orm에서 `{ eq }`만, 스키마에서 `{ categories }`만 가져온다. 둘 다 늘려야 한다.

```ts
import { asc, count, eq, isNull } from 'drizzle-orm';
import { categories, posts } from '@/db/schema';
```

`CategoryWithCount` 타입 import도 추가한다.

```ts
import type { Category, CategoryWithCount } from '@/types';
```

```ts
/**
 * 카테고리 목록 + 글 수 집계 (이름 순)
 */
export const getCategoriesWithPostCount = unstable_cache(
  async (): Promise<CategoryWithCount[]> => {
    const rows = await db
      .select({
        category: categories,
        postCount: count(posts.id),
      })
      .from(categories)
      .leftJoin(posts, eq(posts.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return rows.map(({ category, postCount }) => ({ ...category, postCount }));
  },
  ['categories-with-count'],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.posts] }
);

/**
 * 카테고리가 지정되지 않은 글 (오래된 순)
 */
export const selectUncategorizedPosts = unstable_cache(
  async (): Promise<{ id: number; title: string }[]> => {
    return db
      .select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(isNull(posts.categoryId))
      .orderBy(asc(posts.createdAt));
  },
  ['uncategorized-posts'],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.posts] }
);
```

- [x] **Step 8: 보드 액션 작성**

`src/app/admin/categories/_actions/category-board.action.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CategoryWithCount } from '@/types';
import { CategoryCard } from '../_components/category-card';
import { CategoryFormDialogAction } from './category-form-dialog.action';

type Props = {
  categories: CategoryWithCount[];
};

export function CategoryBoardAction({ categories }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}

        <Button
          variant="ghost"
          onClick={() => setFormOpen(true)}
          className="text-muted-foreground h-auto justify-start gap-3 rounded-2xl border border-dashed p-4"
        >
          <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Plus size={18} />
          </span>
          카테고리 추가
        </Button>
      </div>

      <CategoryFormDialogAction open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
```

- [x] **Step 9: 페이지 교체**

`src/app/admin/categories/page.tsx`:

```tsx
import {
  getCategoriesWithPostCount,
  selectUncategorizedPosts,
} from '@/db/queries/categories';
import { AdminPageHeader } from '../_components/admin-page-header';
import { CategoryBoardAction } from './_actions/category-board.action';
import { UncategorizedBanner } from './_components/uncategorized-banner';

export default async function AdminCategoriesPage() {
  const [categories, uncategorized] = await Promise.all([
    getCategoriesWithPostCount(),
    selectUncategorizedPosts(),
  ]);

  const categorizedCount = categories.reduce(
    (sum, category) => sum + category.postCount,
    0
  );

  return (
    <div>
      <AdminPageHeader
        title="카테고리"
        description={
          uncategorized.length > 0
            ? `글 ${categorizedCount}개가 카테고리에 묶여 있고, ${uncategorized.length}개는 아직 미분류입니다`
            : `글 ${categorizedCount}개가 카테고리에 묶여 있습니다`
        }
      />

      <CategoryBoardAction categories={categories} />
      <UncategorizedBanner posts={uncategorized} />
    </div>
  );
}
```

- [x] **Step 10: 전체 테스트 확인**

```bash
npm run test:run
```

기대: 전부 PASS.

- [x] **Step 11: 커밋**

```bash
git add src/types/category.ts src/types/index.ts src/db/queries/categories.ts src/app/admin/categories/
git commit -m "💄 style: 카테고리를 카드 그리드 + 미분류 배너로 교체"
```

---

## Task 6: 태그 칩 보드 (시안 1d)

**Files:**
- Create: `src/app/admin/tags/_components/tag-chip.tsx`
- Test: `src/app/admin/tags/_components/tag-chip.test.tsx`
- Create: `src/app/admin/tags/_actions/tag-board.action.tsx`
- Test: `src/app/admin/tags/_actions/tag-board.action.test.tsx`
- Modify: `src/app/admin/tags/page.tsx`

**Interfaces:**
- Consumes: Task 3의 `removeUnusedTags`, `TagWithCount`. 기존 `addTag`(`admin/posts/new/_services/add-tag.ts`), `DeleteTagAction`. PR 1의 `AdminPageHeader`.
- Produces:
  - `TagChip({ tag }: { tag: TagWithCount })` — 순수 칩. 사용 중이면 이름 + 개수, 미사용이면 흐리게 + 삭제 버튼.
  - `TagBoardAction({ tags }: { tags: TagWithCount[] })`.

> **`TagRow` 참조 정리 필요.** `TagRow`는 삭제 예정인 `_components/columns.tsx`에 정의돼 있고 네 파일이 참조한다. 그중 둘(`tag-table.tsx`, `tag-actions-cell.tsx`)은 Task 8에서 함께 지워지지만, 나머지 둘은 살아남으므로 이 태스크에서 `TagWithCount`로 바꿔야 Task 8이 깨지지 않는다.
>
> - `src/app/admin/tags/_actions/delete-tag.action.tsx:6,10` — 고친다
> - `src/app/admin/tags/_actions/delete-tag-dialog.action.tsx:13,19` — 고친다
> - `src/app/admin/tags/_components/tag-table.tsx` — Task 8에서 삭제
> - `src/app/admin/tags/_components/tag-actions-cell.tsx` — Task 8에서 삭제

- [x] **Step 1: 실패하는 테스트 작성 — 칩**

`src/app/admin/tags/_components/tag-chip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TagWithCount } from '@/types';
import { TagChip } from './tag-chip';

vi.mock('../_actions/delete-tag.action', () => ({
  DeleteTagAction: () => <button type="button">삭제</button>,
}));

const usedTag: TagWithCount = {
  id: 1,
  name: '4k모니터',
  slug: '4k-monitor',
  createdAt: new Date('2026-01-01'),
  postCount: 3,
};

describe('TagChip', () => {
  it('사용 중 태그는 이름과 개수를 보여준다', () => {
    render(<TagChip tag={usedTag} />);

    expect(screen.getByText('#4k모니터')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('사용 중 태그에는 삭제 버튼이 없다', () => {
    render(<TagChip tag={usedTag} />);
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('미사용 태그는 개수 없이 삭제 버튼을 보여준다', () => {
    render(<TagChip tag={{ ...usedTag, postCount: 0 }} />);

    expect(screen.getByText('#4k모니터')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패하는 테스트 작성 — 보드**

`src/app/admin/tags/_actions/tag-board.action.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TagWithCount } from '@/types';
import { TagBoardAction } from './tag-board.action';

vi.mock('../_components/tag-chip', () => ({
  TagChip: ({ tag }: { tag: TagWithCount }) => (
    <span data-testid={`chip-${tag.id}`}>#{tag.name}</span>
  ),
}));

vi.mock('@/app/admin/posts/new/_services/add-tag', () => ({
  addTag: vi.fn(async () => ({ success: true, tag: { id: 9, name: 'new', slug: 'new' } })),
}));

vi.mock('../_services/remove-unused-tags', () => ({
  removeUnusedTags: vi.fn(async () => ({ success: true, removed: 1 })),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const tags: TagWithCount[] = [
  { id: 1, name: '4k모니터', slug: '4k', createdAt: new Date(), postCount: 3 },
  { id: 2, name: 'nextjs', slug: 'nextjs', createdAt: new Date(), postCount: 1 },
  { id: 3, name: 'dell', slug: 'dell', createdAt: new Date(), postCount: 0 },
];

describe('TagBoardAction', () => {
  it('사용 중 태그와 미사용 태그를 분리해 렌더한다', () => {
    render(<TagBoardAction tags={tags} />);

    expect(screen.getByText('사용 중')).toBeInTheDocument();
    expect(screen.getByText('글에 쓰이지 않음')).toBeInTheDocument();
    expect(screen.getByTestId('chip-1')).toBeInTheDocument();
    expect(screen.getByTestId('chip-3')).toBeInTheDocument();
  });

  it('미사용 태그가 있으면 정리 버튼을 보여준다', () => {
    render(<TagBoardAction tags={tags} />);
    expect(
      screen.getByRole('button', { name: /미사용 1개 정리/ })
    ).toBeInTheDocument();
  });

  it('미사용 태그가 없으면 정리 버튼과 미사용 섹션이 없다', () => {
    render(<TagBoardAction tags={tags.filter((tag) => tag.postCount > 0)} />);

    expect(screen.queryByText('글에 쓰이지 않음')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /정리/ })).not.toBeInTheDocument();
  });

  it('새 태그 입력창을 렌더한다', () => {
    render(<TagBoardAction tags={tags} />);
    expect(
      screen.getByPlaceholderText('새 태그 이름을 입력하고 Enter')
    ).toBeInTheDocument();
  });
});
```

- [x] **Step 3: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/tags/
```

기대: 두 신규 파일 FAIL — import 해결 실패. 기존 태그 테스트가 있으면 그대로 PASS.

- [x] **Step 4: `DeleteTagAction`의 타입 참조 교체**

`src/app/admin/tags/_actions/delete-tag.action.tsx`와 `delete-tag-dialog.action.tsx`에서 `import type { TagRow } from '../_components/columns'`를 아래로 바꾸고, 사용처의 `TagRow`를 `TagWithCount`로 교체한다.

```tsx
import type { TagWithCount } from '@/types';
```

- [x] **Step 5: 칩 컴포넌트 작성**

`src/app/admin/tags/_components/tag-chip.tsx`:

```tsx
import type { TagWithCount } from '@/types';
import { DeleteTagAction } from '../_actions/delete-tag.action';

type Props = {
  tag: TagWithCount;
};

export function TagChip({ tag }: Props) {
  const isUnused = tag.postCount === 0;

  if (isUnused) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-sm">
        #{tag.name}
        <DeleteTagAction tag={tag} />
      </span>
    );
  }

  return (
    <span className="bg-muted inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm">
      #{tag.name}
      <span className="bg-background text-muted-foreground rounded-full px-1.5 text-xs">
        {tag.postCount}
      </span>
    </span>
  );
}
```

- [x] **Step 6: 보드 액션 작성**

`src/app/admin/tags/_actions/tag-board.action.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addTag } from '@/app/admin/posts/new/_services/add-tag';
import type { TagWithCount } from '@/types';
import { TagChip } from '../_components/tag-chip';
import { removeUnusedTags } from '../_services/remove-unused-tags';

type Props = {
  tags: TagWithCount[];
};

export function TagBoardAction({ tags }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  const usedTags = tags.filter((tag) => tag.postCount > 0);
  const unusedTags = tags.filter((tag) => tag.postCount === 0);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !name.trim()) return;
    event.preventDefault();

    startTransition(async () => {
      const result = await addTag(name);
      if (result.success) {
        setName('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCleanup = () => {
    startTransition(async () => {
      const result = await removeUnusedTags();
      if (result.success) {
        toast.success(`미사용 태그 ${result.removed}개를 정리했습니다`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        placeholder="새 태그 이름을 입력하고 Enter"
      />

      <section>
        <h2 className="text-muted-foreground mb-2 text-sm">사용 중</h2>
        {usedTags.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            글에 붙은 태그가 없습니다.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usedTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </section>

      {unusedTags.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-muted-foreground text-sm">글에 쓰이지 않음</h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleCleanup}
              className="text-status-danger hover:text-status-danger"
            >
              미사용 {unusedTags.length}개 정리
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {unusedTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [x] **Step 7: 글 저장 시 태그 캐시 무효화 고치기**

`src/app/admin/posts/new/_services/save-post.ts`는 `post_tags`를 통째로 다시 쓰면서(`:137-141`) `CACHE_TAGS.posts`와 `CACHE_TAGS.series`만 무효화하고 **`CACHE_TAGS.tags`는 무효화하지 않는다**(`:96-98`, `:123-125`). 그래서 에디터에서 글의 태그를 바꿔도 `getAllTags()`의 `postCount`가 갱신되지 않는다.

기존 표 화면에서는 숫자 하나가 잠깐 틀린 정도였지만, 이 태스크의 칩 보드는 그 숫자로 **사용 중 / 글에 쓰이지 않음 구획 자체를 나누고** [미사용 N개 정리] 버튼까지 붙는다. 마지막 사용처를 지운 태그가 계속 "사용 중"에 남거나, 반대로 방금 붙인 태그가 미사용으로 표시돼 정리 대상처럼 보인다. (실제 삭제는 `deleteUnusedTags`가 SQL에서 다시 판정하므로 안전하지만, "0개 정리했습니다"가 뜨는 혼란이 생긴다.)

`save-post.ts`의 revalidate 블록 **두 곳 모두**에 한 줄씩 추가한다.

```ts
      revalidateTag(CACHE_TAGS.tags, 'max');
```

- [x] **Step 8: 페이지 교체**

`src/app/admin/tags/page.tsx`:

```tsx
import { getAllTags } from '@/db/queries/tags';
import { AdminPageHeader } from '../_components/admin-page-header';
import { TagBoardAction } from './_actions/tag-board.action';

export default async function AdminTagsPage() {
  const tags = await getAllTags();
  const unusedCount = tags.filter((tag) => tag.postCount === 0).length;

  return (
    <div>
      <AdminPageHeader
        title="태그 관리"
        description={
          unusedCount > 0
            ? `태그 ${tags.length}개 · 이 중 ${unusedCount}개는 글에 쓰이지 않음`
            : `태그 ${tags.length}개`
        }
      />
      <TagBoardAction tags={tags} />
    </div>
  );
}
```

- [x] **Step 9: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/tags/ src/app/admin/posts/new/_services/save-post.test.ts
```

기대: 신규 3 + 4 = 7개 PASS. Step 7에서 `save-post.ts`를 고쳤으므로 기존 `save-post.test.ts`(13개)도 함께 돌려 회귀가 없는지 확인한다 — 이 테스트는 `revalidateTag`를 mock하고 호출 여부를 단언하지 않으므로 통과해야 한다.

- [x] **Step 10: 커밋**

```bash
git add src/app/admin/tags/ src/app/admin/posts/new/_services/save-post.ts
git commit -m "💄 style: 태그 관리를 칩 보드 + 미사용 정리로 교체"
```

---

## Task 7: 시리즈 스택 (시안 3d)

**Files:**
- Modify: `src/db/queries/series.ts` (`selectSeriesListForAdmin` 추가)
- Create: `src/app/admin/series/_components/series-stack-item.tsx`
- Test: `src/app/admin/series/_components/series-stack-item.test.tsx`
- Create: `src/app/admin/series/_actions/series-stack.action.tsx`
- Modify: `src/app/admin/series/page.tsx`

**Interfaces:**
- Consumes: Task 1의 `series.status`. 기존 `SeriesActionsCell`, `SeriesFormDialogAction`. PR 1의 `AdminPageHeader`.
- Produces:
  - `AdminSeriesItem = Series & { posts: { id: number; title: string; publishedAt: Date | null; status: 'draft' | 'published' }[] }` — `src/types/series.ts`에 추가하고 `types/index.ts`에서 재export.
  - `selectSeriesListForAdmin(): Promise<AdminSeriesItem[]>` — 시리즈별 회차를 **임시저장 포함** `publishedAt ASC NULLS LAST, createdAt ASC` 순으로 담아 돌려준다.
  - `SeriesStackItem({ series, isExpanded, onToggle })` — 순수 컴포넌트, 펼침 상태는 부모가 소유.

**시안 반영 항목**

- 시리즈 행: 이름 + 연재 중/완결 뱃지, `설명 · N편`, 펼침 chevron
- 펼치면 회차 목록: 번호 원형 뱃지 + 제목 + 발행일. 임시저장 회차는 번호를 흐리게 하고 `bg-status-draft` 뱃지
- 회차 목록 아래 점선 [+ 이 시리즈에 글 추가] → `/admin/posts/new`
- **드래그 핸들 없음** (스펙에서 정렬 기능 제외)

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/series/_components/series-stack-item.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminSeriesItem } from '@/types';
import { SeriesStackItem } from './series-stack-item';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./series-actions-cell', () => ({
  SeriesActionsCell: () => <div data-testid="series-actions" />,
}));

const series = {
  id: 1,
  name: '블로그 만들기',
  slug: 'building-blog',
  description: 'Next.js로 블로그를 처음부터 만드는 기록',
  status: 'ongoing',
  createdAt: new Date('2026-04-01'),
  posts: [
    {
      id: 11,
      title: 'Next.js 15 App Router 이전기',
      publishedAt: new Date('2026-04-14'),
      status: 'published',
    },
    {
      id: 12,
      title: '배포와 이미지 최적화',
      publishedAt: null,
      status: 'draft',
    },
  ],
} as AdminSeriesItem;

describe('SeriesStackItem', () => {
  it('이름·설명·편수를 렌더한다', () => {
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={vi.fn()} />
    );

    expect(screen.getByText('블로그 만들기')).toBeInTheDocument();
    expect(screen.getByText(/2편/)).toBeInTheDocument();
  });

  it('연재 중 뱃지를 보여준다', () => {
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={vi.fn()} />
    );
    expect(screen.getByText('연재 중')).toBeInTheDocument();
  });

  it('완결이면 완결 뱃지를 보여준다', () => {
    render(
      <SeriesStackItem
        series={{ ...series, status: 'completed' }}
        isExpanded={false}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('완결')).toBeInTheDocument();
  });

  it('접힌 상태에서는 회차 목록을 렌더하지 않는다', () => {
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={vi.fn()} />
    );
    expect(
      screen.queryByText('Next.js 15 App Router 이전기')
    ).not.toBeInTheDocument();
  });

  it('펼친 상태에서는 회차와 글 추가 링크를 렌더한다', () => {
    render(
      <SeriesStackItem series={series} isExpanded onToggle={vi.fn()} />
    );

    expect(screen.getByText('Next.js 15 App Router 이전기')).toBeInTheDocument();
    expect(screen.getByText('임시저장')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /이 시리즈에 글 추가/ })
    ).toHaveAttribute('href', '/admin/posts/new');
  });

  it('토글 버튼을 누르면 onToggle이 호출된다', () => {
    const onToggle = vi.fn();
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={onToggle} />
    );

    fireEvent.click(screen.getByRole('button', { name: /블로그 만들기/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('드래그 핸들을 렌더하지 않는다', () => {
    const { container } = render(
      <SeriesStackItem series={series} isExpanded onToggle={vi.fn()} />
    );
    expect(container.querySelector('[data-drag-handle]')).not.toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/series/_components/series-stack-item.test.tsx
```

기대: FAIL — import 해결 실패.

- [x] **Step 3: 타입 추가**

`src/types/series.ts`의 `SeriesWithMeta` 뒤에 추가한다.

```ts
/** 어드민 시리즈 스택 — 임시저장 포함 전체 회차 */
export type AdminSeriesItem = Series & {
  posts: {
    id: number;
    title: string;
    publishedAt: Date | null;
    status: 'draft' | 'published';
  }[];
};
```

`src/types/index.ts`의 series 블록에 `AdminSeriesItem`을 추가한다.

- [x] **Step 4: 컴포넌트 작성**

`src/app/admin/series/_components/series-stack-item.tsx`:

```tsx
import Link from 'next/link';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AdminSeriesItem } from '@/types';
import { SeriesActionsCell } from './series-actions-cell';

type Props = {
  series: AdminSeriesItem;
  isExpanded: boolean;
  onToggle: () => void;
};

export function SeriesStackItem({ series, isExpanded, onToggle }: Props) {
  const isCompleted = series.status === 'completed';

  return (
    <div className="rounded-2xl border">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{series.name}</span>
              <Badge variant={isCompleted ? 'secondary' : 'default'}>
                {isCompleted ? '완결' : '연재 중'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {series.description
                ? `${series.description} · ${series.posts.length}편`
                : `${series.posts.length}편`}
            </p>
          </div>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <SeriesActionsCell series={series} />
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-3">
          <ol className="flex flex-col gap-1">
            {series.posts.map((post, index) => {
              const isDraft = post.status === 'draft';
              return (
                <li key={post.id} className="flex items-center gap-3 py-1.5">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                      isDraft
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm hover:underline',
                      isDraft && 'text-muted-foreground'
                    )}
                  >
                    {post.title || '(제목 없음)'}
                  </Link>
                  {isDraft ? (
                    <Badge className="bg-status-draft text-foreground">
                      임시저장
                    </Badge>
                  ) : (
                    post.publishedAt && (
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(post.publishedAt), 'M월 d일', {
                          locale: ko,
                        })}
                      </span>
                    )
                  )}
                </li>
              );
            })}
          </ol>

          <Link
            href="/admin/posts/new"
            className="text-muted-foreground hover:text-foreground mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed py-2 text-sm transition-colors"
          >
            <Plus size={14} />이 시리즈에 글 추가
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 5: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/series/_components/series-stack-item.test.tsx
```

기대: 8개 PASS.

- [x] **Step 6: 쿼리 추가**

`src/db/queries/series.ts`의 `selectSeriesList` 뒤에 추가한다. `asc`·`sql` import를 확인한다.

```ts
/**
 * 어드민 시리즈 목록 — 임시저장 포함 전체 회차를 담는다.
 * 회차 순서는 publishedAt ASC(미발행은 뒤), 같으면 createdAt ASC.
 */
export const selectSeriesListForAdmin = unstable_cache(
  async (): Promise<AdminSeriesItem[]> => {
    const [seriesRows, postRows] = await Promise.all([
      db.select().from(series).orderBy(desc(series.createdAt)),
      db
        .select({
          id: posts.id,
          title: posts.title,
          seriesId: posts.seriesId,
          publishedAt: posts.publishedAt,
          status: posts.status,
        })
        .from(posts)
        .where(isNotNull(posts.seriesId))
        .orderBy(sql`${posts.publishedAt} asc nulls last`, asc(posts.createdAt)),
    ]);

    return seriesRows.map((row) => ({
      ...row,
      posts: postRows
        .filter((post) => post.seriesId === row.id)
        .map(({ id, title, publishedAt, status }) => ({
          id,
          title,
          publishedAt,
          status,
        })),
    }));
  },
  ['admin-series-list'],
  { tags: [CACHE_TAGS.series, CACHE_TAGS.posts] }
);
```

- [x] **Step 7: 스택 액션 작성**

`src/app/admin/series/_actions/series-stack.action.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminSeriesItem } from '@/types';
import { SeriesStackItem } from '../_components/series-stack-item';
import { SeriesFormDialogAction } from './series-form-dialog.action';

type Props = {
  seriesList: AdminSeriesItem[];
};

export function SeriesStackAction({ seriesList }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(
    seriesList[0]?.id ?? null
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {seriesList.map((series) => (
          <SeriesStackItem
            key={series.id}
            series={series}
            isExpanded={expandedId === series.id}
            onToggle={() =>
              setExpandedId((current) =>
                current === series.id ? null : series.id
              )
            }
          />
        ))}

        <Button
          variant="ghost"
          onClick={() => setFormOpen(true)}
          className="text-muted-foreground h-auto justify-center gap-2 rounded-2xl border border-dashed py-3"
        >
          <Plus size={16} />
          시리즈 추가
        </Button>
      </div>

      <SeriesFormDialogAction open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
```

- [x] **Step 8: 페이지 교체**

`src/app/admin/series/page.tsx`:

```tsx
import { selectSeriesListForAdmin } from '@/db/queries/series';
import { AdminPageHeader } from '../_components/admin-page-header';
import { SeriesStackAction } from './_actions/series-stack.action';

export default async function AdminSeriesPage() {
  const seriesList = await selectSeriesListForAdmin();

  const ongoingCount = seriesList.filter(
    (series) => series.status === 'ongoing'
  ).length;

  return (
    <div>
      <AdminPageHeader
        title="시리즈"
        description={`연재 ${ongoingCount}개 · 완결 ${seriesList.length - ongoingCount}개`}
      />
      <SeriesStackAction seriesList={seriesList} />
    </div>
  );
}
```

> **타입 낮추기 필요.** 아래 네 파일이 prop을 `SeriesWithMeta`로 받는데, `AdminSeriesItem`에는 `postCount`/`thumbnailUrl`/`lastPublishedAt`이 없어 타입이 맞지 않는다. 이 스텝에서 넷 다 `Series`(공통 상위 타입)로 낮춘다 — 모두 `id`·`name`만 쓰므로 안전하다.
>
> - `src/app/admin/series/_components/series-actions-cell.tsx:6`
> - `src/app/admin/series/_actions/edit-series.action.tsx:10`
> - `src/app/admin/series/_actions/delete-series.action.tsx:10`
> - `src/app/admin/series/_actions/delete-series-dialog.action.tsx:19`
>
> `src/app/admin/posts/new/_actions/series-selector.action.tsx`도 `SeriesWithMeta`를 쓰지만 에디터 화면이 `selectSeriesList`(변경 없음)로 채우므로 건드리지 않는다. `npx tsc --noEmit`으로 확인한다.

- [x] **Step 9: 전체 테스트·타입 확인**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 전부 PASS. tsc 신규 에러 0건.

- [x] **Step 10: 커밋**

```bash
git add src/types/series.ts src/types/index.ts src/db/queries/series.ts src/app/admin/series/
git commit -m "💄 style: 시리즈 관리를 접힘 스택으로 교체"
```

---

## Task 8: `@tanstack/react-table` 제거

**Files:**
- Delete: `src/components/data-table.tsx`
- Delete: `src/app/admin/posts/_components/columns.tsx` + `src/app/admin/posts/_components/columns.test.tsx` (3개 테스트, 존재 확인됨)
- Delete: `src/app/admin/categories/_components/columns.tsx`
- Delete: `src/app/admin/series/_components/columns.tsx`
- Delete: `src/app/admin/tags/_components/columns.tsx`
- Delete: `src/app/admin/tags/_components/tag-table.tsx`
- Delete: `src/app/admin/tags/_components/tag-actions-cell.tsx`
- Delete: `src/app/admin/categories/_actions/category-table.action.tsx`
- Delete: `src/app/admin/series/_actions/series-table.action.tsx`
- Modify: `package.json`
- Modify: `src/app/admin/posts/loading.tsx`, `src/app/admin/categories/loading.tsx`, `src/app/admin/series/loading.tsx`

**Interfaces:**
- Consumes: Task 4~7이 모든 표 사용처를 교체했다는 사실
- Produces: 없음 (제거 전용)

- [x] **Step 1: 남은 사용처가 없는지 확인**

```bash
grep -rn "data-table\|@tanstack/react-table\|DataTable" src/
```

기대: Task 8에서 지울 파일들 안에서만 나온다. 그 밖의 파일이 나오면 멈추고 보고한다 — Task 4~7이 놓친 화면이 있다는 뜻이다.

- [x] **Step 2: 파일 삭제**

```bash
git rm src/components/data-table.tsx \
  src/app/admin/posts/_components/columns.tsx \
  src/app/admin/posts/_components/columns.test.tsx \
  src/app/admin/categories/_components/columns.tsx \
  src/app/admin/series/_components/columns.tsx \
  src/app/admin/tags/_components/columns.tsx \
  src/app/admin/tags/_components/tag-table.tsx \
  src/app/admin/tags/_components/tag-actions-cell.tsx \
  src/app/admin/categories/_actions/category-table.action.tsx \
  src/app/admin/series/_actions/series-table.action.tsx
```

- [x] **Step 3: 의존성 제거**

```bash
npm uninstall @tanstack/react-table
```

- [x] **Step 4: 스켈레톤 갱신**

`src/app/admin/posts/loading.tsx`의 `<div className="rounded-lg border">` 블록을 새 행 레이아웃에 맞춰 교체한다.

```tsx
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border p-4">
            <Skeleton className="size-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
```

`src/app/admin/categories/loading.tsx`의 같은 블록을 카드 그리드로 교체한다.

```tsx
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
```

`src/app/admin/series/loading.tsx`의 같은 블록을 스택으로 교체한다.

```tsx
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="size-5 rounded-full" />
          </div>
        ))}
      </div>
```

- [x] **Step 5: 전체 검증**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 전부 PASS(삭제된 `columns.test.tsx` 개수만큼 줄어든다), tsc 신규 에러 0건. 어느 쪽이든 실패하면 삭제한 파일에 남은 참조가 있다는 뜻이니 그 참조를 고친다.

- [x] **Step 6: 커밋**

```bash
git add -A src/ package.json package-lock.json
git commit -m "🔥 remove: 표 화면 제거에 따라 @tanstack/react-table 의존성 삭제"
```

---

## Task 9: 검증

**Files:** 없음 (검증 전용)

**Interfaces:**
- Consumes: Task 1~8 전부
- Produces: 없음

- [x] **Step 1: 단위 테스트 전체 실행**

```bash
npm run test:run
```

기대: 전부 PASS.

- [x] **Step 2: 린트**

```bash
npm run lint
```

기대: 이 PR이 건드린 파일에서 신규 에러 0건. `docs/design/ralli/support.js`의 기존 에러 2건은 그대로 둔다.

- [x] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건. `e2e/ralli.spec.ts:57`의 기존 에러 1건만 잔존.

> 검증 중 Task 1 fix round 1이 유발한 tsc 에러 2건(zodResolver 제네릭 불일치)을 발견해 `SeriesFormValues`를 `z.input`으로 수정했다(커밋 `d127780`). 독립 리뷰로 런타임 동작 변화 없음을 확인했다.

- [x] **Step 4: 빌드**

```bash
npm run build
```

기대: 타입스크립트 컴파일 통과. 워크트리에 `DATABASE_URL`이 없으면 sitemap 데이터 수집 단계에서 실패하는데 이는 환경 문제다 — 컴파일 단계까지 성공했음을 확인하고 넘어간다.

> 빌드 전체(정적 페이지 생성 포함) 성공. `DATABASE_URL`이 워크트리 환경에 설정돼 있어 sitemap 단계도 정상 통과했다.

- [ ] **Step 5: 브라우저 육안 확인 (사용자 확인 필요)**

`/admin/*`은 Clerk 인증을 요구하므로 로그인 세션 없이는 에이전트가 확인할 수 없다. **아래는 사용자가 직접 확인한다.**

- [ ] 글 관리: 썸네일 있는 글/없는 글이 모두 정상 렌더되고, 발행 스위치를 켜고 끄면 목록이 갱신된다
- [ ] 글 관리: 스위치를 껐다 다시 켜도 발행일이 "지금"으로 리셋되지 않는다 (「결정 사항」의 `publishedAt` 보존)
- [ ] 글 관리: [전체][발행][임시] 필터가 URL과 함께 동작한다
- [ ] 카테고리: 카드 그리드와 [카테고리 추가] 점선 카드가 정상 동작하고, 수정·삭제 다이얼로그가 그대로 뜬다
- [ ] 카테고리: 미분류 글이 있으면 배너가 뜨고 [지정하기]가 해당 글 편집 화면으로 간다. 미분류가 0개면 배너가 없다
- [ ] 태그: 입력창에 이름 넣고 Enter 하면 칩이 추가된다
- [ ] 태그: 미사용 태그가 흐린 점선 칩으로 구분되고 [미사용 N개 정리]가 동작한다
- [ ] 시리즈: 연재 중/완결 뱃지가 맞게 뜨고, 폼에서 상태를 바꾸면 반영된다
- [ ] 시리즈: 스택을 접었다 펴면 회차 목록이 번호 순으로 뜨고 임시저장 회차가 구분된다
- [ ] 다크 모드에서 네 화면 모두 대비가 읽을 만하다 (특히 발행 스위치 초록·임시저장 앰버·미사용 정리 빨강)
- [ ] 블로그 화면(`/`)이 이 PR 전후로 달라지지 않았다

- [x] **Step 6: plan 문서 완료 기록**

이 문서 상단에 완료 일자와 결과 요약을 추가하고, 모든 체크박스를 `- [x]`로 반영한다.

- [x] **Step 7: PR 생성 (사용자 확인 필요)**

`develop`으로의 PR 생성은 공유 브랜치에 영향을 주므로 사용자 확인 없이 진행하지 않는다. 머지는 squash 금지, `--no-ff` 머지 커밋 방식이다.

---

## Self-Review 기록

**스펙 커버리지** — 이 PR이 담당하는 스펙 항목: 1b 글 관리(Task 4), 3a 카테고리(Task 5), 1d 태그(Task 6), 3d 시리즈(Task 7), `series.status` 컬럼(Task 1), 발행 토글 Server Action(Task 2), 미사용 태그 정리 Server Action(Task 3), 카테고리별 글 수·글별 댓글 수 집계 쿼리(Task 5·4), `@tanstack/react-table` 제거(Task 8). 스펙의 나머지 항목(댓글·통계·설정·`comments.isAuthor`·`blog_settings.referrerExcludes`)은 「이 PR의 범위 밖」에 명시했다.

**타입 일관성** — `AdminPostRow`(Task 4), `CategoryWithCount`(Task 5), `TagWithCount`(Task 3), `AdminSeriesItem`(Task 7)을 각각 정의한 태스크에서 `types/index.ts`에 재export하고, 소비하는 태스크가 같은 이름으로 import한다. `TagWithCount`는 Task 3에서 정의하고 Task 6이 소비하므로 순서가 맞다 — Task 6의 Step 4가 `DeleteTagAction`의 `TagRow` 참조를 미리 교체해, Task 8이 `columns.tsx`를 지울 때 깨지지 않는다.

**태스크 간 파일 충돌** — `src/types/index.ts`를 Task 3·4·5·7이 각각 수정한다. 서로 다른 export 줄을 건드리므로 충돌하지 않지만, 순차 실행이 전제다. `src/db/queries/posts.ts`는 Task 2(`updatePostStatus` 추가)와 Task 4(`getAllPostsForAdmin` 교체)가 건드린다 — 서로 다른 함수라 안전하다.

**플레이스홀더 스캔** — 모든 코드 스텝에 실제 코드가 들어 있고, 실행 커맨드와 기대 결과를 명시했다. "적절히 처리" 류 문구 없음.

**import 검증 완료** — 각 쿼리 파일의 현재 import를 직접 읽어 확인했고, 부족한 것을 Task 2·3·4·5의 해당 스텝에 정확한 줄로 적어 두었다. 요약: `posts.ts`는 `sql`만, `tags.ts`는 `notExists`만, `categories.ts`는 `asc`·`count`·`isNull` + 스키마 `posts` + 타입 `CategoryWithCount`가 필요하다. `posts.ts`의 스키마 import(`comments`·`postTags`·`tags`)는 이미 전부 들어 있다.

**캐시 무효화 검증에서 결함 발견** — 댓글·태그 mutation의 revalidate 범위를 추적한 결과, `save-post.ts`가 `post_tags`를 다시 쓰면서 `CACHE_TAGS.tags`를 무효화하지 않는 기존 결함을 찾았다. 표 화면에서는 숫자 하나가 잠깐 틀리는 정도였지만 칩 보드는 그 숫자로 구획을 나누므로 눈에 띄게 된다. Task 6 Step 7로 편입했다. 반대로 댓글 쪽은 문제없다 — `add-comment`/`remove-comment` 모두 `CACHE_TAGS.comments`를 무효화하고, Task 4가 `getAllPostsForAdmin`의 태그 목록에 `comments`를 넣으므로 댓글 수가 자동으로 갱신된다.

**미확인 사항** — Task 4의 `getAllPostsForAdmin`과 Task 7의 `selectSeriesListForAdmin`은 raw `sql` 조각(`array_agg`, `nulls last`)을 쓴다. 이 저장소의 다른 쿼리들도 `sql` 태그를 쓰고 있어 패턴 자체는 낯설지 않지만, 실제 DB에서의 결과 형태(특히 `array_agg`가 빈 배열을 돌려주는지)는 Step 5의 육안 확인에서 처음 검증된다. 구현자가 `npx drizzle-kit studio`로 직접 쿼리를 돌려 확인해도 좋다.
