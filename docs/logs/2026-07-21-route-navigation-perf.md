# 라우트 전환 성능 개선 작업 로그

> 작업일: 2026-07-21
> 브랜치: `fix/route-navigation-perf` → `develop` ([PR #59](https://github.com/qlrogo91lp/yj-blog/pull/59)) → `main`
> 관련 문서: [설계](../superpowers/specs/2026-07-21-route-navigation-perf-design.md) · [계획](../superpowers/plans/2026-07-21-route-navigation-perf.md)

## 1. 문제 제기

"블로그에서 라우트 넘어갈 때 좀 느리다, prefetch도 잘 안 되는 것 같다"는 체감에서 출발했다. `docs/`에 관련 문서가 없어 진단부터 시작했다.

## 2. 진단 과정

### 2.1 첫 단서 — 정적이어야 할 페이지가 동적이었다

`npm run build` 라우트 표에서 `(main)` 그룹 전체가 `ƒ (Dynamic)`이었다.

```
┌ ƒ /                 ├ ƒ /playground        ├ ƒ /apps/ralli/privacy
├ ƒ /posts            ├ ƒ /series            ├ ƒ /tags
```

`/playground`와 `/apps/ralli/privacy`는 **DB 조회도 `searchParams`도 없는 순수 정적 페이지**인데 동적이었다. 페이지 자체가 아니라 공통 트리에 원인이 있다는 신호였다.

### 2.2 최소 변경 실험으로 범인 특정

한 번에 한 변수만 제거하고 빌드를 반복했다.

| 실험 | 결과 | 판정 |
|------|------|------|
| 루트 레이아웃에서 `ClerkProvider` 제거 | 전 라우트 `ƒ` 유지 | 무관 |
| `Header`에서 `<SignedIn>`/`<SignedOut>` 제거 | 7개 라우트가 `○ Static`, `/apps/[slug]`가 `● SSG`로 전환 | **원인 확정** |

### 2.3 근본 원인

`src/components/nav/header.tsx`가 서버 컴포넌트인데, 여기서 쓰는 `@clerk/nextjs`의 `<SignedIn>` / `<SignedOut>`이 **서버 버전으로 해석되어 내부적으로 `auth()`를 호출**했다. `Header`는 `(main)/layout.tsx`에 포함되므로 모든 공개 라우트가 동적 렌더링으로 강제됐다.

이것이 prefetch 실패와 직결된다.

- 동적 라우트는 프리렌더된 RSC 페이로드가 없어, `<Link>` prefetch가 **가장 가까운 `loading.tsx` 경계까지만** 가져올 수 있다
- 그런데 `(main)` 그룹에는 `loading.tsx`가 **하나도 없었다** (`admin`에만 존재)
- 결과적으로 prefetch가 실질적으로 아무것도 받아오지 못하고, 클릭 시점에 전체 서버 렌더를 기다렸다

실제로 프로덕션 서버의 네트워크 로그에서 정적 라우트는 prefetch가 완료(200)되고 동적 라우트는 `ERR_ABORTED`로 중단되는 것을 확인했다.

## 3. 적용한 변경

### Task 1 — 헤더 인증 UI를 클라이언트 경계로 분리 ✅

`src/components/nav/header-auth.tsx`(`'use client'`)를 신설하고 `HeaderAdminLink` / `HeaderAuthButtons`로 분리했다. 클라이언트 파일에서 import하면 `@clerk/nextjs`의 **클라이언트 버전**이 선택되어 `auth()` 서버 호출이 사라진다.

레이아웃 시프트 방지를 위해 `<ClerkLoading>`으로 `h-8 w-8` 플레이스홀더를 예약했다.

### Task 2 — `(main)` 그룹에 `loading.tsx` 추가 ⏪ **되돌림**

적용 직후엔 효과가 있었다. `/posts` prefetch가 `ERR_ABORTED` → 4ms로 개선됐고, 페이로드에 스켈레톤만 담기고 글 데이터는 0건인 것도 확인했다.

**그런데 `e2e/series.spec.ts`의 404 테스트가 실패했다.** 조사 결과 soft 404를 유발하고 있었다.

`loading.tsx`는 Suspense 경계를 만들어 응답을 스트리밍하게 한다. HTTP 상태(200)가 헤더 플러시 시점에 확정된 뒤 `notFound()`가 실행되므로, 존재하지 않는 페이지가 **본문만 404 UI이고 상태 코드는 200**이 된다.

| 상태 | `/series/*` | `/categories/*` | `/tags/*` | `/posts/*` |
|---|:---:|:---:|:---:|:---:|
| `(main)/loading.tsx` 있음 | 200 ❌ | 200 ❌ | 200 ❌ | 200 ❌ |
| 전부 제거 | **404** ✅ | **404** ✅ | **404** ✅ | **404** ✅ |

"404가 불가능한 목록 페이지에만 두자"는 절충도 시도했으나, **부모 세그먼트의 `loading.tsx`가 자식 라우트까지 덮어서** `posts/loading.tsx`만 둬도 `/posts/[slug]`가 soft 404가 됐다. `loading.tsx`와 올바른 404 상태는 양립 불가다.

Task 3의 캐싱으로 warm 렌더가 2~3ms가 되어 로딩 셸의 이득이 미미해진 반면, 글 상세 URL의 soft 404는 [GSC 색인 과제](../superpowers/specs/2026-07-04-gsc-index-coverage-분석.md)와 정면 충돌한다. **정확한 404 상태를 택했다.**

### Task 3 — 읽기 쿼리 캐싱 + 글 상세 정적 생성 ✅

`unstable_cache` + 기존 `CACHE_TAGS`를 적용했다.

| 함수 | 태그 |
|---|---|
| `selectPostBySlug` | `posts` |
| `selectPosts` (검색 시 우회) | `posts` |
| `selectCommentsByPostId` | `comments` |
| `selectTagsByPostIds` | `tags`, `posts` |
| `selectCategoryBySlug` | `categories` |

`/posts/[slug]`에 `generateStaticParams`를 추가해 마크다운 → HTML 변환(highlight.js) 비용을 빌드 타임으로 옮겼다.

## 4. 작업 중 발견한 것들

### 4.1 댓글 캐시 무효화 누락 — 실제 버그였다

계획서에는 "기존 `revalidateTag` 호출로 커버되므로 코드 변경 불필요 예상"이라고 적었는데 **틀렸다.**

공개 댓글 서비스 2건이 `revalidatePath`만 호출하고 있었다.

- `src/app/(main)/posts/[slug]/_services/add-comment.ts`
- `src/app/(main)/posts/[slug]/_services/remove-comment.ts`

캐싱 전에는 문제가 없었다. 조회가 매번 DB를 치므로 `revalidatePath`로 페이지만 무효화하면 충분했다. 하지만 댓글 조회를 `unstable_cache`로 감싼 순간, **`revalidatePath`는 태그 기반 캐시 엔트리를 무효화하지 않으므로 새 댓글이 화면에 반영되지 않는 상태**가 된다. 두 파일에 `revalidateTag(CACHE_TAGS.comments, 'max')`를 추가했다.

> **교훈**: 조회를 캐싱하면 그 데이터를 쓰는 **모든 mutation 경로**의 무효화를 다시 점검해야 한다. `revalidatePath`와 `revalidateTag`는 서로를 대체하지 않는다.

### 4.2 `selectCategoryBySlug` 누락 — 측정이 잡아냈다

캐싱 후 재측정에서 `/categories/[slug]`만 warm 상태로도 242ms였다. `selectCategoryBySlug`가 미캐시인 데다 `generateMetadata`와 페이지 본문에서 두 번 호출되고 있었다. 스펙의 대상 목록에 없던 함수라, 측정을 하지 않았으면 놓쳤을 지점이다.

### 4.3 검증 절차 자체가 틀렸다 — dev 서버

Task 1의 검증 단계를 `npm run dev`로 잡아뒀는데, **dev 모드는 라우트를 요청 시점에 온디맨드 컴파일하고 정적 프리렌더를 아예 하지 않는다.** dev에는 정적/동적 구분 자체가 없으므로 이 개선을 관측할 수 없다.

사용자가 "dev에서 확인하면 의미 없지 않냐"고 지적해 발견했다. 이후 모든 검증을 `npm run build` + `next start` 기준으로 다시 잡고, 문서에도 경고를 넣었다.

### 4.4 `generateMetadata`는 로딩 경계보다 위에서 실행된다

Task 2 적용 후에도 `/posts/[slug]`만 prefetch가 187ms였다. 원인은 `generateMetadata`가 로딩 경계 **위**에서 실행되어 prefetch에도 포함되기 때문이었다. 같은 구조끼리 비교하니 명확했다.

| 라우트 | `generateMetadata` | prefetch |
|---|---|---:|
| `/posts` | 없음 | 4 ms |
| `/tags/[slug]` | `getTagBySlug` (캐시됨) | 3 ms |
| `/posts/[slug]` | `selectPostBySlug` (미캐시) | 187 ms |

## 5. 최종 결과

프로덕션 빌드 + `next start`, warm 상태 측정.

| 라우트 | 개선 전 | 최종 | 렌더링 |
|---|---:|---:|:---:|
| `/posts` | 342 ms | **3 ms** | ƒ (searchParams) |
| `/posts/[slug]` | 422 ms | **2 ms** | ƒ → **● SSG** |
| `/categories/[slug]` | 242 ms | **3 ms** | ƒ |
| `/tags/[slug]` | 3 ms | 3 ms | ƒ |
| `/`·`/series`·`/tags`·`/apps`·`/playground` | — | 2~5 ms | ƒ → **○ Static** |
| `/apps/[slug]` | — | — | ƒ → **● SSG** |

**검증**

- 빌드 성공, 404 상태 4/4 정상(정상 페이지는 200)
- 단위 테스트 135/135
- E2E 7/7 (병행 작업이 홈 테스트를 갱신해 처음으로 전량 통과)
- lint 0 errors

## 6. 남은 과제

- **댓글 캐시 무효화 end-to-end 미검증** — `addComment`가 Discord 알림을 발송하고 실제 DB에 기록되어 테스트 댓글을 남기지 않았다. 코드상 관리자쪽 검증된 패턴과 동일하나 배포 후 실제 확인이 필요하다.
- **`/posts`는 구조적으로 동적** — `searchParams`(검색·필터·뷰)를 읽으므로 정적화 대상이 아니다. warm 3ms라 실사용엔 무리 없다. 더 줄이려면 Next.js PPR(부분 프리렌더링)이 정확히 이 케이스를 위한 기능이지만 아직 experimental이라 도입은 보류.
- **`test-results/`가 `.gitignore`에 없다** — Playwright 실행 산출물이 git에 추적된다.

## 7. 회고

이번 작업에서 가장 값이 컸던 건 **매 단계 실측**이었다. 코드만 읽고 넘어갔으면 놓쳤을 것들이 측정에서 드러났다.

- 정적/동적 판정 → 빌드 라우트 표
- prefetch 동작 여부 → `Next-Router-Prefetch` 헤더 + 네트워크 로그
- 캐싱 효과 → warm/cold 구분 측정
- 404 회귀 → E2E 테스트

특히 Task 2는 "적용 → 효과 확인 → 회귀 발견 → 되돌림"을 전부 거쳤다. E2E 테스트가 없었다면 soft 404를 모르고 배포했을 것이다. **성능 개선이 HTTP 시맨틱을 조용히 망가뜨릴 수 있다**는 게 이번의 핵심 교훈이다.
