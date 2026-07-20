# 라우트 전환 성능 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 페이지를 다시 정적 렌더링 대상으로 되돌리고 `<Link>` prefetch를 복원해 라우트 전환 체감 지연을 제거한다 (스펙: `docs/superpowers/specs/2026-07-21-route-navigation-perf-design.md`).

**Architecture:** 근본 원인은 `Header`가 서버 컴포넌트로서 `@clerk/nextjs`의 서버 버전 `<SignedIn>`/`<SignedOut>`을 렌더해 `auth()`를 호출하고, 그 결과 `(main)` 그룹 전체가 동적 렌더링으로 강제된 것이다. Task 1에서 인증 UI만 `'use client'` 경계로 분리해 대부분의 공개 라우트를 정적으로 되돌린다. Task 2·3은 그래도 동적으로 남는 데이터 의존 라우트를 `loading.tsx` 경계와 쿼리 캐싱으로 보완한다.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, @clerk/nextjs 6, Drizzle ORM(Neon), Tailwind v4, shadcn/ui, Vitest, Playwright

## Global Constraints

- 브랜치: `develop`에서 `fix/route-navigation-perf` 생성. 완료 후 `develop`으로 PR(`--no-ff` 머지, squash 금지)
- 커밋 메시지는 gitmoji 사용 (성능 개선은 `⚡️`, 버그 수정은 `🐛`, 문서는 `📝`), 말미에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- 파일 배치: `src/components/nav/`의 공용 컴포넌트는 접미사 없는 kebab-case (`nav-links.tsx`, `mobile-menu.tsx` 관례). `_actions/*.action.tsx` 규칙은 라우트 폴더 전용이라 해당 없음
- React hook·타입은 named import (`import { useState } from 'react'`), `React.useState` 금지
- lucide 아이콘 크기는 `size` 속성, 조건부 클래스는 `cn()`
- `revalidateTag`는 이 코드베이스 시그니처인 `revalidateTag(CACHE_TAGS.xxx, 'max')` 형태를 따른다
- `console.log` 커밋 금지, 타입 단언(`as`) 지양
- 각 Step 완료 시 이 문서의 체크박스를 즉시 `- [x]`로 갱신한다

## 실행 순서 정책

**Task 1만 먼저 실행하고 멈춘다.** 배포 후 실제 체감 변화를 관측한 뒤 Task 2·3 진행 여부를 사용자가 결정한다. Task 2·3을 임의로 이어서 실행하지 않는다.

---

### Task 1: Clerk 인증 UI를 클라이언트 경계로 분리 (1단계)

**Files:**
- Create: `src/components/nav/header-auth.tsx`
- Create: `src/components/nav/header-auth.test.tsx`
- Modify: `src/components/nav/header.tsx`

**Interfaces:**
- Produces: `HeaderAdminLink()` — props 없음, 로그인 상태에서 `/admin` 대시보드 버튼 렌더
- Produces: `HeaderAuthButtons()` — props 없음, 비로그인 시 로그인 버튼 / 로그인 시 `UserButton` 렌더

- [x] **Step 1: 브랜치 생성**

```bash
git checkout develop
git pull
git checkout -b fix/route-navigation-perf
```

- [x] **Step 2: 실패 테스트 작성**

`@clerk/nextjs`를 mock해서 로그인/비로그인 상태별 렌더 결과를 검증한다. Clerk 컨트롤 컴포넌트는 실제 인증 컨텍스트가 필요하므로 mock이 필수다.

Create `src/components/nav/header-auth.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderAdminLink, HeaderAuthButtons } from './header-auth';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// 로그인 상태를 가정한 mock: SignedIn은 children을 렌더, SignedOut은 렌더하지 않는다
vi.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: () => null,
  ClerkLoading: () => null,
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
}));

describe('HeaderAdminLink', () => {
  it('로그인 상태에서 /admin 대시보드 링크를 렌더한다', () => {
    render(<HeaderAdminLink />);
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'href',
      '/admin'
    );
  });
});

describe('HeaderAuthButtons', () => {
  it('로그인 상태에서 UserButton을 렌더하고 로그인 버튼은 렌더하지 않는다', () => {
    render(<HeaderAuthButtons />);
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '로그인' })).not.toBeInTheDocument();
  });
});
```

