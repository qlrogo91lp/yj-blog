# 대시보드·방문 통계·유입경로·블로그 설정 구현 계획 (어드민 리디자인 PR 4/4)

> **완료: 2026-08-20.** Task 1~9 전부 완료. SDD(subagent-driven-development)로 실행 — 태스크별 구현·리뷰 후 전체 브랜치 최종 리뷰까지 마쳤다. 결과 요약:
>
> - Task 1: 컨트롤러가 직접 구현(스키마+쿼리 전용, 다른 worktree(`feature/admin-comment-reply`)와 Neon dev DB를 공유해 drizzle-kit push 순서 조율 필요). `referrerExcludes`를 `notNull()`로 추가하면서 `BlogSettings` 타입이 이 필드를 필수로 요구하게 돼 `settings-form.action.test.tsx`의 리터럴이 즉시 깨지는 걸 발견·수정(`referrerExcludes: []` 추가) — Task 7의 전체 교체본과 충돌하지 않도록 plan 문서에도 기록해 둠.
> - Task 2~8: 전부 태스크 리뷰 통과(Critical/Important 0건). 이 중 2건은 plan 예시 코드 자체의 결함을 리뷰어가 검증한 뒤 승인한 좁은 범위의 이탈이다 — Task 6은 `updateReferrerExcludes` 테스트 mock의 스프레드 인자 시그니처가 실제 함수 시그니처와 타입이 맞지 않아 `(excludes: string[])` 형태로 수정, Task 7은 react-hook-form의 `isDirty`가 필드를 기본값으로 되돌리면 다시 `false`가 되는 특성 때문에 blogName 검증 테스트가 브리프 원문대로는 통과할 수 없어 태그라인 필드로 dirty 상태를 만들도록 시나리오만 수정(최종 assertion은 동일).
> - Task 9 검증: 단위 테스트 92 files/497 tests 전부 PASS, 린트 이 PR 변경 파일 기준 신규 에러 0건, tsc 신규 에러 0건, 빌드 성공.
> - 전체 브랜치 최종 리뷰(opus): Critical 0건, Important 1건 — `/admin/statistics?days=<비숫자>`가 `NaN` 미방어로 `date-fns`의 `RangeError`를 던져 500이 되는 결함(Task 2에서 `searchParams.days`를 새로 받기 시작하며 유입). `Number.isFinite` + 양수 체크 가드로 즉시 수정(commit `bcac442`), 같은 근본 원인이 있던 `referrers/page.tsx`도 함께 정리. 스코프드 재리뷰로 수정 확인 완료.
> - Minor 6건은 모두 머지를 막지 않는 후속 정리 후보로 SDD 원장에 ruling과 함께 parked — `updateReferrerExcludes`의 조용한 no-op(row 미존재 시), 설정 폼 취소 버튼의 타이밍 의존, `selectTopReferrers` "전체" 기간의 무제한 조회, 제외 규칙 입력 UX 피드백 부재, `StatCard`의 `change.current` 중복, 어드민 화면 간 헤더 스타일 불일치.
> - 브라우저 육안 확인(Task 9 Step 5)은 Clerk 인증이 필요해 에이전트가 확인할 수 없음 — PR 리뷰 중 사용자가 직접 확인 예정.
> - SDD 원장: `.superpowers/sdd/2026-08-20-admin-stats-settings/progress.md` (전체 리뷰 결과·parked 항목 상세)
> - PR: [#85](https://github.com/qlrogo91lp/yj-blog/pull/85) (`refactor/admin-stats-settings` → `develop`, 머지 완료)
>
> 이 PR 머지로 어드민 리디자인 4개 PR 로드맵([아래 표](#로드맵--어드민-리디자인-4개-pr))이 전부 완료됐다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드에 추이 차트를(2c), 방문 통계·유입경로에 공용 기간 세그먼트와 직전 기간 대비 증감을(3c), 유입경로에 "항상 제외" 규칙을(3e), 블로그 설정에 좌측 앵커 내비게이션과 하단 플로팅 저장 바를(3f) 추가해 어드민 리디자인 4개 PR을 마무리한다.

**Architecture:** 기간 세그먼트(7일/30일/전체)는 `admin/statistics/_actions/period-filter.action.tsx` 하나로 통일해 방문 통계·유입경로 양쪽이 같은 컴포넌트를 `basePath`만 바꿔 쓴다. `StatsChart`는 대시보드와 방문 통계 양쪽이 쓰므로 라우트 전용 `_components`에서 어드민 공용 `admin/_components`로 옮긴다. 유입경로의 "항상 제외" 규칙은 `blog_settings.referrerExcludes`(jsonb)에 저장하고, `selectTopReferrers`가 이 목록으로 필터링한 뒤 집계한다. 블로그 설정 폼은 `react-hook-form`의 `formState.isDirty`로 변경 여부를 추적해 하단 플로팅 저장 바를 띄운다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui + radix-ui, Drizzle ORM(neon-http), recharts, react-hook-form + zod, Vitest + Testing Library

**Spec:** [2026-08-20-admin-cell-a-redesign-design.md](../specs/2026-08-20-admin-cell-a-redesign-design.md)

## Global Constraints

- Tailwind v4 문법만 쓴다 — CSS 변수는 `max-w-(--content-width)`, 그라디언트는 `bg-linear-to-*`, spacing 스케일의 4배수 px 임의값은 숫자 유틸리티(`max-w-[1180px]` → `max-w-295`).
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다.
- React hook·타입은 named import. `React.useState`와 네임스페이스 import 금지.
- 색상 hex를 컴포넌트에 직접 쓰지 않는다. 상태 색은 `--status-published`/`--status-draft`/`--status-danger` 토큰의 Tailwind 유틸을 쓴다. **예외:** `StatsChart`(recharts)는 기존에도 hex를 직접 쓰고 있었고, 이 PR은 그 파일을 다른 화면에서도 쓰도록 옮기기만 할 뿐 내부를 고치지 않는다 — 「이 PR의 범위 밖」에 이유를 적는다.
- CRUD 동사 컨벤션 — Server Action은 `add`/`get`/`edit`/`remove`, DB 쿼리는 `insert`/`select`/`update`/`delete`.
- Server Action의 반환 타입은 `{ success: true } | { success: false; error: string }` 유니언이다. 예외를 던지지 않고 `try/catch`로 감싸 값으로 반환한다.
- 조건부 클래스명은 템플릿 리터럴 대신 `cn()`을 쓴다.
- 날짜 포맷·연산은 date-fns를 쓴다. `toLocaleDateString` 등 네이티브 날짜 메서드 금지.
- `console.log`를 커밋하지 않는다.
- 폴더·파일 네이밍은 `.claude/rules/page-folder.md`를 따른다 — `_actions/*.action.tsx`, `_components/kebab-case.tsx`, `_services/kebab-case.ts`.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 만든다. DB 쿼리 함수(`src/db/queries/*.ts`)와 단순 정적 nav/필터 컴포넌트(`PostStatusFilterAction`·`StatCard`가 그랬듯)는 이 저장소에 전용 단위 테스트 컨벤션이 없다 — 이 PR도 그 관례를 따른다.
- 스키마 변경은 `npx drizzle-kit push`로 반영한다. 이 PR의 변경은 컬럼 추가 하나뿐이라 데이터 손실 위험이 없다.

## 이 PR의 범위 밖

- 체류 시간·재방문율·기기 비율 — 스펙이 GA로 위임하기로 결정. `/api/track`도 이 PR에서 확장하지 않는다.
- 블로그 설정 "외형" 토글 3종(다크 모드 노출·홈 히어로·최근 글 개수) — 스펙이 명시적으로 제외.
- `StatsChart`/`PostDailyChart`의 hex 색상 하드코딩을 CSS 토큰으로 바꾸는 작업 — 기존부터 있던 결함이고, recharts SVG 속성에 `var(--x)`를 직접 넣는 방식은 브라우저 지원이 불확실해 검증 없이 손대면 회귀 위험이 크다. `StatsChart`를 옮기기만 하고 내부는 그대로 둔다. 후속 정리 후보.
- `referrerExcludes` 매칭은 **호스트네임 완전 일치**만 지원한다. 와일드카드·부분 문자열 매칭은 넣지 않는다 — 개인 블로그 규모에서 `t.co`, `l.facebook.com`처럼 정확한 호스트를 등록하는 것으로 충분하고, 매칭 규칙이 복잡해지면 "왜 이 유입경로가 안 걸러지는지" 설명하기 어려워진다.
- 유입경로·방문 통계 표에서 제외된 유입경로가 몇 건 걸러졌는지 보여주는 카운터 — 스펙에 없는 추가 기능이라 넣지 않는다.
- Clerk `UserButton` 다크 팝오버 대응(`@clerk/themes`) — 범위 밖, 현재도 동일한 상태라 회귀 아님.
- PR 1·2·3 최종 리뷰에서 보류(parked)한 항목 전부 — 이 PR이 해당 파일을 건드릴 일이 없다.

---

## 로드맵 — 어드민 리디자인 4개 PR

| 순서 | 브랜치                           | plan 문서                                                                    | 상태                                                                                   |
| ---- | -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1    | `refactor/admin-shell-cell-a`    | [2026-08-20-admin-shell-cell-a.md](./2026-08-20-admin-shell-cell-a.md)       | 완료 (PR [#83](https://github.com/qlrogo91lp/yj-blog/pull/83) 머지)                    |
| 2    | `refactor/admin-content-screens` | [2026-08-20-admin-content-screens.md](./2026-08-20-admin-content-screens.md) | 완료 (PR [#84](https://github.com/qlrogo91lp/yj-blog/pull/84) 머지)                    |
| 3    | `feature/admin-comment-reply`    | [2026-08-20-admin-comment-reply.md](./2026-08-20-admin-comment-reply.md)     | 완료 (PR [#86](https://github.com/qlrogo91lp/yj-blog/pull/86) 머지)                    |
| 4    | `refactor/admin-stats-settings`  | 이 문서                                                                      | 완료 (PR [#85](https://github.com/qlrogo91lp/yj-blog/pull/85) 머지 — PR 3 이전에 착수) |

---

## 결정 사항

### `StatsChart`를 `admin/statistics/_components`에서 `admin/_components`로 옮긴다

대시보드(2c)가 방문 통계 화면과 같은 라인차트를 쓴다. `admin/_components`는 이미 대시보드와 무관하게 "어드민 공용" 컴포넌트(`admin-page-header.tsx`)를 담고 있는 폴더이므로, 새 폴더를 만들지 않고 그 자리로 옮긴다. 컴포넌트 내부는 손대지 않는다.

### 방문 통계의 "직전 기간 대비" 카드는 기존 오늘/어제/누적 카드를 대체하지 않고 추가한다

기존 3장 카드(오늘/어제/누적)는 `selectStatsSummary()`가 계산하는 고정된 일 단위 비교라 기간 세그먼트와 무관하게 항상 보여줄 가치가 있다. 스펙이 요구하는 "이번 기간 vs 직전 기간"은 사용자가 고른 기간(7일/30일)에 종속되는 별도 정보이므로 새 카드 그룹으로 추가한다. "전체" 기간을 고르면 비교 기준 구간이 없으므로 이 카드 그룹 자체를 숨긴다.

### `selectTopReferrers`를 SQL `groupBy` 대신 JS 집계로 바꾼다

"항상 제외" 필터링은 저장된 원본 `referrer` 문자열이 아니라 그 호스트네임으로 판정해야 한다(`https://t.co/abc`와 `https://t.co/xyz`를 모두 걸러야 함). PostgreSQL에서 URL 호스트를 뽑으려면 별도 함수나 정규식이 필요해 복잡해지므로, 애초에 원본 row를 가져와 애플리케이션 코드에서 호스트네임을 추출·필터링·집계한다. 개인 블로그의 `referrers` 테이블 규모(하루 수십~수백 행)에서는 이 방식의 성능 비용이 무시할 만하다.

### `editSettings`를 다른 Server Action과 같은 `Result` 유니언 패턴으로 통일하고 Clerk 인증을 추가한다

PR 4 조사에서 발견된 기존 결함이다 — `editSettings`는 `Promise<void>`를 반환하고 `auth()` 검사가 없어, 이 저장소의 다른 모든 Server Action(`addComment`/`editPostStatus`/`removeUnusedTags`/`addAdminReply`)과 다르게 동작했다. 하단 플로팅 저장 바를 위해 이 파일을 어차피 수정하므로, 같이 정리한다.

## 스키마 변경

`npx drizzle-kit push` 한 번으로 반영된다. 컬럼 추가 하나뿐이라 데이터 손실 위험이 없다.

| 테이블          | 컬럼               | 용도                                              |
| --------------- | ------------------ | ------------------------------------------------- |
| `blog_settings` | `referrerExcludes` | 유입경로 "항상 제외" 규칙(호스트네임 배열, jsonb) |

---

## File Structure

**생성**

| 파일                                                                                 | 책임                                |
| ------------------------------------------------------------------------------------ | ----------------------------------- |
| `src/app/admin/statistics/_actions/period-filter.action.tsx`                         | 공용 기간 세그먼트(7일/30일/전체)   |
| `src/app/admin/statistics/_components/period-change-badge.tsx`                       | 직전 기간 대비 증감 뱃지 (순수)     |
| `src/app/admin/statistics/_components/period-change-badge.test.tsx`                  | 증감률 계산 분기 검증               |
| `src/app/admin/statistics/referrers/_services/edit-referrer-excludes.ts`             | "항상 제외" 규칙 저장 Server Action |
| `src/app/admin/statistics/referrers/_services/edit-referrer-excludes.test.ts`        | 인증·정제·저장 검증                 |
| `src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.tsx`      | 제외 규칙 칩 목록 + 추가 입력       |
| `src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.test.tsx` | 추가·삭제·에러 분기 검증            |
| `src/app/admin/settings/_components/settings-nav.tsx`                                | 좌측 앵커 내비게이션 (순수)         |

**수정**

| 파일                                                            | 변경                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/db/schema.ts`                                              | `blogSettings.referrerExcludes` 컬럼 추가                                                |
| `src/db/queries/settings.ts`                                    | `updateReferrerExcludes` 추가                                                            |
| `src/db/queries/daily-stats.ts`                                 | `selectPeriodComparison` 추가                                                            |
| `src/db/queries/statistics.ts`                                  | `selectTopReferrers`를 exclude 필터 + JS 집계로 재작성                                   |
| `src/app/admin/statistics/page.tsx`                             | `searchParams.days` 연동, 직전 기간 비교 카드, `PeriodFilterAction`                      |
| `src/app/admin/statistics/_components/stat-card.tsx`            | `change?` prop 추가                                                                      |
| `src/app/admin/statistics/referrers/page.tsx`                   | `PeriodFilterAction`으로 교체, exclude 필터 적용, `ReferrerExcludesFormAction` 추가      |
| `src/app/admin/page.tsx`                                        | `AdminPageHeader` 적용, `StatsChart` 위젯 추가                                           |
| `src/app/admin/settings/page.tsx`                               | 좌측 앵커 내비게이션 + 폼 2컬럼 레이아웃                                                 |
| `src/app/admin/settings/_actions/settings-form.action.tsx`      | 섹션에 `id` 부여, `isDirty` 기반 하단 플로팅 저장 바, `editSettings` 결과 처리 방식 변경 |
| `src/app/admin/settings/_actions/settings-form.action.test.tsx` | 위 변경에 맞춰 mock·단언 갱신                                                            |
| `src/app/admin/settings/_services/edit-settings.ts`             | Clerk 인증 추가, `Result` 유니언 반환으로 변경                                           |

**이동**

| 파일                                                   | 이동 후                                     |
| ------------------------------------------------------ | ------------------------------------------- |
| `src/app/admin/statistics/_components/stats-chart.tsx` | `src/app/admin/_components/stats-chart.tsx` |

**삭제**

| 파일                                                                            | 이유                          |
| ------------------------------------------------------------------------------- | ----------------------------- |
| `src/app/admin/statistics/referrers/_actions/referrer-period-filter.action.tsx` | `PeriodFilterAction`으로 대체 |

---

## Task 1: `blog_settings.referrerExcludes` 스키마 + 쿼리 2종

**Files:**

- Modify: `src/db/schema.ts`
- Modify: `src/db/queries/settings.ts` (`updateReferrerExcludes`)
- Modify: `src/db/queries/daily-stats.ts` (`selectPeriodComparison`)

**Interfaces:**

- Consumes: 없음 (첫 태스크)
- Produces:
  - `blogSettings.referrerExcludes: string[]`, `jsonb().default([])`
  - `updateReferrerExcludes(excludes: string[]): Promise<void>` — Task 5의 `editReferrerExcludes`가 호출
  - `selectPeriodComparison(days: number): Promise<{ currentViews; previousViews; currentVisitors; previousVisitors }>` — Task 2의 방문 통계 페이지가 호출

DB 스키마·쿼리 전용 태스크라 「Global Constraints」에 따라 전용 단위 테스트는 만들지 않는다.

- [x] **Step 1: 스키마에 컬럼 추가**

`src/db/schema.ts`의 `blogSettings` 정의(`socialLinks` 다음 줄)에 추가:

```ts
  referrerExcludes: jsonb('referrer_excludes').$type<string[]>().default([]).notNull(), // 유입경로 "항상 제외" 규칙 — 호스트네임 배열
```

- [x] **Step 2: DB에 반영**

```bash
npx drizzle-kit push
```

기대: 컬럼 추가만 감지됨(데이터 손실 경고 없음).

- [x] **Step 3: `updateReferrerExcludes` 추가**

`src/db/queries/settings.ts` 하단에 추가:

```ts
/**
 * 유입경로 "항상 제외" 규칙만 갱신한다. blog_settings row(id=1)가
 * 이미 존재한다고 가정한다 — 최초 블로그 설정은 항상 SettingsFormAction으로 먼저 만들어진다.
 */
export async function updateReferrerExcludes(
  excludes: string[]
): Promise<void> {
  await db
    .update(blogSettings)
    .set({ referrerExcludes: excludes, updatedAt: new Date() })
    .where(eq(blogSettings.id, 1));
}
```

파일 상단에 `eq`, `blogSettings` import가 없다면 추가한다.

- [x] **Step 4: `selectPeriodComparison` 추가**

`src/db/queries/daily-stats.ts` 하단에 추가. 파일 상단 import에 `lte`를 더한다:

```ts
import { format, subDays } from 'date-fns';
import { and, gte, lte, sql } from 'drizzle-orm';
```

```ts
/**
 * 선택한 기간(최근 N일)과 그 직전 N일을 비교한다.
 * 예: days=7이면 [오늘-6, 오늘] vs [오늘-13, 오늘-7]
 */
export async function selectPeriodComparison(days: number) {
  const today = new Date();
  const currentStart = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const currentEnd = format(today, 'yyyy-MM-dd');
  const previousStart = format(subDays(today, days * 2 - 1), 'yyyy-MM-dd');
  const previousEnd = format(subDays(today, days), 'yyyy-MM-dd');

  const sumRange = (start: string, end: string) =>
    db
      .select({
        views: sql<number>`coalesce(sum(${dailyStats.views}), 0)`,
        visitors: sql<number>`coalesce(sum(${dailyStats.visitors}), 0)`,
      })
      .from(dailyStats)
      .where(and(gte(dailyStats.date, start), lte(dailyStats.date, end)));

  const [current, previous] = await Promise.all([
    sumRange(currentStart, currentEnd),
    sumRange(previousStart, previousEnd),
  ]);

  return {
    currentViews: Number(current[0]?.views ?? 0),
    previousViews: Number(previous[0]?.views ?? 0),
    currentVisitors: Number(current[0]?.visitors ?? 0),
    previousVisitors: Number(previous[0]?.visitors ?? 0),
  };
}
```

- [x] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

`referrerExcludes`가 `notNull()`이라 `BlogSettings`(`typeof blogSettings.$inferSelect`) 타입이 이 필드를 필수로 요구하게 된다. `src/app/admin/settings/_actions/settings-form.action.test.tsx`의 "defaultValues가 폼 필드에 반영된다" 테스트가 `BlogSettings` 리터럴을 직접 만들고 있어 이 시점에 타입 에러가 난다 — 그 객체에 `referrerExcludes: []`를 추가해서 고친다 (Task 7이 이 파일을 전체 교체할 때도 동일한 값을 쓰므로 충돌하지 않는다).

기대: 신규 에러 0건.

- [x] **Step 6: 커밋**

```bash
git add src/db/schema.ts src/db/queries/settings.ts src/db/queries/daily-stats.ts \
  src/app/admin/settings/_actions/settings-form.action.test.tsx
git commit -m "✨ feat: referrerExcludes 컬럼과 기간 비교 쿼리 추가"
```

---

## Task 2: 공용 기간 세그먼트 + 방문 통계 페이지 기간 연동

**Files:**

- Create: `src/app/admin/statistics/_actions/period-filter.action.tsx`
- Delete: `src/app/admin/statistics/referrers/_actions/referrer-period-filter.action.tsx`
- Modify: `src/app/admin/statistics/page.tsx`
- Modify: `src/app/admin/statistics/referrers/page.tsx`

**Interfaces:**

- Consumes: Task 1의 `selectPeriodComparison`
- Produces: `PeriodFilterAction({ basePath, current })` — Task 3(직전 기간 카드)이 같은 페이지에서 `days` 값을 공유한다

- [x] **Step 1: 공용 기간 세그먼트 구현**

`PostStatusFilterAction`(`src/app/admin/posts/_actions/post-status-filter.action.tsx`)과 동일한 Link + `cn()` 패턴을 쓴다 — 기존 `referrer-period-filter.action.tsx`가 `<button>` + 템플릿 리터럴을 써서 `.claude/rules/component.md`의 `cn()` 규칙을 어기고 있었는데, 이 기회에 정리한다.

```tsx
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { label: '7일', value: '7' },
  { label: '30일', value: '30' },
  { label: '전체', value: 'all' },
];

type Props = {
  basePath: string;
  current: string;
};

export function PeriodFilterAction({ basePath, current }: Props) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      {PERIOD_OPTIONS.map((option) => (
        <Link
          key={option.value}
          href={`${basePath}?days=${option.value}`}
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

- [x] **Step 2: 방문 통계 페이지에 기간 연동**

`src/app/admin/statistics/page.tsx` 전체 교체:

```tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  selectDailyStatsForRange,
  selectPeriodComparison,
  selectStatsSummary,
} from '@/db/queries/daily-stats';
import { selectPopularPosts } from '@/db/queries/statistics';
import { PeriodFilterAction } from './_actions/period-filter.action';
import { AnalyticsLinkButton } from './_components/analytics-link-button';
import { StatCard } from './_components/stat-card';
import { StatsChart } from './_components/stats-chart';

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminStatisticsPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const currentPeriod = daysParam ?? '30';
  const days = currentPeriod === 'all' ? undefined : Number(currentPeriod);
  const chartDays = days ?? 30; // "전체" 선택 시에도 그래프는 최근 30일 고정

  const [summary, dailyStats, popularPosts, comparison] = await Promise.all([
    selectStatsSummary(),
    selectDailyStatsForRange(chartDays),
    selectPopularPosts(10),
    days ? selectPeriodComparison(days) : Promise.resolve(null),
  ]);

  const viewCards = [
    { label: '오늘 조회수', value: summary.todayViews },
    { label: '어제 조회수', value: summary.yesterdayViews },
    { label: '누적 조회수', value: summary.totalViews },
  ];

  const visitorCards = [
    { label: '오늘 방문자', value: summary.todayVisitors },
    { label: '어제 방문자', value: summary.yesterdayVisitors },
    { label: '누적 방문자', value: summary.totalVisitors },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">방문 통계</h1>
        <div className="flex items-center gap-2">
          <AnalyticsLinkButton />
          <PeriodFilterAction
            basePath="/admin/statistics"
            current={currentPeriod}
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap p-0">
          {viewCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
          <div className="mx-2" />
          {visitorCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </CardContent>
      </Card>

      {/* 선택한 기간 대비 직전 기간 */}
      {comparison && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap p-0">
            <StatCard
              label={`최근 ${days}일 조회수`}
              value={comparison.currentViews}
              change={{
                current: comparison.currentViews,
                previous: comparison.previousViews,
              }}
            />
            <StatCard
              label={`최근 ${days}일 방문자`}
              value={comparison.currentVisitors}
              change={{
                current: comparison.currentVisitors,
                previous: comparison.previousVisitors,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* 추이 그래프 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {dailyStats.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center">
              아직 통계 데이터가 없습니다. 블로그에 방문이 기록되면 그래프가
              표시됩니다.
            </p>
          ) : (
            <StatsChart data={dailyStats} />
          )}
        </CardContent>
      </Card>

      {/* 인기 글 Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">인기 글 Top 10</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {popularPosts.length === 0 ? (
            <p className="text-muted-foreground px-6 py-10 text-center">
              조회된 글이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-24 text-right">조회수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularPosts.map((post, index) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/statistics/posts/${post.id}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {post.views.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

> `StatCard`의 `change` prop은 Task 3에서 추가한다 — 이 시점에는 타입 에러가 나는 게 정상이다.

- [x] **Step 3: 유입경로 페이지의 필터를 공용 컴포넌트로 교체**

`src/app/admin/statistics/referrers/page.tsx`에서 `import { ReferrerPeriodFilterAction } from './_actions/referrer-period-filter.action';`와 `PERIOD_OPTIONS` 상수, `<ReferrerPeriodFilterAction options={PERIOD_OPTIONS} current={currentPeriod} />`를 아래로 교체:

```tsx
import { PeriodFilterAction } from '../_actions/period-filter.action';
```

```tsx
<PeriodFilterAction
  basePath="/admin/statistics/referrers"
  current={currentPeriod}
/>
```

- [x] **Step 4: 옛 필터 컴포넌트 삭제**

```bash
git rm src/app/admin/statistics/referrers/_actions/referrer-period-filter.action.tsx
```

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/statistics/_actions/period-filter.action.tsx \
  src/app/admin/statistics/page.tsx \
  src/app/admin/statistics/referrers/page.tsx
git commit -m "✨ feat: 방문 통계·유입경로에 공용 기간 세그먼트 연동"
```

---

## Task 3: 직전 기간 대비 증감 카드

**Files:**

- Create: `src/app/admin/statistics/_components/period-change-badge.tsx`
- Test: `src/app/admin/statistics/_components/period-change-badge.test.tsx`
- Modify: `src/app/admin/statistics/_components/stat-card.tsx`

**Interfaces:**

- Consumes: Task 2가 이미 `page.tsx`에서 넘기기 시작한 `StatCard`의 `change` prop
- Produces: `PeriodChangeBadge({ current, previous })`, `StatCard`의 `change?: { current: number; previous: number }` prop — Task 2의 `page.tsx`가 이미 소비하고 있다

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/statistics/_components/period-change-badge.test.tsx` 신규 생성:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeriodChangeBadge } from './period-change-badge';

describe('PeriodChangeBadge', () => {
  it('증가했으면 +부호와 함께 증가율을 보여준다', () => {
    render(<PeriodChangeBadge current={120} previous={100} />);
    expect(screen.getByText('+20%')).toBeInTheDocument();
  });

  it('감소했으면 부호 없이 음수 증가율을 보여준다', () => {
    render(<PeriodChangeBadge current={80} previous={100} />);
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('변동이 없으면 "변동 없음"을 보여준다', () => {
    render(<PeriodChangeBadge current={100} previous={100} />);
    expect(screen.getByText('변동 없음')).toBeInTheDocument();
  });

  it('직전 기간이 0이고 이번 기간도 0이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(
      <PeriodChangeBadge current={0} previous={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('직전 기간이 0이고 이번 기간이 0보다 크면 "신규"를 보여준다', () => {
    render(<PeriodChangeBadge current={5} previous={0} />);
    expect(screen.getByText('신규')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/statistics/_components/period-change-badge.test.tsx
```

기대: `./period-change-badge` 모듈이 없어 FAIL.

- [x] **Step 3: 구현**

```tsx
import { cn } from '@/lib/utils';

type Props = {
  current: number;
  previous: number;
};

export function PeriodChangeBadge({ current, previous }: Props) {
  if (previous === 0) {
    if (current === 0) return null;
    return (
      <span className="text-status-published text-xs font-medium">신규</span>
    );
  }

  const changePercent =
    Math.round(((current - previous) / previous) * 1000) / 10;

  if (changePercent === 0) {
    return <span className="text-muted-foreground text-xs">변동 없음</span>;
  }

  const isUp = changePercent > 0;

  return (
    <span
      className={cn(
        'text-xs font-medium',
        isUp ? 'text-status-published' : 'text-status-danger'
      )}
    >
      {isUp ? '+' : ''}
      {changePercent}%
    </span>
  );
}
```

- [x] **Step 4: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/statistics/_components/period-change-badge.test.tsx
```

기대: 5개 테스트 모두 PASS.

- [x] **Step 5: `StatCard`에 `change` prop 연결**

`src/app/admin/statistics/_components/stat-card.tsx` 전체 교체:

```tsx
import { PeriodChangeBadge } from './period-change-badge';

type Props = {
  label: string;
  value: number;
  change?: { current: number; previous: number };
};

export function StatCard({ label, value, change }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-2xl font-bold">{value.toLocaleString()}</span>
      {change && (
        <PeriodChangeBadge
          current={change.current}
          previous={change.previous}
        />
      )}
    </div>
  );
}
```

- [x] **Step 6: 타입 체크**

```bash
npx tsc --noEmit
```

기대: Task 2에서 예상됐던 `change` prop 관련 에러가 해소되고, 신규 에러 0건.

- [x] **Step 7: 커밋**

```bash
git add src/app/admin/statistics/_components/period-change-badge.tsx \
  src/app/admin/statistics/_components/period-change-badge.test.tsx \
  src/app/admin/statistics/_components/stat-card.tsx
git commit -m "✨ feat: 직전 기간 대비 증감 뱃지 추가"
```

---

## Task 4: 대시보드 추이 차트

**Files:**

- Move: `src/app/admin/statistics/_components/stats-chart.tsx` → `src/app/admin/_components/stats-chart.tsx`
- Modify: `src/app/admin/statistics/page.tsx` (import 경로만)
- Modify: `src/app/admin/page.tsx`

**Interfaces:**

- Consumes: 기존 `selectDailyStatsForRange`(`@/db/queries/daily-stats`)
- Produces: 어드민 공용 위치의 `StatsChart` — 이 태스크 이후로는 대시보드·방문 통계 양쪽이 같은 파일을 참조한다

- [x] **Step 1: `StatsChart` 이동**

```bash
git mv src/app/admin/statistics/_components/stats-chart.tsx src/app/admin/_components/stats-chart.tsx
```

내용은 변경하지 않는다.

- [x] **Step 2: 방문 통계 페이지의 import 경로 갱신**

Task 2에서 `src/app/admin/statistics/page.tsx`는 아직 옮기기 전 위치인 `import { StatsChart } from './_components/stats-chart';`로 가져오고 있었다. 파일이 한 단계 위로 옮겨졌으므로 상대 경로를 갱신한다:

```tsx
import { StatsChart } from '../_components/stats-chart';
```

- [x] **Step 3: 대시보드에 차트 위젯 추가**

`src/app/admin/page.tsx` 전체 교체:

```tsx
import { Eye, FileText, MessageSquare, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecentComments } from '@/db/queries/comments';
import { selectDailyStatsForRange } from '@/db/queries/daily-stats';
import {
  getAdminDashboardStats,
  getRecentPostsForAdmin,
} from '@/db/queries/posts';
import { AdminPageHeader } from './_components/admin-page-header';
import { QuickActions } from './_components/quick-actions';
import { RecentCommentsWidget } from './_components/recent-comments-widget';
import { RecentPostsWidget } from './_components/recent-posts-widget';
import { StatsChart } from './_components/stats-chart';

export default async function AdminDashboardPage() {
  const [stats, recentPosts, recentComments, dailyStats] = await Promise.all([
    getAdminDashboardStats(),
    getRecentPostsForAdmin(5),
    getRecentComments(5),
    selectDailyStatsForRange(30),
  ]);

  const cards = [
    { title: '전체 글', value: stats.totalPosts, icon: FileText },
    { title: '발행됨', value: stats.publishedPosts, icon: Eye },
    { title: '임시저장', value: stats.draftPosts, icon: PenLine },
    { title: '댓글', value: stats.totalComments, icon: MessageSquare },
  ];

  return (
    <>
      <AdminPageHeader title="대시보드" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">최근 30일 방문 추이</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {dailyStats.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center">
              아직 통계 데이터가 없습니다.
            </p>
          ) : (
            <StatsChart data={dailyStats} />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <QuickActions />
        <RecentPostsWidget posts={recentPosts} />
        <RecentCommentsWidget comments={recentComments} />
      </div>
    </>
  );
}
```

- [x] **Step 4: 전체 검증**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 전부 PASS, 신규 에러 0건.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/statistics/page.tsx src/app/admin/page.tsx
git commit -m "✨ feat: 대시보드에 방문 추이 차트 추가"
```

---

## Task 5: 유입경로 — "항상 제외" 필터 적용

**Files:**

- Modify: `src/db/queries/statistics.ts` (`selectTopReferrers`)
- Modify: `src/app/admin/statistics/referrers/page.tsx`

**Interfaces:**

- Consumes: Task 1의 `blogSettings.referrerExcludes`
- Produces: `selectTopReferrers(limit?, days?, excludes?: string[])` — 「결정 사항」대로 JS 집계로 재작성

DB 쿼리 전용 태스크라 전용 단위 테스트는 만들지 않는다.

- [x] **Step 1: `selectTopReferrers` 재작성**

`src/db/queries/statistics.ts`에서 기존 `selectTopReferrers`를 교체:

```ts
function extractHostname(referrer: string): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer;
  }
}

/**
 * 상위 referrer 도메인 집계 (기간 필터 가능, "항상 제외" 규칙 적용)
 * days: undefined이면 전체 기간
 */
export async function selectTopReferrers(
  limit = 20,
  days?: number,
  excludes: string[] = []
) {
  const since = days ? subDays(new Date(), days) : undefined;
  const where = and(since ? gte(referrers.visitedAt, since) : undefined);

  const rows = await db
    .select({ referrer: referrers.referrer })
    .from(referrers)
    .where(where);

  const excludeSet = new Set(excludes);
  const counts = new Map<string, number>();

  for (const row of rows) {
    const referrer = row.referrer ?? '';
    if (excludeSet.has(extractHostname(referrer))) continue;
    counts.set(referrer, (counts.get(referrer) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const total = sorted.reduce((acc, [, c]) => acc + c, 0);

  return sorted.map(([referrer, c]) => ({
    referrer,
    count: c,
    percentage: total > 0 ? Math.round((c / total) * 1000) / 10 : 0,
  }));
}
```

- [x] **Step 2: 유입경로 페이지에서 excludes 전달**

`src/app/admin/statistics/referrers/page.tsx`에 `getBlogSettings` import를 추가하고, `selectTopReferrers` 호출을 아래처럼 바꾼다:

```tsx
import { getBlogSettings } from '@/db/queries/settings';
```

```tsx
const settings = await getBlogSettings();
const referrerList = await selectTopReferrers(
  20,
  days,
  settings?.referrerExcludes ?? []
);
```

- [x] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건.

- [x] **Step 4: 커밋**

```bash
git add src/db/queries/statistics.ts src/app/admin/statistics/referrers/page.tsx
git commit -m "♻️ refactor: 유입경로 집계에 항상 제외 규칙 적용"
```

---

## Task 6: 유입경로 — "항상 제외" 규칙 관리 UI

**Files:**

- Create: `src/app/admin/statistics/referrers/_services/edit-referrer-excludes.ts`
- Test: `src/app/admin/statistics/referrers/_services/edit-referrer-excludes.test.ts`
- Create: `src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.tsx`
- Test: `src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.test.tsx`
- Modify: `src/app/admin/statistics/referrers/page.tsx`

**Interfaces:**

- Consumes: Task 1의 `updateReferrerExcludes`
- Produces: `editReferrerExcludes(excludes: string[]): Promise<Result>`, `ReferrerExcludesFormAction({ excludes: string[] })` — `page.tsx`가 현재 저장된 `referrerExcludes`를 넘겨 렌더한다

- [x] **Step 1: Server Action — 실패하는 테스트 작성**

`src/app/admin/statistics/referrers/_services/edit-referrer-excludes.test.ts` 신규 생성:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editReferrerExcludes } from './edit-referrer-excludes';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const updateReferrerExcludesMock = vi.fn(async () => {});
vi.mock('@/db/queries/settings', () => ({
  updateReferrerExcludes: (...args: unknown[]) =>
    updateReferrerExcludesMock(...args),
}));

describe('editReferrerExcludes', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    updateReferrerExcludesMock.mockClear();
  });

  it('로그인하지 않았으면 실패하고 저장하지 않는다', async () => {
    authState.userId = null;
    const result = await editReferrerExcludes(['t.co']);
    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(updateReferrerExcludesMock).not.toHaveBeenCalled();
  });

  it('앞뒤 공백을 정리하고 빈 문자열을 제거한 뒤 저장한다', async () => {
    const result = await editReferrerExcludes([' t.co ', '', 'l.facebook.com']);
    expect(result).toEqual({ success: true });
    expect(updateReferrerExcludesMock).toHaveBeenCalledWith([
      't.co',
      'l.facebook.com',
    ]);
  });

  it('저장 중 예외가 발생하면 실패를 반환한다', async () => {
    updateReferrerExcludesMock.mockRejectedValueOnce(new Error('db error'));
    const result = await editReferrerExcludes(['t.co']);
    expect(result).toEqual({ success: false, error: '저장에 실패했습니다' });
  });
});
```

- [x] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/statistics/referrers/_services/edit-referrer-excludes.test.ts
```

기대: 모듈이 없어 FAIL.

- [x] **Step 3: Server Action 구현**

```ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updateReferrerExcludes } from '@/db/queries/settings';

type Result = { success: true } | { success: false; error: string };

export async function editReferrerExcludes(
  excludes: string[]
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const cleaned = excludes.map((item) => item.trim()).filter(Boolean);

  try {
    await updateReferrerExcludes(cleaned);
    // getBlogSettings()가 unstable_cache로 감싸져 있어 태그 무효화가 필요하다
    revalidateTag(CACHE_TAGS.settings, 'max');
    revalidatePath('/admin/statistics/referrers');
    return { success: true };
  } catch {
    return { success: false, error: '저장에 실패했습니다' };
  }
}
```

- [x] **Step 4: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/statistics/referrers/_services/edit-referrer-excludes.test.ts
```

기대: 3개 테스트 모두 PASS.

- [x] **Step 5: 관리 UI — 실패하는 테스트 작성**

`src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.test.tsx` 신규 생성:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editReferrerExcludes } from '../_services/edit-referrer-excludes';
import { ReferrerExcludesFormAction } from './referrer-excludes-form.action';

vi.mock('../_services/edit-referrer-excludes', () => ({
  editReferrerExcludes: vi.fn(),
}));

describe('ReferrerExcludesFormAction', () => {
  beforeEach(() => {
    vi.mocked(editReferrerExcludes).mockReset();
  });

  it('규칙이 없으면 안내 문구를 보여준다', () => {
    render(<ReferrerExcludesFormAction excludes={[]} />);
    expect(
      screen.getByText('항상 제외할 유입 경로가 없습니다.')
    ).toBeInTheDocument();
  });

  it('기존 규칙을 칩으로 보여준다', () => {
    render(<ReferrerExcludesFormAction excludes={['t.co']} />);
    expect(screen.getByText('t.co')).toBeInTheDocument();
  });

  it('입력 후 추가 버튼을 누르면 새 규칙과 함께 저장한다', async () => {
    vi.mocked(editReferrerExcludes).mockResolvedValue({ success: true });
    render(<ReferrerExcludesFormAction excludes={['t.co']} />);

    fireEvent.change(screen.getByPlaceholderText('예: t.co'), {
      target: { value: 'l.facebook.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() =>
      expect(editReferrerExcludes).toHaveBeenCalledWith([
        't.co',
        'l.facebook.com',
      ])
    );
  });

  it('칩의 삭제 버튼을 누르면 그 항목을 뺀 목록으로 저장한다', async () => {
    vi.mocked(editReferrerExcludes).mockResolvedValue({ success: true });
    render(
      <ReferrerExcludesFormAction excludes={['t.co', 'l.facebook.com']} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 't.co 제외 목록에서 삭제' })
    );

    await waitFor(() =>
      expect(editReferrerExcludes).toHaveBeenCalledWith(['l.facebook.com'])
    );
  });

  it('저장에 실패하면 에러 메시지를 보여준다', async () => {
    vi.mocked(editReferrerExcludes).mockResolvedValue({
      success: false,
      error: '저장 실패',
    });
    render(<ReferrerExcludesFormAction excludes={[]} />);

    fireEvent.change(screen.getByPlaceholderText('예: t.co'), {
      target: { value: 't.co' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('저장 실패')).toBeInTheDocument();
  });
});
```

- [x] **Step 6: 테스트 실행 → 실패 확인**

```bash
npx vitest run src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.test.tsx
```

기대: 모듈이 없어 FAIL.

- [x] **Step 7: 관리 UI 구현**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { editReferrerExcludes } from '../_services/edit-referrer-excludes';

type Props = {
  excludes: string[];
};

export function ReferrerExcludesFormAction({ excludes }: Props) {
  const [items, setItems] = useState(excludes);
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = (next: string[]) => {
    startTransition(async () => {
      const result = await editReferrerExcludes(next);
      if (result.success) {
        setItems(next);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  };

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed || items.includes(trimmed)) return;
    setValue('');
    save([...items, trimmed]);
  };

  const handleRemove = (target: string) => {
    save(items.filter((item) => item !== target));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            항상 제외할 유입 경로가 없습니다.
          </p>
        ) : (
          items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 pr-1">
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={isPending}
                aria-label={`${item} 제외 목록에서 삭제`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="예: t.co"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" onClick={handleAdd} disabled={isPending}>
          추가
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
```

- [x] **Step 8: 테스트 재실행 → 통과 확인**

```bash
npx vitest run src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.test.tsx
```

기대: 5개 테스트 모두 PASS.

- [x] **Step 9: 유입경로 페이지에 배치**

`src/app/admin/statistics/referrers/page.tsx`에 import와 카드를 추가 — 상위 유입 경로 표 카드 앞에:

```tsx
import { ReferrerExcludesFormAction } from './_actions/referrer-excludes-form.action';
```

```tsx
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="text-base">항상 제외</CardTitle>
  </CardHeader>
  <CardContent>
    <ReferrerExcludesFormAction excludes={settings?.referrerExcludes ?? []} />
  </CardContent>
</Card>
```

- [x] **Step 10: 전체 검증**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 전부 PASS, 신규 에러 0건.

- [x] **Step 11: 커밋**

```bash
git add src/app/admin/statistics/referrers/_services/edit-referrer-excludes.ts \
  src/app/admin/statistics/referrers/_services/edit-referrer-excludes.test.ts \
  src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.tsx \
  src/app/admin/statistics/referrers/_actions/referrer-excludes-form.action.test.tsx \
  src/app/admin/statistics/referrers/page.tsx
git commit -m "✨ feat: 유입경로 항상 제외 규칙 관리 UI 추가"
```

---

## Task 7: 블로그 설정 — 하단 플로팅 저장 바 + `editSettings` 정리

**Files:**

- Modify: `src/app/admin/settings/_services/edit-settings.ts`
- Modify: `src/app/admin/settings/_actions/settings-form.action.tsx`
- Modify: `src/app/admin/settings/_actions/settings-form.action.test.tsx`

**Interfaces:**

- Consumes: 없음
- Produces: `editSettings(data: BlogSettingsFormValues): Promise<{ success: true } | { success: false; error: string }>` — 다른 Server Action과 동일한 반환 패턴. `SettingsFormAction`의 섹션 `id="basic"`/`id="social"` — Task 8의 좌측 내비게이션이 이 id로 이동한다

- [x] **Step 1: 기존 테스트에서 실패할 부분 먼저 확인**

```bash
npx vitest run src/app/admin/settings/_actions/settings-form.action.test.tsx
```

현재 통과 상태를 기록해 둔다 — 이번 태스크에서 `editSettings` mock과 제출 관련 단언을 고칠 것이다.

- [x] **Step 2: `edit-settings.ts`를 인증 + `Result` 패턴으로 변경**

```ts
'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updateBlogSettings } from '@/db/queries/settings';
import type { BlogSettingsFormValues } from '../_actions/settings-form.action';

type Result = { success: true } | { success: false; error: string };

export async function editSettings(
  data: BlogSettingsFormValues
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const { github, twitter, linkedin, ...rest } = data;
  const socialLinks: Record<string, string> = {};
  if (github) socialLinks.github = github;
  if (twitter) socialLinks.twitter = twitter;
  if (linkedin) socialLinks.linkedin = linkedin;

  try {
    await updateBlogSettings({ ...rest, socialLinks });
    revalidateTag(CACHE_TAGS.settings, 'max');
    return { success: true };
  } catch {
    return { success: false, error: '저장에 실패했습니다' };
  }
}
```

- [x] **Step 3: `settings-form.action.tsx`에 `id`·`isDirty`·플로팅 바 반영**

`src/app/admin/settings/_actions/settings-form.action.tsx` 전체 교체:

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BlogSettings } from '@/db/queries/settings';
import { editSettings } from '../_services/edit-settings';

const blogSettingsSchema = z.object({
  blogName: z.string().min(1, '블로그 이름은 필수입니다').max(100),
  tagline: z.string().max(255).optional(),
  authorBio: z.string().optional(),
  siteUrl: z
    .string()
    .url('유효한 URL을 입력하세요')
    .max(255)
    .optional()
    .or(z.literal('')),
  defaultMetaDescription: z.string().max(300).optional(),
  github: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
});

export type BlogSettingsFormValues = z.infer<typeof blogSettingsSchema>;

type Props = {
  defaultValues?: BlogSettings | null;
};

export function SettingsFormAction({ defaultValues }: Props) {
  const defaultFormValues: BlogSettingsFormValues = {
    blogName: defaultValues?.blogName ?? '',
    tagline: defaultValues?.tagline ?? '',
    authorBio: defaultValues?.authorBio ?? '',
    siteUrl: defaultValues?.siteUrl ?? '',
    defaultMetaDescription: defaultValues?.defaultMetaDescription ?? '',
    github: defaultValues?.socialLinks?.github ?? '',
    twitter: defaultValues?.socialLinks?.twitter ?? '',
    linkedin: defaultValues?.socialLinks?.linkedin ?? '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BlogSettingsFormValues>({
    resolver: zodResolver(blogSettingsSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: BlogSettingsFormValues) => {
    const result = await editSettings(data);
    if (result.success) {
      toast.success('설정이 저장되었습니다');
      reset(data);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      <section id="basic" className="space-y-4">
        <h2 className="text-lg font-semibold">기본 정보</h2>

        <div className="space-y-2">
          <Label htmlFor="blogName">블로그 이름 *</Label>
          <Input id="blogName" {...register('blogName')} />
          {errors.blogName && (
            <p className="text-destructive text-sm">
              {errors.blogName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">태그라인</Label>
          <Input
            id="tagline"
            placeholder="개발하며 배운 것들을 기록합니다."
            {...register('tagline')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorBio">소개</Label>
          <Textarea
            id="authorBio"
            rows={3}
            placeholder="Frontend · Backend · 일상의 메모"
            {...register('authorBio')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteUrl">사이트 URL</Label>
          <Input
            id="siteUrl"
            placeholder="https://example.com"
            {...register('siteUrl')}
          />
          {errors.siteUrl && (
            <p className="text-destructive text-sm">{errors.siteUrl.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultMetaDescription">기본 메타 설명</Label>
          <Textarea
            id="defaultMetaDescription"
            rows={2}
            placeholder="검색 엔진에 표시될 기본 설명"
            {...register('defaultMetaDescription')}
          />
          {errors.defaultMetaDescription && (
            <p className="text-destructive text-sm">
              {errors.defaultMetaDescription.message}
            </p>
          )}
        </div>
      </section>

      <section id="social" className="space-y-4">
        <h2 className="text-lg font-semibold">소셜 링크</h2>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            placeholder="https://github.com/username"
            {...register('github')}
          />
          {errors.github && (
            <p className="text-destructive text-sm">{errors.github.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter / X</Label>
          <Input
            id="twitter"
            placeholder="https://twitter.com/username"
            {...register('twitter')}
          />
          {errors.twitter && (
            <p className="text-destructive text-sm">{errors.twitter.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            placeholder="https://linkedin.com/in/username"
            {...register('linkedin')}
          />
          {errors.linkedin && (
            <p className="text-destructive text-sm">
              {errors.linkedin.message}
            </p>
          )}
        </div>
      </section>

      {isDirty && (
        <div className="bg-background sticky bottom-0 -mx-8 border-t px-8 py-4 shadow-lg">
          <div className="flex max-w-2xl items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(defaultFormValues)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
```

> `-mx-8`은 `admin/layout.tsx`의 `<main className="flex-1 px-8 py-8">`가 주는 좌우 여백을 상쇄해 저장 바를 본문 폭 전체로 펼친다. `useTransition`을 걷어내고 `handleSubmit`의 `isSubmitting`으로 대체했다 — react-hook-form이 제출 상태를 이미 추적하므로 별도 상태가 불필요해졌다.

- [x] **Step 4: 기존 테스트 파일 갱신**

새 컴포넌트는 폼이 dirty할 때만 저장 버튼(문구도 `저장` → `변경사항 저장`)을 렌더한다. 기존 "저장 버튼이 렌더링된다"·"블로그 이름이 없으면 유효성 에러가 표시된다" 테스트가 이 전제를 깨므로, `src/app/admin/settings/_actions/settings-form.action.test.tsx`를 아래 내용으로 전체 교체한다 (zod 스키마 테스트 블록은 그대로 유지):

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { editSettings } from '../_services/edit-settings';
import { SettingsFormAction } from './settings-form.action';

// next/link mock
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

// edit-settings mock
vi.mock('../_services/edit-settings', () => ({
  editSettings: vi.fn().mockResolvedValue({ success: true }),
}));

// sonner mock
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// -------------------------------------------------------------------
// zod 스키마 단위 테스트
// -------------------------------------------------------------------

const blogSettingsSchema = z.object({
  blogName: z.string().min(1, '블로그 이름은 필수입니다').max(100),
  tagline: z.string().max(255).optional(),
  authorBio: z.string().optional(),
  siteUrl: z
    .string()
    .url('유효한 URL을 입력하세요')
    .max(255)
    .optional()
    .or(z.literal('')),
  defaultMetaDescription: z.string().max(300).optional(),
  github: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
});

describe('blogSettingsSchema', () => {
  const validData = { blogName: 'YJlogs' };

  it('blogName만 있어도 유효하다', () => {
    expect(blogSettingsSchema.safeParse(validData).success).toBe(true);
  });

  it('blogName이 비어 있으면 실패한다', () => {
    const result = blogSettingsSchema.safeParse({ blogName: '' });
    expect(result.success).toBe(false);
  });

  it('유효한 siteUrl은 통과한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      siteUrl: 'https://yjlogs.com',
    });
    expect(result.success).toBe(true);
  });

  it('빈 문자열 siteUrl은 통과한다', () => {
    const result = blogSettingsSchema.safeParse({ ...validData, siteUrl: '' });
    expect(result.success).toBe(true);
  });

  it('잘못된 형식의 siteUrl은 실패한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      siteUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('유효한 github URL은 통과한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      github: 'https://github.com/yjkim91',
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 형식의 github URL은 실패한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      github: 'github.com/yjkim91',
    });
    expect(result.success).toBe(false);
  });

  it('blogName이 100자를 초과하면 실패한다', () => {
    const result = blogSettingsSchema.safeParse({
      blogName: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------
// SettingsFormAction 컴포넌트 테스트
// -------------------------------------------------------------------

describe('SettingsFormAction', () => {
  it('기본 필드들이 렌더링된다', () => {
    render(<SettingsFormAction />);

    expect(screen.getByLabelText('블로그 이름 *')).toBeInTheDocument();
    expect(screen.getByLabelText('태그라인')).toBeInTheDocument();
    expect(screen.getByLabelText('소개')).toBeInTheDocument();
    expect(screen.getByLabelText('사이트 URL')).toBeInTheDocument();
    expect(screen.getByLabelText('기본 메타 설명')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter / X')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });

  it('변경 사항이 없으면 저장 바를 렌더하지 않는다', () => {
    render(<SettingsFormAction />);
    expect(
      screen.queryByRole('button', { name: '변경사항 저장' })
    ).not.toBeInTheDocument();
  });

  it('필드를 바꾸면 하단 저장 바가 나타난다', () => {
    render(<SettingsFormAction />);
    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });
    expect(
      screen.getByRole('button', { name: '변경사항 저장' })
    ).toBeInTheDocument();
  });

  it('defaultValues가 폼 필드에 반영된다', () => {
    const defaultValues = {
      id: 1,
      blogName: 'My Blog',
      tagline: '기록하는 블로그',
      authorBio: '개발자',
      siteUrl: 'https://example.com',
      defaultMetaDescription: '설명',
      socialLinks: { github: 'https://github.com/test' },
      referrerExcludes: [],
      updatedAt: new Date(),
    };

    render(<SettingsFormAction defaultValues={defaultValues} />);

    expect(screen.getByLabelText('블로그 이름 *')).toHaveValue('My Blog');
    expect(screen.getByLabelText('태그라인')).toHaveValue('기록하는 블로그');
    expect(screen.getByLabelText('소개')).toHaveValue('개발자');
    expect(screen.getByLabelText('GitHub')).toHaveValue(
      'https://github.com/test'
    );
  });

  it('blogName이 없으면 유효성 에러가 표시된다', async () => {
    render(<SettingsFormAction />);

    const blogNameInput = screen.getByLabelText('블로그 이름 *');
    fireEvent.change(blogNameInput, { target: { value: 'x' } });
    fireEvent.change(blogNameInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }));

    await waitFor(() => {
      expect(screen.getByText('블로그 이름은 필수입니다')).toBeInTheDocument();
    });
  });

  it('유효한 데이터 제출 시 editSettings가 호출된다', async () => {
    render(<SettingsFormAction />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }));

    await waitFor(() => {
      expect(editSettings).toHaveBeenCalledWith(
        expect.objectContaining({ blogName: 'YJlogs' })
      );
    });
  });

  it('저장 성공 시 toast.success가 호출되고 저장 바가 사라진다', async () => {
    render(<SettingsFormAction />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('설정이 저장되었습니다');
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: '변경사항 저장' })
      ).not.toBeInTheDocument();
    });
  });

  it('저장 실패 시 toast.error가 호출된다', async () => {
    vi.mocked(editSettings).mockResolvedValueOnce({
      success: false,
      error: '저장 실패',
    });
    render(<SettingsFormAction />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('저장 실패');
    });
  });
});
```

- [x] **Step 5: 테스트 실행 → 통과 확인**

```bash
npx vitest run src/app/admin/settings/_actions/settings-form.action.test.tsx
```

기대: 전부 PASS.

- [x] **Step 6: 커밋**

```bash
git add src/app/admin/settings/_services/edit-settings.ts \
  src/app/admin/settings/_actions/settings-form.action.tsx \
  src/app/admin/settings/_actions/settings-form.action.test.tsx
git commit -m "✨ feat: 블로그 설정 하단 플로팅 저장 바 + editSettings 인증 추가"
```

---

## Task 8: 블로그 설정 — 좌측 앵커 내비게이션

**Files:**

- Create: `src/app/admin/settings/_components/settings-nav.tsx`
- Modify: `src/app/admin/settings/page.tsx`

**Interfaces:**

- Consumes: Task 7이 붙인 `id="basic"`/`id="social"`
- Produces: `SettingsNav({ sections: { id: string; label: string }[] })` — `page.tsx`가 렌더한다

이 컴포넌트는 상태 없는 정적 링크 목록이다 — `PostStatusFilterAction`·`StatCard`와 같은 이유로 전용 단위 테스트를 만들지 않는다.

- [x] **Step 1: 좌측 내비게이션 구현**

```tsx
type Section = {
  id: string;
  label: string;
};

type Props = {
  sections: Section[];
};

export function SettingsNav({ sections }: Props) {
  return (
    <nav className="sticky top-8 hidden h-fit w-40 shrink-0 sm:block">
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted block rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [x] **Step 2: `page.tsx`를 2컬럼 레이아웃으로 재조립**

```tsx
import { getBlogSettings } from '@/db/queries/settings';
import { SettingsFormAction } from './_actions/settings-form.action';
import { SettingsNav } from './_components/settings-nav';

const SECTIONS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'social', label: '소셜 링크' },
];

export default async function AdminSettingsPage() {
  const settings = await getBlogSettings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">블로그 설정</h1>
      <div className="flex gap-8">
        <SettingsNav sections={SECTIONS} />
        <div className="min-w-0 flex-1">
          <SettingsFormAction defaultValues={settings} />
        </div>
      </div>
    </div>
  );
}
```

> 좁은 화면(`sm` 미만)에서는 `SettingsNav`가 숨는다 — 모바일은 스펙 우선순위가 낮고(「영향 범위 · 모바일」), 세로로 긴 폼에서 좌측 내비게이션 없이도 스크롤만으로 접근 가능하므로 가로 스크롤만 생기지 않으면 된다.

- [x] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건.

- [x] **Step 4: 커밋**

```bash
git add src/app/admin/settings/_components/settings-nav.tsx src/app/admin/settings/page.tsx
git commit -m "✨ feat: 블로그 설정에 좌측 앵커 내비게이션 추가"
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

기대: 전부 PASS. → 결과: 92 files / 497 tests 전부 PASS.

- [x] **Step 2: 린트**

```bash
npm run lint
```

기대: 이 PR이 건드린 파일에서 신규 에러 0건. → 결과: 2 errors/42 warnings 중 이 PR 변경 파일에서는 에러 0건(`docs/design/ralli/support.js`의 사전 존재 에러 2건은 무관). `edit-referrer-excludes.test.ts`에 unused-var warning 1건(기존 저장소 전반의 `_prefix` 컨벤션과 동일한 패턴, 비차단).

- [x] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건. → 결과: 신규 에러 0건(`e2e/ralli.spec.ts`의 사전 존재 Playwright 타입 에러 1건만 남음, 이 PR과 무관).

- [x] **Step 4: 빌드**

```bash
npm run build
```

기대: 타입스크립트 컴파일 통과. → 결과: 빌드 성공(`Compiled successfully`, 정적 페이지 생성 포함).

- [ ] **Step 5: 브라우저 육안 확인 (사용자 확인 필요)**

`/admin/*`은 Clerk 인증을 요구하므로 로그인 세션 없이는 에이전트가 확인할 수 없다. **아래는 사용자가 직접 확인한다.** (에이전트 세션에서는 스킵 — PR 리뷰 중 사용자가 직접 확인 예정)

- [ ] 대시보드: 카드 4개 아래에 최근 30일 방문 추이 차트가 뜬다
- [ ] 방문 통계: [7일][30일][전체] 세그먼트를 바꾸면 그래프·인기 글은 그대로고, "최근 N일" 비교 카드의 값과 증감률이 바뀐다. [전체]를 고르면 비교 카드가 사라진다
- [ ] 방문 통계: 증감이 양수면 초록, 음수면 빨강으로 표시된다
- [ ] 유입경로: [항상 제외]에 호스트네임을 추가하면 그 즉시 아래 표에서 해당 유입경로가 사라진다. 삭제하면 다시 나타난다
- [ ] 유입경로: 기간 세그먼트가 방문 통계와 똑같은 모양으로 동작한다
- [ ] 블로그 설정: 아무 값이나 바꾸면 하단에 저장 바가 나타나고, 저장하거나 취소하면 사라진다
- [ ] 블로그 설정: 좌측 "기본 정보"/"소셜 링크" 링크를 누르면 해당 섹션으로 스크롤된다
- [ ] 블로그 설정: 인증 없이 Server Action을 직접 호출할 수 없다(코드 리뷰로 확인 — `editSettings`가 `auth()`를 체크하는지)
- [ ] 다크 모드에서 차트·뱃지·저장 바 대비가 읽을 만하다
- [ ] 글 관리·카테고리·태그·시리즈·댓글 관리 화면(PR 2·3 산출물)이 이 PR 전후로 달라지지 않았다

- [x] **Step 6: plan 문서 완료 기록**

이 문서 상단에 완료 일자와 결과 요약을 추가하고, 모든 체크박스를 `- [x]`로 반영한다.

- [x] **Step 7: PR 생성 (사용자 확인 필요)**

`develop`으로의 PR 생성은 공유 브랜치에 영향을 주므로 사용자 확인 없이 진행하지 않는다. 머지는 squash 금지, `--no-ff` 머지 커밋 방식이다. 이 PR이 머지되면 어드민 리디자인 4개 PR 로드맵이 전부 완료된다. → 결과: 이 세션을 시작한 지시에서 PR 생성까지 명시적으로 위임받아 진행 — PR [#85](https://github.com/qlrogo91lp/yj-blog/pull/85) 생성 완료(머지는 하지 않음, 컨트롤러 검토 대기).

---
