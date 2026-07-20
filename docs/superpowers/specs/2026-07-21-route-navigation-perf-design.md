# 라우트 전환 성능 개선 설계

> 작성일: 2026-07-21
> 배경: 공개 페이지 간 이동이 체감상 느리고 `<Link>` prefetch가 동작하지 않는 문제. systematic-debugging으로 근본 원인을 확정한 뒤 개선 방향을 정리한다.

## 1. 증상

- 헤더 내비게이션(`Home` / `블로그` / `시리즈` / `Tags` / `Apps`) 클릭 시 전환이 즉각적이지 않다.
- 링크에 마우스를 올려도 prefetch가 선행되지 않아, 클릭 후 서버 렌더를 통째로 기다린다.
- 전환 중 로딩 UI가 없어 이전 페이지에 머무는 시간이 그대로 노출된다.

## 2. 진단 (증거)

### 2.1 빌드 라우트 표 — 공개 페이지 전부 동적

`npm run build` 결과, `(main)` 그룹의 모든 라우트가 `ƒ (Dynamic)`이었다.

```
┌ ƒ /                 ├ ƒ /playground        ├ ƒ /apps/ralli/privacy
├ ƒ /posts            ├ ƒ /series            ├ ƒ /tags
├ ƒ /apps             ├ ƒ /apps/[slug]       ├ ƒ /categories/[slug]
```

`/playground`와 `/apps/ralli/privacy`는 **DB 조회도 `searchParams`도 없는 순수 정적 페이지**인데 동적으로 분류되었다. 페이지 자체가 아니라 **공통 트리에 원인이 있다**는 신호다.

### 2.2 최소 변경 실험으로 범인 특정

한 번에 한 변수만 제거하고 빌드를 재실행했다.

| 실험 | 결과 | 판정 |
|------|------|------|
| 루트 레이아웃에서 `ClerkProvider` 제거 | 전 라우트 `ƒ` 유지 | 무관 |
| `Header`에서 `<SignedIn>` / `<SignedOut>` 제거 | `/`, `/apps`, `/apps/ralli`, `/apps/ralli/privacy`, `/playground`, `/series`, `/tags` → **`○ Static`**, `/apps/[slug]` → **`● SSG`** | **원인 확정** |

### 2.3 근본 원인

`src/components/nav/header.tsx`가 서버 컴포넌트이고, 여기서 쓰는 `@clerk/nextjs`의 `<SignedIn>` / `<SignedOut>`이 **서버 버전으로 해석되어 내부적으로 `auth()`를 호출**한다. `Header`는 `src/app/(main)/layout.tsx`에 포함되므로, **모든 공개 라우트가 동적 렌더링으로 강제**된다.

이것이 prefetch가 무력화된 이유와 직결된다.

- 동적 라우트는 프리렌더된 RSC 페이로드가 없어, `<Link>` prefetch가 **가장 가까운 `loading.tsx` 경계까지만** 가져올 수 있다.
- 그런데 `(main)` 그룹에는 `loading.tsx`가 **하나도 없다** (`admin`에만 5개 존재).
- 결과적으로 prefetch가 실질적으로 아무것도 받아오지 못하고, 클릭 시점에 전체 서버 렌더를 기다린다.

### 2.4 2차 요인 (근본 원인 해결 후에도 동적으로 남는 라우트)

`/posts`, `/posts/[slug]`, `/categories/[slug]`, `/series/[slug]`, `/tags/[slug]`는 원인 제거 후에도 `ƒ`로 남는다. 이들은 다음 이유로 요청마다 비용을 치른다.

| 항목 | 현황 |
|------|------|
| `selectPosts` / `selectPostBySlug` / `selectCommentsByPostId` / `selectTagsByPostIds` | `unstable_cache` 미적용 — 요청마다 Neon 왕복 (네트워크 지연 누적) |
| `/posts/[slug]` | `generateStaticParams` 없음 — 요청마다 서버 렌더 |
| 글 본문 변환 | `markdownToHtmlWithToc` / `htmlToHtmlWithToc`(highlight.js)가 요청마다 실행 — CPU 작업 반복 |