- [x] **Step 3: 테스트가 실패하는지 확인**

Run: `npx vitest run src/components/nav/header-auth.test.tsx`
Expected: FAIL — `Failed to resolve import "./header-auth"` (파일 없음)

- [x] **Step 4: `header-auth.tsx` 생성**

Create `src/components/nav/header-auth.tsx`:

```tsx
'use client';

import Link from 'next/link';
import {
  ClerkLoading,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

/**
 * 로그인 상태에서만 노출되는 관리자 대시보드 진입 버튼.
 *
 * 이 파일이 'use client'인 이유: @clerk/nextjs의 SignedIn/SignedOut을 서버
 * 컴포넌트에서 렌더하면 내부적으로 auth()가 호출되어 Header를 포함한 (main)
 * 그룹 전체가 동적 렌더링으로 강제된다. 클라이언트 경계에서 import하면
 * 클라이언트 버전이 선택되어 공개 라우트의 정적 렌더링이 유지된다.
 */
export function HeaderAdminLink() {
  return (
    <SignedIn>
      <Link href="/admin" className="mr-1">
        <Button variant="default" size="sm">
          대시보드
        </Button>
      </Link>
    </SignedIn>
  );
}

/**
 * 비로그인 시 로그인 버튼, 로그인 시 UserButton.
 * 둘 중 하나는 반드시 렌더되므로 Clerk 로딩 중에는 동일 크기의
 * 플레이스홀더로 자리를 예약해 레이아웃 시프트를 막는다.
 */
export function HeaderAuthButtons() {
  return (
    <>
      <ClerkLoading>
        <div className="h-8 w-8 rounded-full bg-muted" aria-hidden />
      </ClerkLoading>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
```

- [x] **Step 5: `header.tsx`에서 Clerk import 제거하고 새 컴포넌트로 교체**

Modify `src/components/nav/header.tsx` — 전체를 아래로 교체한다. `Header`는 다시 Clerk 의존이 없는 순수 서버 컴포넌트가 된다.

```tsx
import Link from 'next/link';
import { Logo } from '@/components/nav/logo';
import { NavLinks } from '@/components/nav/nav-links';
import { MobileMenu } from '@/components/nav/mobile-menu';
import { HeaderAdminLink, HeaderAuthButtons } from '@/components/nav/header-auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-black text-lg">
          <Logo />
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks className="hidden md:flex" />
          <HeaderAdminLink />
          <ThemeToggle />
          <MobileMenu />
          <HeaderAuthButtons />
        </div>
      </div>
    </header>
  );
}
```

