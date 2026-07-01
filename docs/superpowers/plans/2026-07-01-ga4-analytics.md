# GA4 병행 도입 Implementation Plan

> **완료: 2026-07-01.** 전체 6개 태스크 구현 완료 (Subagent-Driven Development). `@next/third-parties`로 GA4 스크립트를 루트 레이아웃에 조건부 삽입하고, `AnalyticsLinkButton` 공용 컴포넌트를 `/admin/statistics`·`/admin/statistics/referrers` 헤더에 배치했다. 더미 측정 ID로 스크립트 삽입/미삽입 양쪽 분기를 검증했고 `npm run lint`·`npm run build` 모두 통과했다. Task 3 리뷰에서 커밋 메시지가 CLAUDE.md gitmoji 컨벤션과 어긋난다는 Important 지적이 나와 `git commit --amend`로 수정(로컬 미푸시 커밋). 브라우저 로그인이 필요한 `/admin/statistics*` 수동 클릭 검증은 Clerk 인증 제약으로 `tsc`/`build`/코드 검토로 대체했다.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 자체 통계(`dailyStats`/`referrers`)는 그대로 두고, GA4 추적 스크립트를 사이트에 심고 admin 통계 페이지에 GA4 콘솔로 나가는 링크를 추가한다.

**Architecture:** `@next/third-parties`의 `<GoogleAnalytics>`를 루트 레이아웃에 조건부로 삽입(측정 ID 없으면 미렌더링)하고, `/admin/statistics`·`/admin/statistics/referrers` 두 페이지 헤더에 공용 `AnalyticsLinkButton`을 배치해 `https://analytics.google.com/`로 나가는 새 탭 링크를 제공한다. GA4 데이터를 이 프로젝트로 끌어오는 API 연동은 하지 않는다.

**Tech Stack:** Next.js 16 App Router, `@next/third-parties`, shadcn/ui `Button`, `lucide-react`

## Global Constraints

- 측정 ID는 `NEXT_PUBLIC_GA_MEASUREMENT_ID` env 변수로 관리하며, 미설정 시 스크립트를 렌더링하지 않는다 (빌드/런타임 에러 없음)
- GA4 콘솔 링크는 `https://analytics.google.com/` 고정 주소를 사용한다 (속성별 URL 아님)
- `AnalyticsLinkButton`은 순수 컴포넌트로 `src/app/admin/statistics/_components/`에 둔다 (`statistics`, `statistics/referrers` 두 라우트가 공용으로 사용)
- 함수/컴포넌트명은 camelCase/PascalCase, 파일명은 kebab-case (`.claude/rules/coding-conventions.md`, `.claude/rules/component.md`)
- Lucide 아이콘은 `size` prop 사용 (`className`으로 크기 지정 금지)

---

### Task 1: `@next/third-parties` 설치 + env 변수 등록

**Files:**
- Modify: `package.json` (패키지 설치로 자동 반영)
- Modify: `.env.example`

**Interfaces:**
- Produces: `@next/third-parties/google`의 `GoogleAnalytics` export (Task 2에서 소비), env 변수 `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Task 2에서 소비)

- [x] **Step 1: 패키지 설치**

Run: `npm install @next/third-parties`

Expected: `package.json`의 `dependencies`에 `"@next/third-parties"` 항목 추가됨

- [x] **Step 2: 설치 확인**

Run: `grep "@next/third-parties" package.json`

Expected: 버전이 포함된 한 줄 출력 (예: `"@next/third-parties": "^16.x.x",`)

- [x] **Step 3: `.env.example`에 env 변수 추가**

`.env.example` 파일의 `# Site URL` 섹션 다음에 아래 내용 추가:

```
# Google Analytics (GA4)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

- [x] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: @next/third-parties 설치 및 GA4 env 변수 등록"
```

---

