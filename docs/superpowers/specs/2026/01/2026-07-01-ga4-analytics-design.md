# GA4 병행 도입 — Design

> 작성일 2026-07-01.

## 목표

현재 자체 구현(`dailyStats`/`referrers` 테이블 기반 admin 대시보드)은 유지하되, Google Analytics 4(GA4)를 상세 분석용으로 병행 도입한다. 이번 작업 범위는 **추적 스크립트 삽입**과 **admin에서 GA4 콘솔로 나가는 링크 제공**까지이며, GA4 데이터를 이 프로젝트 admin 화면에 직접 끌어와 보여주는 API 연동은 하지 않는다.

## 결정 요약

| 주제 | 결정 |
|------|------|
| 기존 자체 통계 | 그대로 유지 (`dailyStats`, `referrers`, admin 대시보드 요약용) |
| GA4 역할 | 상세 분석 전용. admin에는 콘솔로 나가는 링크만 제공 |
| 스크립트 삽입 방식 | `@next/third-parties`의 `<GoogleAnalytics>` 컴포넌트 |
| 측정 ID 관리 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` env 변수. 미설정 시 스크립트 미렌더링 (에러 없이 통과) |
| GA4 측정 ID 발급 | 사용자가 GA4 속성을 만들고 직접 발급받아 `.env.local`에 채움 (이 작업은 코드 밖의 일이라 이번 구현 범위 아님) |
| admin 링크 위치 | `/admin/statistics`, `/admin/statistics/referrers` 페이지 상단 헤더 |
| 링크 대상 URL | `https://analytics.google.com/` 고정 (로그인 상태면 속성 목록/최근 속성으로 자동 이동) |

## 현재 상태

- `src/app/api/track/route.ts` — 자체 페이지뷰/방문자 집계(`dailyStats`), referrer 문자열 기록(`referrers`), 글 조회수 증가
- `src/components/page-tracker.tsx` — 클라이언트에서 `/api/track`으로 POST
- `src/app/admin/statistics/page.tsx` — 요약 카드 + 추이 차트 + 인기글 Top 10
- `src/app/admin/statistics/referrers/page.tsx` — 유입경로 테이블 + 기간 필터
- GA4 관련 코드·패키지·env 변수 없음

## 아키텍처

### 1) GA4 스크립트 삽입

- `@next/third-parties` 패키지 설치
- **`src/app/layout.tsx`** (수정)
  - `import { GoogleAnalytics } from '@next/third-parties/google'`
  - `<body>` 내부, 기존 `<PageTracker />` 인근에 조건부 렌더링 추가:
    ```tsx
    {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
    )}
    ```
  - 측정 ID 미설정(로컬/프리뷰 등) 환경에서는 아무것도 렌더링하지 않아 에러 없이 동작

### 2) 환경 변수

- **`.env.example`** (수정) — `# Google Analytics` 섹션 추가, `NEXT_PUBLIC_GA_MEASUREMENT_ID=` 빈 값으로 등록
- `.env.local`에는 사용자가 GA4 속성 생성 후 직접 측정 ID를 채움 (코드 작업 범위 밖)

### 3) Admin 링크 — 공용 컴포넌트

`statistics`와 `statistics/referrers` 두 페이지에서 공통으로 쓰므로 두 라우트의 부모인 `statistics`의 `_components`에 둔다 (순수 컴포넌트, 상태·API 의존 없음).

- **`src/app/admin/statistics/_components/analytics-link-button.tsx`** (신규)
  - props 없음. 고정 URL(`https://analytics.google.com/`)로 나가는 새 탭 링크 버튼
  - `Button`(`variant="outline"`, `size="sm"`) + `asChild` + `next/link`(`target="_blank"`, `rel="noopener noreferrer"`) + `lucide-react`의 `ExternalLink`(`size={16}`) 아이콘 + "Google Analytics에서 보기" 텍스트

### 4) Admin 페이지 헤더 수정

- **`src/app/admin/statistics/page.tsx`** (수정)
  - 기존 `<h1 className="mb-6 text-2xl font-bold">방문 통계</h1>` 단독 줄을
    `<div className="mb-6 flex items-center justify-between">` 로 감싸 `<h1>`과 `<AnalyticsLinkButton />`을 좌우 배치
- **`src/app/admin/statistics/referrers/page.tsx`** (수정)
  - 기존 `flex items-center justify-between` 우측에는 이미 `<ReferrerPeriodFilter />`가 있음
  - 우측을 `<div className="flex items-center gap-2">`로 묶어 `<AnalyticsLinkButton />` + `<ReferrerPeriodFilter />` 순서로 배치 (버튼이 필터보다 먼저 오도록 좌측에)

## 에러 / 엣지 케이스

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` 미설정 → `<GoogleAnalytics>` 렌더링 자체를 생략 (조건부 렌더링으로 처리, 빌드·런타임 에러 없음)
- GA4 스크립트 로드 실패(광고 차단기 등) → 페이지 기능에 영향 없음 (`@next/third-parties`가 비동기 로드 처리)
- `AnalyticsLinkButton`은 로그인 여부와 무관하게 항상 동일 URL로 이동. 사용자가 Google 계정에 로그인되어 있지 않으면 Google 로그인 화면으로 먼저 안내됨 (Google 표준 동작, 별도 처리 불필요)

## 테스트 전략

### Vitest

- 별도 단위 테스트 없음 — `AnalyticsLinkButton`은 정적 링크만 렌더링하는 순수 컴포넌트로 로직이 없어 테스트 가치가 낮음
- `layout.tsx`의 조건부 렌더링도 env 값 유무에 따른 단순 분기라 단위 테스트 생략

### 수동 검증

- `npm run build`로 타입/빌드 통과 확인
- `.env.local`에 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 없이 로컬 실행 → GA 스크립트 미삽입, 에러 없음 확인 (개발자 도구 Network 탭에서 `gtag/js` 요청 없음)
- 임시로 더미 측정 ID를 넣고 로컬 실행 → `<head>`/`<body>`에 `gtag.js`, `dataLayer` 스크립트 삽입 확인
- `/admin/statistics`, `/admin/statistics/referrers` 방문 → "Google Analytics에서 보기" 버튼 노출·새 탭으로 `analytics.google.com` 이동 확인
- `npm run lint` 통과

## 작업 순서 (구현 계획에서 task로 분해)

1. `@next/third-parties` 설치
2. `.env.example`에 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 추가
3. `layout.tsx`에 `<GoogleAnalytics>` 조건부 삽입
4. `AnalyticsLinkButton` 컴포넌트 작성
5. `statistics/page.tsx` 헤더에 버튼 배치
6. `statistics/referrers/page.tsx` 헤더에 버튼 배치
7. 수동 검증 (env 유무 두 케이스) + `npm run build` / `npm run lint`