- [x] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/components/nav/header-auth.test.tsx`
Expected: PASS — 2 tests passed

- [x] **Step 7: 전체 단위 테스트 + lint 확인**

Run: `npm run test:run && npm run lint`
Expected: 기존 테스트 전량 PASS, lint 0 errors

- [x] **Step 8: 빌드 라우트 표로 정적 전환 검증 (핵심 검증)**

Run: `npm run build`

Expected: 아래 라우트가 `○` 또는 `●`로 바뀌어야 한다. 하나라도 `ƒ`면 Task는 실패이며, 다른 서버측 `auth()` 호출 경로가 남아 있다는 뜻이므로 커밋하지 말고 재조사한다.

```
┌ ○ /
├ ○ /apps
├ ● /apps/[slug]
├ ○ /apps/ralli
├ ○ /apps/ralli/privacy
├ ○ /playground
├ ○ /series
├ ○ /tags
```

`/posts`, `/posts/[slug]`, `/categories/[slug]`, `/series/[slug]`, `/tags/[slug]`, `/admin/*`는 `ƒ`로 남는 것이 **정상**이다 (각각 `searchParams`·비캐시 쿼리·인증 의존). Task 2·3의 대상이다.

- [x] **Step 9: 프로덕션 서버에서 prefetch 동작 검증**

> **⚠️ dev 서버로 검증하지 말 것.** dev 모드는 라우트를 요청 시점에 온디맨드 컴파일하며 정적 프리렌더를 아예 수행하지 않는다. 즉 dev에는 정적/동적 구분이 존재하지 않아 이 Task의 효과를 관측할 수 없다. 반드시 프로덕션 빌드 + `next start`로 확인한다.

```bash
npm run build
npx next start -p 3100
```

**9-1. 헤더 인증 UI 육안 확인** — 비로그인 시 "로그인" 버튼, 로그인 시 "대시보드" + `UserButton`. 로드 순간 레이아웃이 튀지 않는다.

**9-2. prefetch 발생 확인** — DevTools Network에서 `_rsc` 요청을 필터링한다. 정적 라우트는 완료(200), 동적 라우트는 중단되는 것이 정상이다.

**9-3. 응답 시간 측정**

```bash
for u in "/" "/series" "/tags" "/apps" "/posts" "/posts/<적당한-slug>"; do
  t=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:3100$u" -H "RSC: 1")
  printf "%-24s %6.0f ms\n" "$u" "$(echo "$t*1000" | bc)"
done
```

> **실행 결과 (2026-07-21)**
>
> prefetch 요청 — 정적 전환된 라우트만 완료된다.
> ```
> /apps?_rsc=...            → 200 OK
> /tags?_rsc=...            → 200 OK
> /series?_rsc=...          → 200 OK
> /?_rsc=...                → 200 OK
> /posts?_rsc=...           → [ERR_ABORTED]
> /posts/dell-s2725qc?_rsc= → [ERR_ABORTED]
> /categories/review?_rsc=  → [ERR_ABORTED]
> ```
>
> 응답 시간 — 정적 2~5ms, 동적 314~452ms (약 100배).
>
> | 라우트 | 렌더링 | 응답 |
> |---|:---:|---:|
> | `/` | ○ | 3 ms |
> | `/series` | ○ | 2 ms |
> | `/apps` | ○ | 2 ms |
> | `/tags` | ○ | 5 ms |
> | `/posts` | ƒ | 314 ms |
> | `/posts/dell-s2725qc` | ƒ | 452 ms |
>
> 동적 라우트의 prefetch가 중단되는 것은 `loading.tsx` 경계가 없어서다(스펙 2.3절). **Task 2가 정확히 이 지점을 해결한다.** 314~452ms는 비캐시 DB 왕복과 마크다운 변환 비용이며 **Task 3의 대상**이다.

- [x] **Step 10: E2E 확인**

Run: `npm run test:e2e`
Expected: 전량 PASS

> **실행 결과 (2026-07-21)**: 5 passed / 2 failed. 실패한 `e2e/home.spec.ts` 2건(`최신 글` heading, 리스트·카드 뷰 토글)은 **`develop`에서도 동일하게 실패하는 기존 문제**로, 홈 리뉴얼(hero + "최근 글", 뷰 토글 제거) 이후 테스트가 갱신되지 않은 것이다. 이번 변경과 무관하므로 별도 과제로 분리한다.

- [x] **Step 11: 커밋**

```bash
git add src/components/nav/header-auth.tsx src/components/nav/header-auth.test.tsx src/components/nav/header.tsx
git commit -m "$(cat <<'EOF'
⚡️ 헤더 Clerk 인증 UI를 클라이언트 경계로 분리해 공개 라우트 정적 렌더링 복원

Header가 서버 컴포넌트로 @clerk/nextjs의 서버 버전 SignedIn/SignedOut을
렌더하면서 내부 auth() 호출로 (main) 그룹 전체가 동적 렌더링으로 강제됐다.
그 결과 프리렌더 페이로드가 없어 Link prefetch가 무력화되고 전환 시마다
서버 렌더를 기다려야 했다.

인증 UI만 'use client' 경계로 분리해 클라이언트 버전이 선택되도록 했다.
빌드 결과 /, /apps, /apps/ralli, /apps/ralli/privacy, /playground, /series,
/tags가 정적으로, /apps/[slug]가 SSG로 전환됐다.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

- [x] **Step 12: 여기서 멈추고 사용자 관측을 기다린다**

Task 1 배포 후 체감 변화를 확인한 뒤 Task 2·3 진행 여부를 결정한다. 임의로 Task 2를 시작하지 않는다.

---

### Task 2: `(main)` 그룹 로딩 경계 추가 (2단계 — 승인 후 실행)

**Files:**
- Create: `src/app/(main)/loading.tsx`
- Create: `src/app/(main)/posts/[slug]/loading.tsx`

**Interfaces:**
- Consumes: Task 1에서 정적화된 라우트 구조 (여기서 다루는 대상은 그래도 `ƒ`로 남는 라우트)
- Produces: 없음 (Next.js 규약 파일)

- [ ] **Step 1: 그룹 공통 로딩 UI 작성**

`admin` 그룹의 `loading.tsx` 패턴(`Skeleton` 조합)을 그대로 따른다.

Create `src/app/(main)/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Skeleton className="h-8 w-40" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 글 상세 전용 로딩 UI 작성**

글 상세는 카드 그리드가 아니라 단일 본문이므로 별도 스켈레톤이 필요하다.

Create `src/app/(main)/posts/[slug]/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-10 w-5/6" />
      <Skeleton className="mt-3 h-4 w-40" />
      <Skeleton className="mt-8 aspect-video w-full rounded-md" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full last:w-2/3" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 로딩 UI가 실제로 노출되는지 확인**

Run: `npm run dev` 후 헤더에서 `블로그`(`/posts`) 클릭, 이어서 글 카드 클릭

Expected: 각 전환 시 흰 화면이나 이전 페이지 정체 없이 스켈레톤이 즉시 표시된다

- [ ] **Step 4: 빌드·테스트 확인**

Run: `npm run build && npm run test:run && npm run lint`
Expected: 빌드 성공, 테스트 전량 PASS, lint 0 errors

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/loading.tsx" "src/app/(main)/posts/[slug]/loading.tsx"
git commit -m "$(cat <<'EOF'
⚡️ (main) 그룹에 loading.tsx 추가해 동적 라우트 prefetch 경계 확보

동적 라우트는 가장 가까운 loading 경계까지만 prefetch되는데 (main)에는
경계가 하나도 없어 prefetch가 아무것도 받아오지 못했다. 그룹 공통
스켈레톤과 글 상세 전용 스켈레톤을 추가했다.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 읽기 쿼리 캐싱 + 글 상세 정적 생성 (3단계 — 승인 후 실행)

**Files:**
- Modify: `src/db/queries/posts.ts` (`selectPostBySlug`, `selectPosts`)
- Modify: `src/db/queries/comments.ts` (`selectCommentsByPostId`)
- Modify: `src/db/queries/tags.ts` (`selectTagsByPostIds`)
- Modify: `src/app/(main)/posts/[slug]/page.tsx` (`generateStaticParams` 추가)

**Interfaces:**
- Consumes: `CACHE_TAGS`(`src/db/cache-tags.ts`) — `posts`, `comments`, `tags`
- Produces: 시그니처 변경 없음. 모든 함수의 호출부 인터페이스는 그대로 유지한다 (`selectPostBySlug(slug)`, `selectCommentsByPostId(postId)`, `selectTagsByPostIds(postIds)` → `Map<number, TagSummary[]>`)

> **주의 1 — Map 직렬화**: `selectTagsByPostIds`는 `Map`을 반환한다. `unstable_cache`는 결과를 직렬화하므로 `Map`은 그대로 통과하지 못한다. 캐시 내부에서는 **배열(tuple 목록)** 을 반환하고, 바깥 래퍼에서 `new Map(...)`으로 복원해야 한다.
>
> **주의 2 — Date 직렬화**: 캐시를 거친 `post.publishedAt` / `post.updatedAt`이 문자열로 돌아올 수 있다. 소비처는 이미 `new Date(...)`로 감싸고 있는지 확인한다 (`post-header.tsx`, `generateMetadata`). 감싸지 않은 곳이 있으면 이 Task에서 함께 수정한다.
>
> **주의 3 — 검색어 캐시 발산**: `selectPosts`의 `search`는 카디널리티가 높아 캐시 키가 무한히 늘어난다. `search`가 있으면 캐시를 우회한다.

- [ ] **Step 1: `selectPostBySlug` 캐싱**

Modify `src/db/queries/posts.ts` — 기존 함수 본문을 내부 함수로 옮기고 slug별 캐시 래퍼를 씌운다.

```ts
async function selectPostBySlugUncached(
  slug: string
): Promise<PostWithCategoryAndTags | null> {
  const result = await db
    .select({ post: posts, category: categories })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!result[0]) return null;
  const { post, category } = result[0];

  const tagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id));

  return { ...post, category, tags: tagRows };
}

/**
 * slug로 글 상세 조회 (category + tags join)
 */