`/posts`는 `searchParams`(category·view·search·tag)를 읽으므로 **정적화 대상이 아니다**. 여기는 캐시 + `loading.tsx`로 대응한다.

## 3. 개선 방향

우선순위 순으로 3단계. **1단계만 먼저 적용해 체감 변화를 관측한 뒤 2·3단계 진행 여부를 결정한다.**

### 3.1 [1단계] Clerk 인증 UI를 클라이언트 경계로 분리

`Header`에서 Clerk 관련 UI만 `'use client'` 컴포넌트로 떼어낸다. 클라이언트 파일에서 import하면 `@clerk/nextjs`의 **클라이언트 버전** `SignedIn`/`SignedOut`이 선택되어 `auth()` 서버 호출이 사라지고, `Header`는 다시 순수 서버 컴포넌트가 된다.

**신규 파일**: `src/components/nav/header-auth.tsx` (`'use client'`)

기존 `Header`의 인증 UI는 `ThemeToggle`·`MobileMenu`를 사이에 두고 두 군데로 나뉘어 있으므로, 시각적 순서를 유지하기 위해 한 파일에서 두 컴포넌트를 export한다.

| export | 대체 대상 | 위치 |
|--------|-----------|------|
| `HeaderAdminLink` | `<SignedIn>` + `/admin` 대시보드 버튼 | `NavLinks` 직후 |
| `HeaderAuthButtons` | `<SignedOut>` 로그인 버튼 + `<SignedIn>` `UserButton` | `MobileMenu` 직후 |

`src/components/nav/`의 기존 클라이언트 컴포넌트(`nav-links.tsx`, `mobile-menu.tsx`)가 접미사 없는 kebab-case이므로 동일 관례를 따른다 (`_actions/*.action.tsx`는 라우트 폴더 전용 규칙이라 해당 없음).

**동작 변화와 대응**: 인증 UI가 서버 HTML에 포함되지 않고 Clerk 로드 이후 나타난다. 레이아웃 시프트를 막기 위해 `<ClerkLoading>`으로 동일 크기의 플레이스홀더를 예약한다.

- `HeaderAdminLink` — 로딩 중에는 아무것도 예약하지 않는다. 관리자(본인)에게만 보이는 버튼이고, 비로그인 방문자에게는 로그인 후에도 나타나지 않으므로 상시 공간 예약은 낭비다.
- `HeaderAuthButtons` — 로그인 버튼과 `UserButton` 중 어느 쪽이든 반드시 하나가 렌더되므로, 로딩 중 `h-8 w-8` 원형 스켈레톤으로 자리를 예약한다.

**기대 효과**: `/`, `/apps`, `/apps/ralli`, `/apps/ralli/privacy`, `/playground`, `/series`, `/tags`가 정적으로, `/apps/[slug]`가 SSG로 전환된다. 이 라우트들은 prefetch가 정상 동작하고 전환이 즉시 이루어진다.

### 3.2 [2단계] `(main)` 그룹에 `loading.tsx` 추가 — ⏪ **적용 후 되돌림**

> **결론 (2026-07-21): 이 방향은 채택하지 않는다.**
>
> `loading.tsx`는 Suspense 경계를 만들어 응답을 스트리밍하게 한다. HTTP 상태(200)가 헤더 플러시 시점에 확정된 뒤 `notFound()`가 실행되므로, 존재하지 않는 페이지가 **본문만 404 UI이고 상태 코드는 200인 soft 404**가 된다.
>
> 부모 세그먼트의 `loading.tsx`가 자식 라우트까지 덮으므로 "404가 불가능한 목록 페이지에만 둔다"는 절충도 성립하지 않는다. `loading.tsx`와 올바른 404 상태는 **양립 불가**다.
>
> 3.3의 쿼리 캐싱으로 warm 렌더가 2~3ms가 되어 로딩 셸의 이득이 미미해진 반면, 글 상세 URL의 soft 404는 이 블로그의 SEO 과제(`2026-07-04-gsc-index-coverage-분석.md`)와 정면 충돌한다. **정확한 404 상태를 택한다.**
>
> 아래 원래 내용은 히스토리로 남겨둔다.