### Task 2: 루트 레이아웃에 GA4 스크립트 조건부 삽입

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `GoogleAnalytics` from `@next/third-parties/google` (Task 1에서 설치), `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Produces: 없음 (leaf 변경, 이후 태스크가 의존하지 않음)

- [x] **Step 1: import 추가**

`src/app/layout.tsx` 상단 import 블록에 추가:

```tsx
import { GoogleAnalytics } from '@next/third-parties/google';
```

- [x] **Step 2: `<body>` 내부에 조건부 렌더링 추가**

기존:

```tsx
        <body
          className={cn(geistSans.variable, geistMono.variable, 'antialiased min-w-100')}
        >
          <ThemeProvider>
            <TooltipProvider>
              <PageTracker />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </body>
```

변경 후:

```tsx
        <body
          className={cn(geistSans.variable, geistMono.variable, 'antialiased min-w-100')}
        >
          <ThemeProvider>
            <TooltipProvider>
              <PageTracker />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
        </body>
```

- [x] **Step 3: 빌드 확인**

Run: `npm run build`

Expected: 에러 없이 빌드 성공 (`.env.local`에 측정 ID가 없어도 통과해야 함)

- [x] **Step 4: 스크립트 미삽입 확인 (측정 ID 없음)**

Run: `npm run dev`

브라우저에서 `http://localhost:3000` 접속 → 개발자 도구 → Elements 또는 페이지 소스 보기에서 `gtag/js` 스크립트 태그가 없는지 확인

Expected: `gtag` 관련 `<script>` 태그 없음, 콘솔 에러 없음

- [x] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: 루트 레이아웃에 GA4 스크립트 조건부 삽입"
```

---

### Task 3: `AnalyticsLinkButton` 컴포넌트 작성

**Files:**
- Create: `src/app/admin/statistics/_components/analytics-link-button.tsx`

**Interfaces:**
- Produces: `AnalyticsLinkButton` — named export, props 없음, `src/app/admin/statistics/_components/analytics-link-button.tsx`에서 export (Task 4, Task 5에서 import)

- [x] **Step 1: 컴포넌트 작성**

`src/app/admin/statistics/_components/analytics-link-button.tsx` 새로 생성:

```tsx
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GA_DASHBOARD_URL = 'https://analytics.google.com/';

export function AnalyticsLinkButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={GA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} />
        Google Analytics에서 보기
      </Link>
    </Button>
  );
}
```

- [x] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`

Expected: 에러 없음

- [x] **Step 3: lint 확인**

Run: `npm run lint`

Expected: `analytics-link-button.tsx` 관련 에러 없음

- [x] **Step 4: Commit**

```bash
git add src/app/admin/statistics/_components/analytics-link-button.tsx
git commit -m "feat: GA4 콘솔 링크 버튼 컴포넌트 추가"
```

---

### Task 4: `/admin/statistics` 헤더에 버튼 배치

**Files:**
- Modify: `src/app/admin/statistics/page.tsx`

**Interfaces:**
- Consumes: `AnalyticsLinkButton` from `src/app/admin/statistics/_components/analytics-link-button.tsx` (Task 3에서 생성)

- [x] **Step 1: import 추가**

`src/app/admin/statistics/page.tsx` 상단에 추가:

```tsx
import { AnalyticsLinkButton } from './_components/analytics-link-button';
```

- [x] **Step 2: 헤더 레이아웃 수정**

기존:

```tsx
      <h1 className="mb-6 text-2xl font-bold">방문 통계</h1>
```

변경 후:

```tsx
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">방문 통계</h1>
        <AnalyticsLinkButton />
      </div>
```

- [x] **Step 3: 수동 확인**

Run: `npm run dev` (아직 실행 중이 아니면)

브라우저에서 `/admin/statistics` 접속 (관리자 로그인 필요) → 제목 우측에 "Google Analytics에서 보기" 버튼이 보이는지, 클릭 시 새 탭으로 `https://analytics.google.com/`이 열리는지 확인