export async function selectPostBySlug(
  slug: string
): Promise<PostWithCategoryAndTags | null> {
  return unstable_cache(
    () => selectPostBySlugUncached(slug),
    ['post-by-slug', slug],
    { tags: [CACHE_TAGS.posts] }
  )();
}
```

- [ ] **Step 2: `selectPosts` 캐싱 (검색 시 우회)**

Modify `src/db/queries/posts.ts` — 기존 `selectPosts` 본문을 `selectPostsUncached`로 이름만 바꾸고, 아래 래퍼를 `selectPosts`로 export한다.

```ts
/**
 * 발행된 글 목록 (카테고리 join, 페이지네이션, 검색)
 *
 * search가 있으면 캐시 키가 발산하므로 캐시를 우회한다.
 */
export async function selectPosts(options: GetPostsOptions = {}) {
  const { categoryId, tagId, page = 1, limit = 10, search } = options;

  if (search) return selectPostsUncached(options);

  return unstable_cache(
    () => selectPostsUncached(options),
    ['posts-list', String(categoryId ?? ''), String(tagId ?? ''), String(page), String(limit)],
    { tags: [CACHE_TAGS.posts] }
  )();
}
```

- [ ] **Step 3: `selectCommentsByPostId` 캐싱**

Modify `src/db/queries/comments.ts` — 기존 본문을 `selectCommentsByPostIdUncached`로 바꾸고 래퍼를 추가한다.

```ts
/**
 * 특정 글의 댓글 목록을 트리 구조로 반환
 * 소프트 삭제된 댓글은 포함 (대댓글이 있으면 "삭제된 댓글"로 표시해야 하므로)
 */