1단계 이후에도 동적으로 남는 라우트(`/posts`, `/posts/[slug]`, `/categories/[slug]`, `/series/[slug]`, `/tags/[slug]`)에 Suspense 경계를 만든다. 경계가 생기면 Next.js가 해당 경계까지의 셸을 prefetch할 수 있고, 클릭 즉시 로딩 UI가 표시된다.

- `src/app/(main)/loading.tsx` — 그룹 공통 스켈레톤
- `src/app/(main)/posts/[slug]/loading.tsx` — 글 상세 전용(제목·본문 라인 스켈레톤)

`admin` 그룹의 기존 `loading.tsx` 패턴을 그대로 따른다.

### 3.3 [3단계] 읽기 쿼리 캐싱 + 정적 파라미터 생성

| 대상 | 조치 |
|------|------|
| `selectPostBySlug` | `unstable_cache` 래핑, 태그 `CACHE_TAGS.posts` |
| `selectCommentsByPostId` | `unstable_cache` 래핑, 태그 `CACHE_TAGS.comments` |
| `selectPosts` | `unstable_cache` 래핑, 태그 `CACHE_TAGS.posts` (인자별 키 분리 필요) |
| `selectTagsByPostIds` | `unstable_cache` 래핑, 태그 `CACHE_TAGS.tags` |
| `/posts/[slug]` | `generateStaticParams`로 발행 글 slug 프리렌더 → 본문 변환 비용도 빌드 타임으로 이동 |

무효화는 기존 관례(`revalidateTag(CACHE_TAGS.xxx, 'max')`)를 그대로 사용한다. 이미 `save-post.ts`·`remove-post.ts`·`remove-comment.ts` 등에서 해당 태그를 무효화하고 있으므로 **추가 호출 없이 기존 경로로 커버된다**.

> **주의**: `selectPosts`는 `categoryId`·`tagId`·`page`·`search` 조합이 키에 포함되어야 한다. 검색어는 카디널리티가 높아 캐시 키가 발산하므로, `search`가 있는 경우는 캐시를 우회하는 편이 안전하다.

## 4. 검증 방법

> **⚠️ dev 서버로 검증하지 말 것.** dev 모드는 라우트를 요청 시점에 온디맨드 컴파일하며 정적 프리렌더를 수행하지 않는다. dev에는 정적/동적 구분 자체가 없어 이 문서가 다루는 개선을 관측할 수 없다. 반드시 `npm run build` + `next start`로 확인한다.

각 단계 적용 후 `npm run build` 라우트 표로 `○`/`●`/`ƒ` 분포 변화를 확인한다. 이것이 개선 여부를 판정하는 1차 증거다.

2차 증거로 프로덕션 서버에서 두 가지를 측정한다.

- **prefetch 발생 여부** — DevTools Network에서 `_rsc` 요청 필터. 정적 라우트는 200 완료, 동적 라우트는 `ERR_ABORTED`
- **RSC 응답 시간** — `curl -o /dev/null -w "%{time_total}" <url> -H "RSC: 1"`

1단계 적용 직후 측정값(2026-07-21): 정적 2~5ms vs 동적 314~452ms.

| 단계 | 성공 기준 |
|------|-----------|
| 1단계 | `/`, `/apps`, `/apps/ralli`, `/apps/ralli/privacy`, `/playground`, `/series`, `/tags`가 `○`, `/apps/[slug]`가 `●` |
| 2단계 | 남은 `ƒ` 라우트 진입 시 로딩 스켈레톤이 즉시 표시 |
| 3단계 | `/posts/[slug]`가 `●`로 전환 |

회귀 방지: 기존 단위 테스트(`npm run test:run`)와 E2E(`npm run test:e2e`) 전량 통과, `npm run lint` 0 errors.

## 5. 범위 밖

- 이미지 최적화, 폰트 로딩 전략, 번들 크기 축소
- `admin` 그룹의 렌더링 전략 (인증이 필수라 동적이 정상)
- `PageTracker`의 `/api/track` 호출 (전환 이후 실행되는 비동기 작업이라 체감 지연과 무관)

## 변경 이력

- 2026-07-21: 초안 작성. 근본 원인(Header의 서버측 Clerk 컨트롤 컴포넌트) 확정 및 3단계 개선안 정의.