Expected: 버튼 노출, 새 탭에서 GA 콘솔(또는 로그인 화면) 열림

- [x] **Step 4: lint 확인**

Run: `npm run lint`

Expected: 에러 없음

- [x] **Step 5: Commit**

```bash
git add src/app/admin/statistics/page.tsx
git commit -m "feat: 방문 통계 페이지에 GA4 링크 버튼 배치"
```

---

### Task 5: `/admin/statistics/referrers` 헤더에 버튼 배치

**Files:**
- Modify: `src/app/admin/statistics/referrers/page.tsx`

**Interfaces:**
- Consumes: `AnalyticsLinkButton` from `src/app/admin/statistics/_components/analytics-link-button.tsx` (Task 3에서 생성)

- [x] **Step 1: import 추가**

`src/app/admin/statistics/referrers/page.tsx` 상단에 추가:

```tsx
import { AnalyticsLinkButton } from '../_components/analytics-link-button';
```

- [x] **Step 2: 헤더 레이아웃 수정**

기존:

```tsx
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">유입 경로</h1>
        <ReferrerPeriodFilter options={PERIOD_OPTIONS} current={currentPeriod} />
      </div>
```

변경 후:

```tsx
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">유입 경로</h1>
        <div className="flex items-center gap-2">
          <AnalyticsLinkButton />
          <ReferrerPeriodFilter options={PERIOD_OPTIONS} current={currentPeriod} />
        </div>
      </div>
```

- [x] **Step 3: 수동 확인**

브라우저에서 `/admin/statistics/referrers` 접속 → 제목 우측에 "Google Analytics에서 보기" 버튼과 기간 필터가 나란히 보이는지, 버튼 클릭 시 새 탭으로 `https://analytics.google.com/`이 열리는지 확인

Expected: 버튼 노출(필터 왼쪽), 새 탭에서 GA 콘솔(또는 로그인 화면) 열림

- [x] **Step 4: lint 확인**

Run: `npm run lint`

Expected: 에러 없음

- [x] **Step 5: Commit**

```bash
git add src/app/admin/statistics/referrers/page.tsx
git commit -m "feat: 유입경로 페이지에 GA4 링크 버튼 배치"
```

---

### Task 6: 더미 측정 ID로 스크립트 삽입 확인 + 전체 회귀

**Files:**
- 없음 (검증 전용 태스크, 코드 변경 없음)

**Interfaces:**
- Consumes: Task 2의 `layout.tsx` 조건부 렌더링

- [x] **Step 1: 로컬 `.env.local`에 더미 측정 ID 임시 추가**

`.env.local` 파일에 아래 줄 추가 (실제 발급받은 ID가 있으면 그 값 사용, 없으면 임시 더미 값):

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST1234
```

- [x] **Step 2: 개발 서버 재시작 후 스크립트 삽입 확인**

Run: `npm run dev` (환경변수 반영을 위해 재시작 필요)

브라우저에서 `http://localhost:3000` 접속 → 페이지 소스 보기 또는 개발자 도구 Network 탭에서 `gtag/js?id=G-TEST1234` 요청과 `dataLayer` 스크립트 확인

Expected: `gtag.js` 스크립트 로드 시도됨 (더미 ID라 GA 서버 응답은 무시해도 됨), 콘솔에 치명적 에러 없음

- [x] **Step 3: 더미 값 제거**

`.env.local`에서 Step 1에서 추가한 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 줄 제거 (실제 발급받은 ID를 쓸 계획이면 그 값으로 교체)

- [x] **Step 4: 전체 회귀 확인**

Run: `npm run lint && npm run build`

Expected: 둘 다 에러 없이 통과

- [x] **Step 5: 최종 커밋 없음**

이 태스크는 로컬 검증 전용이며 `.env.local`은 git에 포함되지 않으므로 커밋할 변경 사항 없음. Task 1~5의 커밋만 `develop` 기준 브랜치에 남아있는지 `git log --oneline -6`으로 확인