export async function selectCommentsByPostId(
  postId: number
): Promise<CommentWithReplies[]> {
  return unstable_cache(
    () => selectCommentsByPostIdUncached(postId),
    ['comments-by-post', String(postId)],
    { tags: [CACHE_TAGS.comments] }
  )();
}
```

- [ ] **Step 4: `selectTagsByPostIds` 캐싱 (Map 복원 포함)**

Modify `src/db/queries/tags.ts` — 캐시 내부는 배열을 반환하고 바깥에서 `Map`으로 복원한다.

```ts
async function selectTagsByPostIdsUncached(
  postIds: number[]
): Promise<[number, TagSummary[]][]> {
  if (postIds.length === 0) return [];

  const rows = await db
    .select({
      postId: postTags.postId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  const map = new Map<number, TagSummary[]>();
  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    map.set(row.postId, list);
  }
  return [...map];
}

export async function selectTagsByPostIds(
  postIds: number[]
): Promise<Map<number, TagSummary[]>> {
  if (postIds.length === 0) return new Map();

  const sorted = [...postIds].sort((a, b) => a - b);
  const entries = await unstable_cache(
    () => selectTagsByPostIdsUncached(sorted),
    ['tags-by-post-ids', sorted.join(',')],
    { tags: [CACHE_TAGS.tags, CACHE_TAGS.posts] }
  )();

  return new Map(entries);
}
```

- [ ] **Step 5: `/posts/[slug]`에 `generateStaticParams` 추가**

Modify `src/app/(main)/posts/[slug]/page.tsx` — `import { selectPosts } from '@/db/queries/posts';`는 이미 없으므로 추가하고, `generateMetadata` 위에 아래를 넣는다. 발행 글 slug를 빌드 타임에 프리렌더해 마크다운→HTML 변환 비용까지 빌드로 옮긴다.

```tsx
import { selectPostBySlug, selectPosts } from '@/db/queries/posts';

export async function generateStaticParams() {
  const { items } = await selectPosts({ limit: 1000 });
  return items.map((post) => ({ slug: post.slug }));
}
```

- [ ] **Step 6: 캐시 무효화 경로 확인 (코드 변경 불필요 예상)**

Run: `grep -rn "revalidateTag" src/app/admin`

Expected: `save-post.ts`·`remove-post.ts`·`remove-comment.ts`·`add-tag.ts` 등이 이미 `CACHE_TAGS.posts` / `comments` / `tags`를 `'max'`로 무효화한다. 새로 캐싱한 쿼리는 모두 이 태그를 쓰므로 **추가 호출이 필요 없다.** 누락된 태그가 있으면 해당 서비스에 `revalidateTag(CACHE_TAGS.xxx, 'max')`를 추가한다.

- [ ] **Step 7: Date 직렬화 회귀 점검**

Run: `npm run dev` 후 글 상세 페이지 접속

Expected: 발행일이 정상 포맷(`yyyy년 M월 d일`)으로 표시되고 `Invalid Date`가 없다. 깨지면 해당 소비처를 `format(new Date(post.publishedAt), ...)` 형태로 수정한다.

- [ ] **Step 8: 빌드로 `/posts/[slug]` SSG 전환 확인**

Run: `npm run build`
Expected: 라우트 표에서 `/posts/[slug]`가 `● (SSG)`로 표시되고 하위에 개별 slug가 나열된다

- [ ] **Step 9: 전체 검증**

Run: `npm run test:run && npm run test:e2e && npm run lint`
Expected: 단위·E2E 전량 PASS, lint 0 errors

- [ ] **Step 10: 커밋**

```bash
git add src/db/queries/posts.ts src/db/queries/comments.ts src/db/queries/tags.ts "src/app/(main)/posts/[slug]/page.tsx"
git commit -m "$(cat <<'EOF'
⚡️ 공개 페이지 읽기 쿼리 캐싱 + 글 상세 정적 생성

selectPostBySlug·selectPosts·selectCommentsByPostId·selectTagsByPostIds가
요청마다 Neon을 왕복하던 것을 unstable_cache로 감싸고 기존 CACHE_TAGS로
무효화되도록 했다. /posts/[slug]에 generateStaticParams를 추가해 본문
마크다운 변환 비용을 빌드 타임으로 옮겼다.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 문서 정리 및 PR

**Files:**
- Modify: `docs/superpowers/plans/2026-07-21-route-navigation-perf.md`
- Modify: `docs/legacy/roadmap.md` (해당 시)

- [ ] **Step 1: plan 문서에 완료 요약 추가**

이 문서 상단에 완료 일자, 실제 적용한 Task 범위, 빌드 라우트 표 before/after, 미적용으로 남긴 항목을 기록한다.

- [ ] **Step 2: 커밋 및 PR 생성**

```bash
git add docs/
git commit -m "📝 라우트 전환 성능 개선 결과 요약 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push -u origin fix/route-navigation-perf
gh pr create --base develop --title "⚡️ 라우트 전환 성능 개선" --body "$(cat <<'EOF'
## 배경

공개 페이지 전환이 느리고 `<Link>` prefetch가 동작하지 않았다. 원인은 `Header`가 서버 컴포넌트로 `@clerk/nextjs`의 서버 버전 `SignedIn`/`SignedOut`을 렌더해 `auth()`를 호출하면서 `(main)` 그룹 전체가 동적 렌더링으로 강제된 것이다.

- 설계: `docs/superpowers/specs/2026-07-21-route-navigation-perf-design.md`
- 계획: `docs/superpowers/plans/2026-07-21-route-navigation-perf.md`

## 변경

적용한 Task 범위와 빌드 라우트 표 before/after를 여기에 기재한다.

## 검증

`npm run build` 라우트 표, `npm run test:run`, `npm run test:e2e`, `npm run lint` 결과를 기재한다.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR 머지는 `--no-ff`로 수행하고, 머지 후 브랜치를 제거한다.
