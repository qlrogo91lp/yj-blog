# 어드민 시안 갭 정리 구현 계획 (어드민 리디자인 PR 5/5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PR 1~4 완료 후 시안 대조에서 드러난 갭 중 **현재 데이터로 구현 가능한 것**을 모두 닫는다. 가장 큰 건 시안 2c(대시보드 = 분석 화면)가 통째로 빠진 것이고, 그다음이 스펙이 명시적으로 채택했는데 누락된 "직전 기간 비교" 차트와 유입경로의 도메인 그룹핑이다.

**Architecture:** 새 스키마 컬럼도, 새 트래킹 필드도 만들지 않는다 — 전부 기존 `dailyStats`·`referrers`·`posts`·`comments` 데이터를 다르게 집계·표현하는 작업이다. 대시보드는 새 집계 쿼리 하나(`selectDashboardOverview`)로 필요한 값을 한 번에 모으고, 화면은 좌측 분석 칼럼 + 우측 액션 칼럼 2단으로 재조립한다. 유입경로는 집계 단계에서 호스트네임 기준으로 묶고 개발 트래픽을 자동 분리한 뒤, 화면이 그 결과를 접힘/펼침으로 표현한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui + radix-ui, Drizzle ORM(neon-http), recharts, Vitest + Testing Library

**Spec:** [2026-08-20-admin-cell-a-redesign-design.md](../specs/2026-08-20-admin-cell-a-redesign-design.md)
**시안 원본:** Claude Design 아티팩트 "Yjlogs 어드민 리모델링 시안" (`bc6b7bf8-ce14-4fc6-bf5b-5661ffc790aa`)

## Global Constraints

- Tailwind v4 문법만 쓴다 — CSS 변수는 `max-w-(--x)`, 그라디언트는 `bg-linear-to-*`, spacing 스케일의 4배수 px 임의값은 숫자 유틸리티.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다. **`src/app/admin/page.tsx:37`이 현재 이 규칙을 어기고 있다(`className="h-4 w-4"`) — Task 2에서 그 파일을 재작성하며 함께 없어진다.**
- React hook·타입은 named import. `React.useState`와 `import * as React` 금지.
- 색상 hex를 컴포넌트에 직접 쓰지 않는다. 상태 색은 `--status-published` / `--status-draft` / `--status-danger` 토큰의 Tailwind 유틸을 쓴다.
- CRUD 동사 컨벤션 — Server Action은 `add`/`get`/`edit`/`remove`, DB 쿼리는 `insert`/`select`/`update`/`delete`.
- 날짜 포맷·연산은 date-fns를 쓴다. 네이티브 날짜 메서드 금지.
- `console.log`를 커밋하지 않는다.
- 폴더·파일 네이밍은 `.claude/rules/page-folder.md`를 따른다.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 만든다.
- **스키마 변경 없음.** 이 PR은 `drizzle-kit push`를 실행하지 않는다.

## 이 PR의 범위 밖

- **통계 지표 3종(평균 체류·재방문율·기기 비율)** — 스펙 62~70행이 "데이터가 존재하지 않는다"고 결정. `/api/track`을 확장하지 않으므로 여전히 불가능하다. 시안의 3번째 지표 슬롯은 아래 「결정 사항」대로 **외부 유입 수**로 대체한다.
- **블로그 설정 "외형" 토글 3종** — 스펙 77~89행이 명시적으로 제외. 기술적으로는 가능하지만 스펙 결정을 이 PR에서 뒤집지 않는다.
- **태그 이름 바꾸기·병합·태그별 글 목록 펼치기** — PR 2 플랜 42행이 제외. 시안 1d의 안내 박스도 그리지 않는다.
- **시리즈 회차 드래그 정렬** — 스펙 53~60행이 제외.
- **`StatsChart`/`PostDailyChart`의 hex 하드코딩을 CSS 토큰으로 교체** — PR 4 플랜 44행이 "recharts SVG 속성에 `var(--x)`를 직접 넣는 방식은 브라우저 지원이 불확실"하다고 보류. Task 3이 `StatsChart`를 건드리지만 **색 지정 방식은 그대로 두고 계열만 추가**한다.
- **`referrerExcludes`의 와일드카드·부분 문자열 매칭** — PR 4 플랜 45행이 제외. 호스트네임 완전 일치만 유지한다.
- **댓글 관리 페이지네이션 컨트롤 UI** — PR 3 플랜이 제외.
- PR 1~4 최종 리뷰에서 보류(parked)한 항목 중 이 PR이 건드리지 않는 파일의 것들.

---

## 로드맵

| 순서 | 브랜치 | plan 문서 | 상태 |
|---|---|---|---|
| 1 | `refactor/admin-shell-cell-a` | [shell-cell-a](./2026-08-20-admin-shell-cell-a.md) | 완료 (PR #83) |
| 2 | `refactor/admin-content-screens` | [content-screens](./2026-08-20-admin-content-screens.md) | 완료 (PR #84) |
| 3 | `feature/admin-comment-reply` | [comment-reply](./2026-08-20-admin-comment-reply.md) | 완료 (PR #86) |
| 4 | `refactor/admin-stats-settings` | [stats-settings](./2026-08-20-admin-stats-settings.md) | 완료 (PR #85) |
| 5 | `feature/admin-design-gap-closing` | 이 문서 | 진행 예정 |

---

## 결정 사항

시안과 현실이 어긋나는 지점에서 내린 판단이다. 실행 전에 이견이 있으면 여기부터 고친다.

### 통계·유입경로 메뉴는 그대로 둔다

시안 2c의 캡션은 *"방문 통계·유입경로를 별도 메뉴로 두지 않고 대시보드가 곧 분석 화면"* 이라고 못 박는다. 하지만 그대로 따르면 PR 4가 만든 두 화면(인기 글 Top 10, 글별 일별 추이, 유입 제외 규칙 폼)을 통째로 버려야 한다. 이 화면들은 대시보드 한 장에 들어갈 밀도가 아니다.

**대시보드를 시안 2c의 레이아웃·정보 구성대로 만들되, 두 화면은 상세 드릴다운으로 남긴다.** 대시보드의 "인기 글"·"유입경로" 블록에 각각 `/admin/statistics`·`/admin/statistics/referrers`로 가는 링크를 달아 관계를 드러낸다. 사이드바 통계 그룹도 유지한다.

### 다크 스탯 카드의 3번째 지표는 "외부 유입"으로 대체한다

시안은 방문 / 페이지뷰 / **평균 체류(2:41)** 3칸이다. 평균 체류는 데이터가 없어 스펙이 제외했다. 빈칸으로 두거나 2칸으로 줄이는 대신 **외부 유입 수**(선택 기간의 `referrers` 중 자기 도메인·개발 트래픽·제외 규칙을 뺀 방문 수)를 넣는다 — 기존 데이터로 계산되고, 블로그 운영자가 실제로 보고 싶어 하는 숫자이며, 시안의 3칸 구성을 지킨다.

### 시각 표기는 시안대로 상대시각으로 통일한다

시안은 "2시간 전", "1일 전", "지난주"를 쓰는데 현재 댓글·대시보드 위젯은 전부 절대시각(`yyyy.M.d HH:mm` / `M월 d일`)이다. `date-fns`의 `formatDistanceToNow`로 통일한다 — 이미 [post-row.tsx](../../src/app/admin/posts/_components/post-row.tsx)가 임시저장 행에서 쓰고 있는 방식이다.

**단, 댓글 카드의 대댓글(`comment-reply-row.tsx`)은 절대시각을 유지한다.** 스레드 안에서 답글이 언제 달렸는지는 정확한 시각이 더 유용하고, 시안에도 대댓글의 시각 표기가 없다.

### 개발 트래픽은 호스트네임 패턴으로 자동 판별한다

시안 3e의 *"localhost·개발 트래픽 112회는 접어뒀습니다"* 를 구현하려면 무엇이 개발 트래픽인지 정해야 한다. `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`, 사설 IP 대역(`10.`/`192.168.`/`172.16~31.`)을 개발 트래픽으로 본다. 사용자가 등록한 `referrerExcludes`와는 **별개 축**이다 — 개발 트래픽은 자동 감지되어 접히고(펼쳐볼 수 있음), `referrerExcludes`는 집계에서 완전히 빠진다.

### 유입경로는 호스트네임으로 묶는다

현재 [statistics.ts](../../src/db/queries/statistics.ts)의 `selectTopReferrers`는 **원본 referrer 문자열**로 카운트하는데 화면은 hostname만 뽑아 보여준다. 그래서 `https://search.naver.com/a`와 `https://search.naver.com/b`가 "search.naver.com" 두 행으로 중복된다. 집계 단계에서 hostname으로 묶고, 시안처럼 알려진 서비스(네이버·구글 등)는 한 그룹으로 합쳐 하위 호스트를 보조 라인에 나열한다.

---

## File Structure

**생성**

| 파일 | 책임 |
|---|---|
| `src/app/admin/_utils/referrer-group.ts` | 호스트네임 → 서비스 그룹 매핑, 개발 트래픽 판별 (순수 함수) |
| `src/app/admin/_utils/referrer-group.test.ts` | 그룹핑·개발 트래픽 판별 검증 |
| `src/app/admin/_components/dashboard-stat-panel.tsx` | 다크 스탯 카드 + 라인차트 (시안 2c 좌상단) |
| `src/app/admin/_components/dashboard-stat-panel.test.tsx` | 지표·증감 렌더 검증 |
| `src/app/admin/_components/dashboard-rank-list.tsx` | 인기 글 / 유입경로 순위 블록 (순수, 퍼센트 바 포함) |
| `src/app/admin/_components/dashboard-rank-list.test.tsx` | 순위·퍼센트 바 렌더 검증 |
| `src/app/admin/_components/draft-queue-widget.tsx` | "이어 쓸 글 N" 우측 칼럼 위젯 |
| `src/app/admin/_components/draft-queue-widget.test.tsx` | 임시저장 한정·상대시각 검증 |
| `src/app/admin/_components/pending-comments-widget.tsx` | "새 댓글 N" 우측 칼럼 위젯 |
| `src/app/admin/_components/pending-comments-widget.test.tsx` | 인용 표기·상대시각 검증 |
| `src/app/admin/statistics/referrers/_components/referrer-row.tsx` | letter 뱃지 + 그룹명 + 하위 호스트 보조 라인 (순수) |
| `src/app/admin/statistics/referrers/_components/referrer-row.test.tsx` | 행 렌더 검증 |
| `src/app/admin/statistics/referrers/_actions/dev-traffic-notice.action.tsx` | 개발 트래픽 접힘 알림 + [펼치기] |
| `src/app/admin/statistics/referrers/_actions/dev-traffic-notice.action.test.tsx` | 접힘/펼침 검증 |
| `src/app/admin/comments/_components/comment-avatar.tsx` | 작성자 이니셜 아바타 (순수) |
| `src/app/admin/comments/_components/comment-avatar.test.tsx` | 이니셜 추출 검증 |

**수정**

| 파일 | 변경 |
|---|---|
| `src/db/queries/daily-stats.ts` | `selectDashboardOverview(days)` 추가 |
| `src/db/queries/statistics.ts` | `selectTopReferrers`를 호스트네임 그룹 집계로 교체, 개발 트래픽 분리 반환 |
| `src/db/queries/posts.ts` | `selectDraftQueue(limit)` 추가 (임시저장 글, 최근 수정 순) |
| `src/db/queries/comments.ts` | `selectPendingComments(limit)` 추가 (답변 대기 스레드) |
| `src/db/queries/tags.ts` | `getAllTags` 정렬을 사용량 내림차순 → 이름 순으로 |
| `src/app/admin/_components/stats-chart.tsx` | 직전 기간 계열 추가 (`previousViews`·`previousVisitors`) |
| `src/app/admin/page.tsx` | 시안 2c 레이아웃으로 전면 재작성 |
| `src/app/admin/statistics/page.tsx` | `AdminPageHeader` 적용 + 부제 |
| `src/app/admin/statistics/referrers/page.tsx` | `AdminPageHeader` + 부제 + 개발 트래픽 알림 + 새 행 컴포넌트 |
| `src/app/admin/settings/page.tsx` | `AdminPageHeader` + 부제, 앵커에 "SEO · 공유" 추가 |
| `src/app/admin/settings/_actions/settings-form.action.tsx` | SEO 섹션 분리, 필드 라벨 시안화, 저장 바를 알약 + "변경사항 N개"로 |
| `src/app/admin/categories/page.tsx` | 헤더에 [새 카테고리] 버튼 |
| `src/app/admin/series/page.tsx` | 헤더에 [새 시리즈] 버튼 |
| `src/app/admin/comments/page.tsx` | `AdminPageHeader` + "답변 대기 N · 전체 N" 부제 |
| `src/app/admin/comments/_actions/comment-card.action.tsx` | 아바타 추가, 상대시각, 글 제목을 메타 줄로 이동 |
| `src/app/admin/_actions/admin-sidebar.action.tsx` | `pendingReplyCount` prop 주석의 과거 시제 정리 |

**삭제**

| 파일 | 이유 |
|---|---|
| `src/app/admin/_components/quick-actions.tsx` | 시안 2c의 "새 글 쓰기" 단독 버튼으로 대체 |
| `src/app/admin/_components/recent-posts-widget.tsx` | `draft-queue-widget.tsx`로 대체 |
| `src/app/admin/_components/recent-comments-widget.tsx` | `pending-comments-widget.tsx`로 대체 |

---

## Task 1: 유입경로 그룹핑 유틸

**Files:**
- Create: `src/app/admin/_utils/referrer-group.ts`
- Test: `src/app/admin/_utils/referrer-group.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 모듈)
- Produces:
  - `extractHostname(referrer: string): string` — URL 파싱 실패 시 빈 문자열
  - `isDevTraffic(hostname: string): boolean` — localhost·사설 IP·`.local` 판별
  - `resolveReferrerGroup(hostname: string, siteHostname?: string): { key: string; label: string; letter: string }` — 알려진 서비스는 한 그룹으로, 자기 도메인은 "내부 링크", 나머지는 hostname 그대로

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/_utils/referrer-group.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  extractHostname,
  isDevTraffic,
  resolveReferrerGroup,
} from './referrer-group';

describe('extractHostname', () => {
  it('URL에서 호스트네임만 뽑는다', () => {
    expect(extractHostname('https://search.naver.com/search?q=a')).toBe(
      'search.naver.com'
    );
  });

  it('빈 문자열이면 빈 문자열을 돌려준다', () => {
    expect(extractHostname('')).toBe('');
  });

  it('URL이 아니면 빈 문자열을 돌려준다', () => {
    expect(extractHostname('not-a-url')).toBe('');
  });
});

describe('isDevTraffic', () => {
  it.each([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'macbook.local',
    '192.168.0.10',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.254',
  ])('%s는 개발 트래픽이다', (host) => {
    expect(isDevTraffic(host)).toBe(true);
  });

  it.each(['search.naver.com', 'www.google.com', 'yjlogs.com', '172.32.0.1'])(
    '%s는 개발 트래픽이 아니다',
    (host) => {
      expect(isDevTraffic(host)).toBe(false);
    }
  );

  it('빈 호스트네임은 개발 트래픽이 아니다', () => {
    expect(isDevTraffic('')).toBe(false);
  });
});

describe('resolveReferrerGroup', () => {
  it('네이버 하위 호스트를 한 그룹으로 묶는다', () => {
    const a = resolveReferrerGroup('m.search.naver.com');
    const b = resolveReferrerGroup('search.naver.com');

    expect(a.key).toBe(b.key);
    expect(a.label).toBe('네이버 검색');
    expect(a.letter).toBe('N');
  });

  it('구글을 인식한다', () => {
    const group = resolveReferrerGroup('www.google.com');
    expect(group.label).toBe('구글 검색');
    expect(group.letter).toBe('G');
  });

  it('빈 호스트네임은 직접 접근이다', () => {
    const group = resolveReferrerGroup('');
    expect(group.label).toBe('직접 접근');
    expect(group.letter).toBe('D');
  });

  it('자기 도메인은 내부 링크로 표시한다', () => {
    const group = resolveReferrerGroup('yjlogs.com', 'yjlogs.com');
    expect(group.label).toBe('내부 링크');
    expect(group.key).toBe('yjlogs.com');
  });

  it('자기 도메인의 www 변형도 내부 링크다', () => {
    expect(resolveReferrerGroup('www.yjlogs.com', 'yjlogs.com').label).toBe(
      '내부 링크'
    );
  });

  it('모르는 호스트는 호스트네임을 그대로 쓰고 첫 글자를 대문자로', () => {
    const group = resolveReferrerGroup('example.com');
    expect(group.key).toBe('example.com');
    expect(group.label).toBe('example.com');
    expect(group.letter).toBe('E');
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_utils/referrer-group.test.ts
```

기대: FAIL — `Failed to resolve import "./referrer-group"`.

- [x] **Step 3: 모듈 작성**

`src/app/admin/_utils/referrer-group.ts`:

```ts
export type ReferrerGroup = {
  key: string;
  label: string;
  letter: string;
};

/** URL 문자열에서 호스트네임만 뽑는다. 파싱 실패·빈 값이면 빈 문자열. */
export function extractHostname(referrer: string): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname;
  } catch {
    return '';
  }
}

const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
const PRIVATE_IP =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

/** 로컬 개발 환경에서 발생한 유입인지 판별한다. */
export function isDevTraffic(hostname: string): boolean {
  if (!hostname) return false;
  if (DEV_HOSTS.has(hostname)) return true;
  if (hostname.endsWith('.local')) return true;
  return PRIVATE_IP.test(hostname);
}

/** 하위 호스트를 하나로 묶을 알려진 서비스들 */
const KNOWN_SERVICES: { match: RegExp; key: string; label: string; letter: string }[] =
  [
    { match: /(^|\.)naver\.com$/, key: 'naver', label: '네이버 검색', letter: 'N' },
    { match: /(^|\.)google\.[a-z.]+$/, key: 'google', label: '구글 검색', letter: 'G' },
    { match: /(^|\.)daum\.net$/, key: 'daum', label: '다음 검색', letter: 'D' },
    { match: /(^|\.)bing\.com$/, key: 'bing', label: 'Bing 검색', letter: 'B' },
    { match: /(^|\.)(x|twitter)\.com$|^t\.co$/, key: 'x', label: 'X (Twitter)', letter: 'X' },
    { match: /(^|\.)facebook\.com$/, key: 'facebook', label: 'Facebook', letter: 'F' },
    { match: /(^|\.)github\.com$/, key: 'github', label: 'GitHub', letter: 'G' },
    { match: /(^|\.)news\.ycombinator\.com$/, key: 'hn', label: 'Hacker News', letter: 'H' },
  ];

/**
 * 호스트네임을 표시용 그룹으로 정규화한다.
 * siteHostname을 주면 자기 도메인을 "내부 링크"로 묶는다.
 */
export function resolveReferrerGroup(
  hostname: string,
  siteHostname?: string
): ReferrerGroup {
  if (!hostname) {
    return { key: 'direct', label: '직접 접근', letter: 'D' };
  }

  if (siteHostname) {
    const bare = siteHostname.replace(/^www\./, '');
    if (hostname === bare || hostname === `www.${bare}`) {
      return { key: bare, label: '내부 링크', letter: bare[0].toUpperCase() };
    }
  }

  const known = KNOWN_SERVICES.find((service) => service.match.test(hostname));
  if (known) {
    return { key: known.key, label: known.label, letter: known.letter };
  }

  return {
    key: hostname,
    label: hostname,
    letter: hostname[0].toUpperCase(),
  };
}
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_utils/referrer-group.test.ts
```

기대: 전부 PASS.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/_utils/referrer-group.ts src/app/admin/_utils/referrer-group.test.ts
git commit -m "✨ feat: 유입경로 도메인 그룹핑·개발 트래픽 판별 유틸 추가"
```

---

## Task 2: 유입경로 집계 쿼리 교체

**Files:**
- Modify: `src/db/queries/statistics.ts` (`selectTopReferrers` 교체)

**Interfaces:**
- Consumes: Task 1의 `extractHostname`, `isDevTraffic`, `resolveReferrerGroup`
- Produces: `selectTopReferrers(limit, days, excludes, siteUrl)` 반환 타입 변경

```ts
export type ReferrerGroupRow = {
  key: string;
  label: string;
  letter: string;
  hosts: string[];      // 이 그룹에 묶인 하위 호스트네임 (직접 접근이면 빈 배열)
  count: number;
  percentage: number;
};

export type TopReferrersResult = {
  rows: ReferrerGroupRow[];
  devTrafficCount: number;   // 개발 트래픽으로 접힌 방문 수
  externalCount: number;     // 직접 접근·내부 링크·개발 트래픽을 뺀 외부 유입 수
  totalCount: number;        // 제외 규칙 적용 후 전체 방문 수
};
```

> `devTrafficCount`는 Task 5의 접힘 알림이, `externalCount`는 Task 3·6의 부제/지표가 쓴다.

- [x] **Step 1: 현재 구현 확인**

```bash
sed -n '1,70p' src/db/queries/statistics.ts
```

`selectTopReferrers`가 원본 referrer 문자열로 `counts`를 쌓고 있고, `extractHostname`이 이 파일 안에 지역 함수로 있는지 확인한다. 있으면 Task 1의 모듈로 교체하고 지역 정의를 지운다.

- [x] **Step 2: 쿼리 교체**

`src/db/queries/statistics.ts`의 `selectTopReferrers`를 아래로 교체한다. import에 Task 1의 유틸을 추가한다.

```ts
import {
  extractHostname,
  isDevTraffic,
  resolveReferrerGroup,
} from '@/app/admin/_utils/referrer-group';
```

```ts
export type ReferrerGroupRow = {
  key: string;
  label: string;
  letter: string;
  hosts: string[];
  count: number;
  percentage: number;
};

export type TopReferrersResult = {
  rows: ReferrerGroupRow[];
  devTrafficCount: number;
  externalCount: number;
  totalCount: number;
};

/**
 * 유입 경로를 호스트네임 그룹으로 묶어 집계한다.
 *
 * - `excludes`(사용자가 등록한 "항상 제외")에 걸린 호스트는 집계에서 완전히 뺀다.
 * - 개발 트래픽(localhost·사설 IP 등)은 rows에 넣지 않고 devTrafficCount로만 센다.
 * - 하위 호스트가 여럿인 서비스(네이버 등)는 한 행으로 합치고 hosts에 나열한다.
 */
export async function selectTopReferrers(
  limit = 20,
  days?: number,
  excludes: string[] = [],
  siteUrl?: string | null
): Promise<TopReferrersResult> {
  const since = days ? subDays(new Date(), days) : undefined;
  const where = and(since ? gte(referrers.visitedAt, since) : undefined);

  const rows = await db
    .select({ referrer: referrers.referrer })
    .from(referrers)
    .where(where);

  const excludeSet = new Set(excludes);
  const siteHostname = siteUrl ? extractHostname(siteUrl) : undefined;

  const groups = new Map<string, ReferrerGroupRow>();
  let devTrafficCount = 0;
  let totalCount = 0;

  for (const row of rows) {
    const hostname = extractHostname(row.referrer ?? '');

    if (hostname && excludeSet.has(hostname)) continue;

    totalCount += 1;

    if (isDevTraffic(hostname)) {
      devTrafficCount += 1;
      continue;
    }

    const group = resolveReferrerGroup(hostname, siteHostname ?? undefined);
    const existing = groups.get(group.key);

    if (existing) {
      existing.count += 1;
      if (hostname && !existing.hosts.includes(hostname)) {
        existing.hosts.push(hostname);
      }
    } else {
      groups.set(group.key, {
        ...group,
        hosts: hostname ? [hostname] : [],
        count: 1,
        percentage: 0,
      });
    }
  }

  const sorted = [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const shown = sorted.reduce((acc, row) => acc + row.count, 0);
  for (const row of sorted) {
    row.percentage = shown > 0 ? Math.round((row.count / shown) * 1000) / 10 : 0;
    row.hosts.sort();
  }

  const externalCount = sorted
    .filter((row) => row.key !== 'direct' && row.label !== '내부 링크')
    .reduce((acc, row) => acc + row.count, 0);

  return { rows: sorted, devTrafficCount, externalCount, totalCount };
}
```

- [x] **Step 3: 타입 확인**

```bash
npx tsc --noEmit
```

기대: `referrers/page.tsx`가 옛 반환 형태(배열)를 기대하므로 **에러가 난다.** Task 5에서 그 화면을 고칠 때까지는 정상이다. 다른 파일에서 에러가 나면 그건 놓친 소비처이니 목록에 적어 둔다.

```bash
grep -rn "selectTopReferrers" src/
```

- [x] **Step 4: 커밋**

```bash
git add src/db/queries/statistics.ts
git commit -m "♻️ refactor: 유입경로를 호스트네임 그룹으로 집계하고 개발 트래픽 분리"
```

---

## Task 3: 대시보드 집계 쿼리

**Files:**
- Modify: `src/db/queries/daily-stats.ts` (`selectDashboardOverview` 추가)
- Modify: `src/db/queries/posts.ts` (`selectDraftQueue` 추가)
- Modify: `src/db/queries/comments.ts` (`selectPendingComments` 추가)

**Interfaces:**
- Consumes: Task 2의 `selectTopReferrers`
- Produces:
  - `selectDashboardOverview(days: number)` →
    ```ts
    {
      rangeStart: string;   // 'yyyy-MM-dd'
      rangeEnd: string;
      visitors: number;
      views: number;
      previousVisitors: number;
      previousViews: number;
      daily: { date: string; views: number; visitors: number;
               previousViews: number; previousVisitors: number }[];
    }
    ```
    `daily`는 선택 기간의 일자별 값에 **같은 인덱스의 직전 기간 값을 나란히 붙인** 배열이다. Task 4의 차트가 이 형태를 그대로 먹는다.
  - `selectDraftQueue(limit: number)` → `{ id: number; title: string; updatedAt: Date }[]` (임시저장 글, 최근 수정 순)
  - `selectPendingComments(limit: number)` → `{ id: number; content: string; postTitle: string; createdAt: Date }[]` (관리자 답글이 없는 최상위 댓글, 최신 순)

- [x] **Step 1: `selectDashboardOverview` 작성**

`src/db/queries/daily-stats.ts` 끝에 추가한다.

```ts
/**
 * 대시보드용 기간 집계 — 선택 기간과 직전 동일 길이 기간을 함께 담는다.
 * daily 배열은 차트가 두 계열을 겹쳐 그릴 수 있도록 인덱스를 맞춰 합쳐 둔다.
 */
export async function selectDashboardOverview(days: number) {
  const today = new Date();
  const rangeStart = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const rangeEnd = format(today, 'yyyy-MM-dd');
  const prevStart = format(subDays(today, days * 2 - 1), 'yyyy-MM-dd');
  const prevEnd = format(subDays(today, days), 'yyyy-MM-dd');

  const selectRange = (start: string, end: string) =>
    db
      .select({
        date: dailyStats.date,
        views: dailyStats.views,
        visitors: dailyStats.visitors,
      })
      .from(dailyStats)
      .where(and(gte(dailyStats.date, start), lte(dailyStats.date, end)))
      .orderBy(dailyStats.date);

  const [currentRows, previousRows] = await Promise.all([
    selectRange(rangeStart, rangeEnd),
    selectRange(prevStart, prevEnd),
  ]);

  // 데이터가 없는 날은 0으로 채워 두 기간의 길이를 맞춘다.
  const fill = (rows: typeof currentRows, start: string) =>
    Array.from({ length: days }, (_, i) => {
      const date = format(subDays(new Date(`${start}T00:00:00`), -i), 'yyyy-MM-dd');
      const found = rows.find((row) => row.date === date);
      return {
        date,
        views: found?.views ?? 0,
        visitors: found?.visitors ?? 0,
      };
    });

  const current = fill(currentRows, rangeStart);
  const previous = fill(previousRows, prevStart);

  return {
    rangeStart,
    rangeEnd,
    visitors: current.reduce((acc, d) => acc + d.visitors, 0),
    views: current.reduce((acc, d) => acc + d.views, 0),
    previousVisitors: previous.reduce((acc, d) => acc + d.visitors, 0),
    previousViews: previous.reduce((acc, d) => acc + d.views, 0),
    daily: current.map((d, i) => ({
      ...d,
      previousViews: previous[i]?.views ?? 0,
      previousVisitors: previous[i]?.visitors ?? 0,
    })),
  };
}
```

- [x] **Step 2: `selectDraftQueue` 작성**

`src/db/queries/posts.ts` 끝에 추가한다.

```ts
/**
 * 이어 쓸 글 — 임시저장 상태의 글을 최근 수정 순으로.
 */
export const selectDraftQueue = unstable_cache(
  async (limit = 5) => {
    return db
      .select({
        id: posts.id,
        title: posts.title,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'draft'))
      .orderBy(desc(posts.updatedAt))
      .limit(limit);
  },
  ['admin-draft-queue'],
  { tags: [CACHE_TAGS.posts] }
);
```

- [x] **Step 3: `selectPendingComments` 작성**

`src/db/queries/comments.ts`의 `getPendingReplyCount`(`:197-220`) 바로 아래에 추가한다.

**판정 조건은 그 함수와 완전히 동일해야 한다** — 어긋나면 사이드바 뱃지 숫자와 대시보드 "새 댓글" 목록이 달라진다. 확인해 보니 조건은 `isNull(parentId)` + `isDeleted=false` + `notExists(isAuthor=true인 대댓글)`이고, self-join 별칭 `replyComments`와 필요한 import(`and`·`count`·`desc`·`eq`·`isNull`·`notExists`·`alias`)가 **이미 파일 상단에 전부 갖춰져 있다**. 새 import는 `sql`도 필요 없다 — 아래 코드는 기존 별칭을 그대로 쓴다.

```ts
/**
 * 답변 대기 댓글 — 사이드바 뱃지(getPendingReplyCount)와 동일한 조건으로 목록을 뽑는다.
 */
export const selectPendingComments = unstable_cache(
  async (limit = 5) => {
    const rows = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        postTitle: posts.title,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
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
      )
      .orderBy(desc(comments.createdAt))
      .limit(limit);

    return rows;
  },
  ['admin-pending-comments'],
  { tags: [CACHE_TAGS.comments] }
);
```

> `where` 절이 `getPendingReplyCount:201-217`과 글자 그대로 같다. 한쪽만 고치면 두 숫자가 어긋나므로, 나중에 판정 기준을 바꿀 일이 생기면 **반드시 두 함수를 함께** 고친다.

- [x] **Step 4: 타입 확인**

```bash
npx tsc --noEmit
```

기대: `referrers/page.tsx`의 기존 에러(Task 2에서 발생) 외에 신규 에러 없음.

- [x] **Step 5: 커밋**

```bash
git add src/db/queries/daily-stats.ts src/db/queries/posts.ts src/db/queries/comments.ts
git commit -m "✨ feat: 대시보드 기간 집계·이어 쓸 글·답변 대기 댓글 쿼리 추가"
```

---

## Task 4: 차트에 직전 기간 계열 추가

**Files:**
- Modify: `src/app/admin/_components/stats-chart.tsx`
- Test: `src/app/admin/_components/stats-chart.test.tsx` (신규)

**Interfaces:**
- Consumes: Task 3의 `daily` 배열 형태
- Produces: `StatsChart` props 확장

```ts
type Props = {
  data: {
    date: string;
    views: number;
    visitors: number;
    previousViews?: number;
    previousVisitors?: number;
  }[];
  /** 직전 기간 계열을 그릴지. 기본 false — 기존 호출부는 그대로 동작한다. */
  showPrevious?: boolean;
};
```

**왜 이 태스크가 중요한가** — 스펙 75행이 *"직전 기간 대비 증감 — `dailyStats`로 계산 가능하므로 **유지한다** (시안의 `+12%` 및 '이번 기간 / 직전 기간' 비교 막대)"* 라고 명시적으로 채택했는데, PR 4는 `+12%` 뱃지만 만들고 차트 계열을 빠뜨렸다. 스펙이 채택한 항목 중 유일하게 누락된 건이다.

> 색 지정은 기존 hex 상수 방식을 그대로 둔다 (PR 4 플랜 44행의 보류 결정). 직전 기간 계열은 같은 색 계열의 흐린 점선으로 그려 "이번 기간"과 구분한다.

- [x] **Step 1: 실패하는 테스트 작성**

recharts는 jsdom에서 `ResponsiveContainer`가 크기 0으로 렌더돼 내부 SVG를 그리지 않는다. 렌더 결과 대신 **전달된 데이터 가공 결과**를 검증한다 — 차트 데이터 준비 로직을 export해 테스트한다.

`src/app/admin/_components/stats-chart.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { buildChartData } from './stats-chart';

const data = [
  { date: '2026-08-15', views: 10, visitors: 5, previousViews: 8, previousVisitors: 4 },
  { date: '2026-08-16', views: 20, visitors: 9, previousViews: 12, previousVisitors: 6 },
];

describe('buildChartData', () => {
  it('날짜를 M/d 라벨로 바꾼다', () => {
    expect(buildChartData(data, false)[0].label).toBe('8/15');
  });

  it('showPrevious가 false면 직전 기간 값을 빼고 넘긴다', () => {
    const result = buildChartData(data, false);
    expect(result[0]).not.toHaveProperty('previousViews');
    expect(result[0].views).toBe(10);
  });

  it('showPrevious가 true면 직전 기간 값을 유지한다', () => {
    const result = buildChartData(data, true);
    expect(result[0].previousViews).toBe(8);
    expect(result[0].previousVisitors).toBe(4);
  });

  it('직전 기간 값이 없으면 0으로 채운다', () => {
    const result = buildChartData(
      [{ date: '2026-08-15', views: 10, visitors: 5 }],
      true
    );
    expect(result[0].previousViews).toBe(0);
    expect(result[0].previousVisitors).toBe(0);
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_components/stats-chart.test.tsx
```

기대: FAIL — `buildChartData`가 export되지 않음.

- [x] **Step 3: 차트 수정**

`src/app/admin/_components/stats-chart.tsx`를 수정한다. 기존 색 상수 두 개는 그대로 두고 직전 기간용 상수만 추가한다.

```tsx
const VIEWS_COLOR = '#ef4444'; // red-500
const VISITORS_COLOR = '#a1a1aa'; // zinc-400
const PREVIOUS_COLOR = '#d4d4d8'; // zinc-300 — 직전 기간은 흐린 점선
```

props 타입과 데이터 가공 함수를 교체한다.

```tsx
type ChartDatum = {
  date: string;
  views: number;
  visitors: number;
  previousViews?: number;
  previousVisitors?: number;
};

type Props = {
  data: ChartDatum[];
  /** 직전 기간 계열을 함께 그린다. 기본 false. */
  showPrevious?: boolean;
};

export function buildChartData(data: ChartDatum[], showPrevious: boolean) {
  return data.map((d) => {
    const base = {
      date: d.date,
      views: d.views,
      visitors: d.visitors,
      label: format(parseISO(d.date), 'M/d'),
    };

    if (!showPrevious) return base;

    return {
      ...base,
      previousViews: d.previousViews ?? 0,
      previousVisitors: d.previousVisitors ?? 0,
    };
  });
}
```

`StatsChart` 본문에서 `chartData`를 이 함수로 만들고, 기존 두 `<Line>` 뒤에 직전 기간 계열을 조건부로 추가한다.

```tsx
export function StatsChart({ data, showPrevious = false }: Props) {
  const chartData = buildChartData(data, showPrevious);
  // ...(ResponsiveContainer·LineChart·축·Tooltip·Legend는 그대로)
```

기존 `<Line dataKey="visitors" .../>` 바로 뒤에 넣는다.

```tsx
          {showPrevious && (
            <>
              <Line
                type="monotone"
                dataKey="previousViews"
                name="직전 기간 조회수"
                stroke={PREVIOUS_COLOR}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="previousVisitors"
                name="직전 기간 방문자"
                stroke={PREVIOUS_COLOR}
                strokeWidth={1}
                strokeDasharray="2 4"
                dot={false}
                activeDot={false}
              />
            </>
          )}
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_components/stats-chart.test.tsx
```

기대: 4개 PASS. 기존 호출부(`admin/page.tsx`, `statistics/page.tsx`)는 `showPrevious`를 안 주므로 동작이 바뀌지 않는다.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/_components/stats-chart.tsx src/app/admin/_components/stats-chart.test.tsx
git commit -m "✨ feat: 통계 차트에 직전 기간 비교 계열 추가"
```

---

## Task 5: 대시보드 2c 재작성

**Files:**
- Create: `src/app/admin/_components/dashboard-stat-panel.tsx` + `.test.tsx`
- Create: `src/app/admin/_components/dashboard-rank-list.tsx` + `.test.tsx`
- Create: `src/app/admin/_components/draft-queue-widget.tsx` + `.test.tsx`
- Create: `src/app/admin/_components/pending-comments-widget.tsx` + `.test.tsx`
- Modify: `src/app/admin/page.tsx`
- Delete: `src/app/admin/_components/quick-actions.tsx`, `recent-posts-widget.tsx`, `recent-comments-widget.tsx`

**Interfaces:**
- Consumes: Task 2·3·4 전부. PR 1의 `AdminPageHeader`, PR 4의 `PeriodFilterAction`·`PeriodChangeBadge`
- Produces: 시안 2c 레이아웃 — 좌측 분석 칼럼(다크 스탯 카드 + 차트, 인기 글, 유입경로) + 우측 액션 칼럼(새 글 쓰기, 이어 쓸 글, 새 댓글)

**시안 반영 항목**

- 타이틀 "대시보드" + 부제 `8월 13일 – 8월 19일` (선택 기간)
- 우측 상단 [7일][30일][전체] 세그먼트
- 검정 카드 안에 방문 / 페이지뷰 / 외부 유입 3지표, 방문에 `+12%` 증감 뱃지, 아래 라인차트
- 좌측 하단 2열: 인기 글 top3 · 유입경로 top3(퍼센트 바)
- 우측 칼럼: 검정 [+ 새 글 쓰기] 버튼, "이어 쓸 글 N", "새 댓글 N"

- [x] **Step 1: 실패하는 테스트 작성 — 스탯 패널**

`src/app/admin/_components/dashboard-stat-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardStatPanel } from './dashboard-stat-panel';

vi.mock('./stats-chart', () => ({
  StatsChart: ({ showPrevious }: { showPrevious?: boolean }) => (
    <div data-testid="chart">{showPrevious ? 'with-previous' : 'plain'}</div>
  ),
}));

const props = {
  visitors: 1842,
  views: 3104,
  externalCount: 179,
  previousVisitors: 1644,
  daily: [{ date: '2026-08-15', views: 10, visitors: 5, previousViews: 8, previousVisitors: 4 }],
};

describe('DashboardStatPanel', () => {
  it('방문·페이지뷰·외부 유입 3지표를 렌더한다', () => {
    render(<DashboardStatPanel {...props} />);

    expect(screen.getByText('방문')).toBeInTheDocument();
    expect(screen.getByText('1,842')).toBeInTheDocument();
    expect(screen.getByText('페이지뷰')).toBeInTheDocument();
    expect(screen.getByText('3,104')).toBeInTheDocument();
    expect(screen.getByText('외부 유입')).toBeInTheDocument();
    expect(screen.getByText('179')).toBeInTheDocument();
  });

  it('방문에 직전 기간 대비 증감을 표시한다', () => {
    render(<DashboardStatPanel {...props} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('직전 기간 계열을 켠 차트를 렌더한다', () => {
    render(<DashboardStatPanel {...props} />);
    expect(screen.getByTestId('chart')).toHaveTextContent('with-previous');
  });

  it('데이터가 없으면 안내 문구를 보여준다', () => {
    render(<DashboardStatPanel {...props} daily={[]} />);
    expect(screen.getByText(/아직 통계 데이터가 없습니다/)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패하는 테스트 작성 — 순위 목록**

`src/app/admin/_components/dashboard-rank-list.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardRankList } from './dashboard-rank-list';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const items = [
  { id: 'a', label: 'DELL S2725QC 모니터 리뷰', value: 1204 },
  { id: 'b', label: 'Next.js 15 App Router 이전기', value: 842 },
];

describe('DashboardRankList', () => {
  it('제목과 항목을 순위와 함께 렌더한다', () => {
    render(<DashboardRankList title="인기 글" items={items} moreHref="/admin/statistics" />);

    expect(screen.getByText('인기 글')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('DELL S2725QC 모니터 리뷰')).toBeInTheDocument();
    expect(screen.getByText('1,204')).toBeInTheDocument();
  });

  it('더보기 링크를 렌더한다', () => {
    render(<DashboardRankList title="인기 글" items={items} moreHref="/admin/statistics" />);
    expect(screen.getByRole('link', { name: /더보기/ })).toHaveAttribute(
      'href',
      '/admin/statistics'
    );
  });

  it('percent 모드에서는 순위 대신 퍼센트 바를 보여준다', () => {
    const { container } = render(
      <DashboardRankList
        title="유입경로"
        variant="percent"
        items={[{ id: 'g', label: '구글 검색', value: 62 }]}
        moreHref="/admin/statistics/referrers"
      />
    );

    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="rank-bar"]')).toBeInTheDocument();
  });

  it('항목이 없으면 빈 상태를 보여준다', () => {
    render(<DashboardRankList title="인기 글" items={[]} moreHref="/admin/statistics" />);
    expect(screen.getByText('아직 데이터가 없습니다.')).toBeInTheDocument();
  });
});
```

- [x] **Step 3: 실패하는 테스트 작성 — 우측 칼럼 위젯 2종**

`src/app/admin/_components/draft-queue-widget.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftQueueWidget } from './draft-queue-widget';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const drafts = [
  { id: 1, title: '키보드 배열 바꾸고 3개월', updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 2, title: '', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
];

describe('DraftQueueWidget', () => {
  it('제목과 개수를 렌더한다', () => {
    render(<DraftQueueWidget drafts={drafts} />);

    expect(screen.getByText('이어 쓸 글')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('각 글을 편집 화면으로 링크한다', () => {
    render(<DraftQueueWidget drafts={drafts} />);
    expect(
      screen.getByRole('link', { name: /키보드 배열 바꾸고 3개월/ })
    ).toHaveAttribute('href', '/admin/posts/1/edit');
  });

  it('상대시각으로 표시한다', () => {
    render(<DraftQueueWidget drafts={drafts} />);
    expect(screen.getByText(/전$/)).toBeInTheDocument();
  });

  it('제목이 비면 (제목 없음)으로 표시한다', () => {
    render(<DraftQueueWidget drafts={drafts} />);
    expect(screen.getByRole('link', { name: /\(제목 없음\)/ })).toBeInTheDocument();
  });

  it('임시저장 글이 없으면 빈 상태를 보여준다', () => {
    render(<DraftQueueWidget drafts={[]} />);
    expect(screen.getByText('이어 쓸 글이 없습니다.')).toBeInTheDocument();
  });
});
```

`src/app/admin/_components/pending-comments-widget.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PendingCommentsWidget } from './pending-comments-widget';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const comments = [
  {
    id: 1,
    content: '스탠드 높이 조절 범위가 어느 정도인가요?',
    postTitle: 'DELL 리뷰',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

describe('PendingCommentsWidget', () => {
  it('제목과 개수를 렌더한다', () => {
    render(<PendingCommentsWidget comments={comments} />);

    expect(screen.getByText('새 댓글')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('본문을 인용부호로 감싸 보여준다', () => {
    render(<PendingCommentsWidget comments={comments} />);
    expect(
      screen.getByText('"스탠드 높이 조절 범위가 어느 정도인가요?"')
    ).toBeInTheDocument();
  });

  it('글 제목과 상대시각을 함께 보여준다', () => {
    render(<PendingCommentsWidget comments={comments} />);
    expect(screen.getByText(/DELL 리뷰 ·/)).toBeInTheDocument();
  });

  it('답변 대기 댓글이 없으면 빈 상태를 보여준다', () => {
    render(<PendingCommentsWidget comments={[]} />);
    expect(screen.getByText('답변 대기 댓글이 없습니다.')).toBeInTheDocument();
  });
});
```

- [x] **Step 4: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_components/
```

기대: 4개 신규 파일 전부 FAIL (import 해결 실패).

- [x] **Step 5: 컴포넌트 4종 작성**

`src/app/admin/_components/dashboard-stat-panel.tsx`:

```tsx
import { PeriodChangeBadge } from '../statistics/_components/period-change-badge';
import { StatsChart } from './stats-chart';

type Props = {
  visitors: number;
  views: number;
  externalCount: number;
  previousVisitors: number;
  daily: {
    date: string;
    views: number;
    visitors: number;
    previousViews: number;
    previousVisitors: number;
  }[];
};

export function DashboardStatPanel({
  visitors,
  views,
  externalCount,
  previousVisitors,
  daily,
}: Props) {
  const metrics = [
    { label: '방문', value: visitors, change: { current: visitors, previous: previousVisitors } },
    { label: '페이지뷰', value: views },
    { label: '외부 유입', value: externalCount },
  ];

  return (
    <div className="bg-sidebar text-sidebar-foreground rounded-2xl p-6">
      <div className="flex flex-wrap gap-8">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-sidebar-foreground/60 text-xs">{metric.label}</p>
            <p className="mt-1 flex items-baseline gap-2 text-3xl font-bold">
              {metric.value.toLocaleString()}
              {metric.change && (
                <PeriodChangeBadge
                  current={metric.change.current}
                  previous={metric.change.previous}
                />
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {daily.length === 0 ? (
          <p className="text-sidebar-foreground/60 py-16 text-center text-sm">
            아직 통계 데이터가 없습니다.
          </p>
        ) : (
          <StatsChart data={daily} showPrevious />
        )}
      </div>
    </div>
  );
}
```

`src/app/admin/_components/dashboard-rank-list.tsx`:

```tsx
import Link from 'next/link';

type Item = {
  id: string;
  label: string;
  value: number;
  href?: string;
};

type Props = {
  title: string;
  items: Item[];
  moreHref: string;
  /** 'rank'는 순위 숫자 + 값, 'percent'는 퍼센트 바 */
  variant?: 'rank' | 'percent';
};

export function DashboardRankList({
  title,
  items,
  moreHref,
  variant = 'rank',
}: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={moreHref}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          더보기
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          아직 데이터가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, index) => (
            <li key={item.id}>
              {variant === 'rank' ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-4 shrink-0 text-xs">
                    {index + 1}
                  </span>
                  {item.href ? (
                    <Link href={item.href} className="min-w-0 flex-1 truncate hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  )}
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="min-w-0 truncate">{item.label}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {item.value}%
                    </span>
                  </div>
                  <div data-slot="rank-bar" className="bg-muted h-1.5 rounded-full">
                    <div
                      className="bg-foreground h-full rounded-full"
                      style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

`src/app/admin/_components/draft-queue-widget.tsx`:

```tsx
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

type Props = {
  drafts: { id: number; title: string; updatedAt: Date }[];
};

export function DraftQueueWidget({ drafts }: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">이어 쓸 글</h2>
        <span className="bg-status-draft text-foreground rounded-full px-2 text-xs">
          {drafts.length}
        </span>
      </div>

      {drafts.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          이어 쓸 글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/admin/posts/${draft.id}/edit`}
                className="block truncate text-sm font-medium hover:underline"
              >
                {draft.title || '(제목 없음)'}
              </Link>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatDistanceToNow(new Date(draft.updatedAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

`src/app/admin/_components/pending-comments-widget.tsx`:

```tsx
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

type Props = {
  comments: {
    id: number;
    content: string;
    postTitle: string;
    createdAt: Date;
  }[];
};

export function PendingCommentsWidget({ comments }: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">새 댓글</h2>
        <span className="bg-muted rounded-full px-2 text-xs">
          {comments.length}
        </span>
      </div>

      {comments.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          답변 대기 댓글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id}>
              <Link
                href="/admin/comments"
                className="line-clamp-2 text-sm hover:underline"
              >
                &quot;{comment.content}&quot;
              </Link>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {comment.postTitle} ·{' '}
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [x] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_components/
```

기대: 4개 파일 전부 PASS.

- [x] **Step 7: 대시보드 페이지 재작성**

`src/app/admin/page.tsx` 전체를 교체한다.

```tsx
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { selectDashboardOverview } from '@/db/queries/daily-stats';
import { selectDraftQueue } from '@/db/queries/posts';
import { selectPendingComments } from '@/db/queries/comments';
import { selectPopularPosts, selectTopReferrers } from '@/db/queries/statistics';
import { getBlogSettings } from '@/db/queries/settings';
import { AdminPageHeader } from './_components/admin-page-header';
import { DashboardStatPanel } from './_components/dashboard-stat-panel';
import { DashboardRankList } from './_components/dashboard-rank-list';
import { DraftQueueWidget } from './_components/draft-queue-widget';
import { PendingCommentsWidget } from './_components/pending-comments-widget';
import { PeriodFilterAction } from './statistics/_actions/period-filter.action';

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const currentPeriod = daysParam ?? '7';
  const parsed = Number(currentPeriod);
  const days =
    currentPeriod === 'all' || !Number.isFinite(parsed) || parsed <= 0
      ? 30
      : parsed;

  const settings = await getBlogSettings();

  const [overview, popularPosts, referrers, drafts, pendingComments] =
    await Promise.all([
      selectDashboardOverview(days),
      selectPopularPosts(3),
      selectTopReferrers(3, days, settings?.referrerExcludes ?? [], settings?.siteUrl),
      selectDraftQueue(3),
      selectPendingComments(3),
    ]);

  const rangeLabel = `${format(new Date(overview.rangeStart), 'M월 d일', { locale: ko })} – ${format(
    new Date(overview.rangeEnd),
    'M월 d일',
    { locale: ko }
  )}`;

  return (
    <div>
      <AdminPageHeader
        title="대시보드"
        description={rangeLabel}
        action={
          <PeriodFilterAction basePath="/admin" current={currentPeriod} />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DashboardStatPanel
            visitors={overview.visitors}
            views={overview.views}
            externalCount={referrers.externalCount}
            previousVisitors={overview.previousVisitors}
            daily={overview.daily}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardRankList
              title="인기 글"
              moreHref="/admin/statistics"
              items={popularPosts.map((post) => ({
                id: String(post.id),
                label: post.title || '(제목 없음)',
                value: post.views,
                href: `/admin/statistics/posts/${post.id}`,
              }))}
            />
            <DashboardRankList
              title="유입경로"
              variant="percent"
              moreHref="/admin/statistics/referrers"
              items={referrers.rows.map((row) => ({
                id: row.key,
                label: row.label,
                value: row.percentage,
              }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button className="w-full rounded-full" size="lg" asChild>
            <Link href="/admin/posts/new">
              <Plus size={16} />새 글 쓰기
            </Link>
          </Button>
          <DraftQueueWidget drafts={drafts} />
          <PendingCommentsWidget comments={pendingComments} />
        </div>
      </div>
    </div>
  );
}
```

> `PeriodFilterAction`의 `basePath`를 `/admin`으로 주면 링크가 `/admin?days=7` 형태가 된다 — 별도 수정 없이 동작한다.

- [x] **Step 8: 구 위젯 삭제**

```bash
git rm src/app/admin/_components/quick-actions.tsx \
  src/app/admin/_components/recent-posts-widget.tsx \
  src/app/admin/_components/recent-comments-widget.tsx
```

남은 참조가 없는지 확인한다.

```bash
grep -rn "QuickActions\|RecentPostsWidget\|RecentCommentsWidget" src/
```

기대: 결과 없음.

- [x] **Step 9: 전체 테스트·타입 확인**

```bash
npm run test:run
```

```bash
npx tsc --noEmit
```

기대: 테스트 PASS. tsc는 `referrers/page.tsx`의 기존 에러(Task 2)만 남는다.

- [x] **Step 10: 커밋**

```bash
git add -A src/app/admin/
git commit -m "✨ feat: 대시보드를 시안 2c 분석 화면으로 재작성"
```

---

## Task 6: 유입경로 화면

**Files:**
- Create: `src/app/admin/statistics/referrers/_components/referrer-row.tsx` + `.test.tsx`
- Create: `src/app/admin/statistics/referrers/_actions/dev-traffic-notice.action.tsx` + `.test.tsx`
- Modify: `src/app/admin/statistics/referrers/page.tsx`

**Interfaces:**
- Consumes: Task 2의 `TopReferrersResult`, PR 1의 `AdminPageHeader`
- Produces:
  - `ReferrerRow({ row, rank }: { row: ReferrerGroupRow; rank: number })`
  - `DevTrafficNoticeAction({ count }: { count: number })` — 접힘 알림 + [펼치기] 토글

**시안 반영 항목**

- 헤더 부제 `30일 · 방문 1,289회 중 외부 유입 179회`
- `localhost·개발 트래픽 112회 는 접어뒀습니다` + [펼치기]
- 표 행: letter 뱃지 + 그룹명 + 하위 호스트 보조 라인

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/statistics/referrers/_components/referrer-row.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReferrerRow } from './referrer-row';

const row = {
  key: 'naver',
  label: '네이버 검색',
  letter: 'N',
  hosts: ['m.search.naver.com', 'search.naver.com'],
  count: 50,
  percentage: 3.9,
};

function renderRow(props = {}) {
  return render(
    <table>
      <tbody>
        <ReferrerRow row={{ ...row, ...props }} rank={2} />
      </tbody>
    </table>
  );
}

describe('ReferrerRow', () => {
  it('순위·letter 뱃지·그룹명·방문 수·비율을 렌더한다', () => {
    renderRow();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('네이버 검색')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('3.9%')).toBeInTheDocument();
  });

  it('하위 호스트를 가운뎃점으로 이어 보조 라인에 보여준다', () => {
    renderRow();
    expect(
      screen.getByText('m.search.naver.com · search.naver.com')
    ).toBeInTheDocument();
  });

  it('하위 호스트가 그룹명과 같으면 보조 라인을 생략한다', () => {
    renderRow({ label: 'example.com', hosts: ['example.com'] });
    expect(screen.queryByText('example.com', { selector: 'span.text-xs' })).not.toBeInTheDocument();
  });

  it('하위 호스트가 없으면 보조 라인이 없다', () => {
    renderRow({ key: 'direct', label: '직접 접근', letter: 'D', hosts: [] });
    expect(screen.getByText('직접 접근')).toBeInTheDocument();
  });
});
```

`src/app/admin/statistics/referrers/_actions/dev-traffic-notice.action.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DevTrafficNoticeAction } from './dev-traffic-notice.action';

describe('DevTrafficNoticeAction', () => {
  it('개발 트래픽이 0이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<DevTrafficNoticeAction count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('접힌 상태의 안내 문구를 보여준다', () => {
    render(<DevTrafficNoticeAction count={112} />);
    expect(
      screen.getByText(/localhost·개발 트래픽 112회는 접어뒀습니다/)
    ).toBeInTheDocument();
  });

  it('펼치기를 누르면 설명이 열리고 버튼 라벨이 바뀐다', () => {
    render(<DevTrafficNoticeAction count={112} />);

    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
    expect(screen.getByText(/localhost·127\.0\.0\.1/)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/statistics/referrers/
```

기대: 두 파일 FAIL.

- [x] **Step 3: 컴포넌트 작성**

`src/app/admin/statistics/referrers/_components/referrer-row.tsx`:

```tsx
import { TableCell, TableRow } from '@/components/ui/table';
import type { ReferrerGroupRow } from '@/db/queries/statistics';

type Props = {
  row: ReferrerGroupRow;
  rank: number;
};

export function ReferrerRow({ row, rank }: Props) {
  const showHosts =
    row.hosts.length > 0 && !(row.hosts.length === 1 && row.hosts[0] === row.label);

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-center">{rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {row.letter}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.label}</p>
            {showHosts && (
              <span className="text-muted-foreground text-xs">
                {row.hosts.join(' · ')}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
      <TableCell className="text-muted-foreground text-right">
        {row.percentage}%
      </TableCell>
    </TableRow>
  );
}
```

`src/app/admin/statistics/referrers/_actions/dev-traffic-notice.action.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  count: number;
};

export function DevTrafficNoticeAction({ count }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (count === 0) return null;

  return (
    <div className="bg-muted mb-4 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          localhost·개발 트래픽 {count.toLocaleString()}회는 접어뒀습니다
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? '접기' : '펼치기'}
        </Button>
      </div>

      {isExpanded && (
        <p className="text-muted-foreground mt-2 text-xs">
          localhost·127.0.0.1·`.local` 호스트와 사설 IP 대역(10.x, 192.168.x,
          172.16~31.x)에서 들어온 방문입니다. 아래 표와 비율 계산에서 빠져
          있습니다.
        </p>
      )}
    </div>
  );
}
```

- [x] **Step 4: 페이지 재작성**

`src/app/admin/statistics/referrers/page.tsx`를 교체한다. `formatReferrer` 지역 함수는 그룹핑이 쿼리로 옮겨갔으므로 삭제한다.

```tsx
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { selectTopReferrers } from '@/db/queries/statistics';
import { getBlogSettings } from '@/db/queries/settings';
import { AdminPageHeader } from '../../_components/admin-page-header';
import { AnalyticsLinkButton } from '../_components/analytics-link-button';
import { PeriodFilterAction } from '../_actions/period-filter.action';
import { ReferrerExcludesFormAction } from './_actions/referrer-excludes-form.action';
import { DevTrafficNoticeAction } from './_actions/dev-traffic-notice.action';
import { ReferrerRow } from './_components/referrer-row';

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminReferrersPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const parsed = Number(daysParam);
  const days =
    daysParam === 'all' || !daysParam || !Number.isFinite(parsed) || parsed <= 0
      ? undefined
      : parsed;
  const currentPeriod = daysParam ?? '30';

  const settings = await getBlogSettings();
  const result = await selectTopReferrers(
    20,
    days,
    settings?.referrerExcludes ?? [],
    settings?.siteUrl
  );

  const periodLabel = days ? `${days}일` : '전체 기간';

  return (
    <div>
      <AdminPageHeader
        title="유입경로"
        description={`${periodLabel} · 방문 ${result.totalCount.toLocaleString()}회 중 외부 유입 ${result.externalCount.toLocaleString()}회`}
        action={
          <div className="flex items-center gap-2">
            <AnalyticsLinkButton />
            <PeriodFilterAction
              basePath="/admin/statistics/referrers"
              current={currentPeriod}
            />
          </div>
        }
      />

      <DevTrafficNoticeAction count={result.devTrafficCount} />

      <Card className="mb-6">
        <CardContent>
          <ReferrerExcludesFormAction
            excludes={settings?.referrerExcludes ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {result.rows.length === 0 ? (
            <p className="text-muted-foreground px-6 py-10 text-center">
              기록된 유입 경로가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>유입 경로</TableHead>
                  <TableHead className="w-24 text-right">방문</TableHead>
                  <TableHead className="w-24 text-right">비율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row, index) => (
                  <ReferrerRow key={row.key} row={row} rank={index + 1} />
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

> "항상 제외" 카드에서 `CardHeader`/`CardTitle`을 없앴다 — 시안에 없는 요소이고, `ReferrerExcludesFormAction` 안에 라벨이 있으면 중복이다. 폼 컴포넌트를 열어 자체 제목이 없으면 카드 제목을 되살린다.

- [x] **Step 5: 테스트·타입 확인**

```bash
npm run test:run -- src/app/admin/statistics/
```

```bash
npx tsc --noEmit
```

기대: 테스트 PASS, tsc 신규 에러 0건 (Task 2에서 생긴 에러가 여기서 해소된다).

- [x] **Step 6: 커밋**

```bash
git add src/app/admin/statistics/referrers/
git commit -m "💄 style: 유입경로에 도메인 그룹 행·개발 트래픽 접힘·부제 추가"
```

---

## Task 7: 헤더 통일과 누락 CTA

**Files:**
- Modify: `src/app/admin/statistics/page.tsx`
- Modify: `src/app/admin/settings/page.tsx`
- Modify: `src/app/admin/comments/page.tsx`
- Modify: `src/app/admin/categories/page.tsx`
- Modify: `src/app/admin/series/page.tsx`
- Modify: `src/app/admin/categories/_actions/category-board.action.tsx`
- Modify: `src/app/admin/series/_actions/series-stack.action.tsx`

**Interfaces:**
- Consumes: PR 1의 `AdminPageHeader`
- Produces:
  - `CategoryBoardAction`·`SeriesStackAction`이 다이얼로그 열림 상태를 헤더 버튼과 공유하도록 **`headerSlot` 없이**, 자체적으로 헤더 버튼까지 렌더한다 (아래 설명 참조)

**왜 헤더 버튼이 빠졌나** — 카테고리·시리즈 화면은 "새 X" 다이얼로그의 열림 상태를 클라이언트 컴포넌트(`*-board`/`*-stack`)가 갖고 있는데, `page.tsx`(서버 컴포넌트)의 `AdminPageHeader`에 버튼을 넣으려면 그 상태에 접근해야 한다. PR 2가 이 문제를 피해 점선 타일만 만들었다.

**해결** — `page.tsx`에서 `AdminPageHeader`를 렌더하지 말고, 클라이언트 보드 컴포넌트가 헤더까지 포함해 렌더한다. `AdminPageHeader`는 순수 컴포넌트라 클라이언트 컴포넌트 안에서도 문제없이 쓰인다.

- [x] **Step 1: 통계 화면 헤더 교체**

`src/app/admin/statistics/page.tsx`의 `<div className="mb-6 flex items-center justify-between">` 블록을 교체한다.

```tsx
      <AdminPageHeader
        title="방문 통계"
        description={
          days
            ? `최근 ${days}일 · 방문 ${summary.totalVisitors.toLocaleString()}회 누적`
            : `전체 기간 · 방문 ${summary.totalVisitors.toLocaleString()}회 누적`
        }
        action={
          <div className="flex items-center gap-2">
            <AnalyticsLinkButton />
            <PeriodFilterAction
              basePath="/admin/statistics"
              current={currentPeriod}
            />
          </div>
        }
      />
```

import를 추가한다.

```tsx
import { AdminPageHeader } from '../_components/admin-page-header';
```

- [x] **Step 2: 댓글 화면 헤더 교체**

`src/app/admin/comments/page.tsx`를 교체한다. 답변 대기 수는 `getPendingReplyCount()`를 함께 호출해 얻는다.

```tsx
import { getAllCommentsForAdmin, getPendingReplyCount } from '@/db/queries/comments';
import { AdminPageHeader } from '../_components/admin-page-header';
import { CommentCardAction } from './_actions/comment-card.action';

export default async function AdminCommentsPage() {
  const [{ comments, total }, pendingCount] = await Promise.all([
    getAllCommentsForAdmin(),
    getPendingReplyCount(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="댓글"
        description={`답변 대기 ${pendingCount}개 · 전체 ${total}개`}
      />
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

- [x] **Step 3: 설정 화면 헤더 교체**

`src/app/admin/settings/page.tsx`를 교체한다. 앵커 목록에 "SEO · 공유"를 추가한다 (섹션 분리는 Task 8).

```tsx
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getBlogSettings } from '@/db/queries/settings';
import { AdminPageHeader } from '../_components/admin-page-header';
import { SettingsFormAction } from './_actions/settings-form.action';
import { SettingsNav } from './_components/settings-nav';

const SECTIONS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'seo', label: 'SEO · 공유' },
  { id: 'social', label: '소셜 링크' },
];

export default async function AdminSettingsPage() {
  const settings = await getBlogSettings();

  const siteLabel = settings?.siteUrl
    ? settings.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;
  const savedLabel = settings?.updatedAt
    ? format(new Date(settings.updatedAt), 'M월 d일', { locale: ko })
    : null;

  const description = [siteLabel, savedLabel && `마지막 저장 ${savedLabel}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <AdminPageHeader
        title="블로그 설정"
        description={description || undefined}
      />
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

- [x] **Step 4: 카테고리 헤더 버튼**

`src/app/admin/categories/_actions/category-board.action.tsx`가 헤더까지 렌더하도록 바꾼다. props에 `title`·`description`을 받는다.

```tsx
type Props = {
  categories: CategoryWithCount[];
  description?: string;
};

export function CategoryBoardAction({ categories, description }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <AdminPageHeader
        title="카테고리"
        description={description}
        action={
          <Button className="rounded-full" onClick={() => setFormOpen(true)}>
            <Plus size={16} />새 카테고리
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
```

import를 추가한다.

```tsx
import { AdminPageHeader } from '../../_components/admin-page-header';
```

`src/app/admin/categories/page.tsx`에서 `AdminPageHeader` 렌더를 없애고 설명 문구만 넘긴다.

```tsx
  return (
    <CategoryBoardAction
      categories={categories}
      description={
        uncategorized.length > 0
          ? `글 ${categorizedCount}개가 카테고리에 묶여 있고, ${uncategorized.length}개는 아직 미분류입니다`
          : `글 ${categorizedCount}개가 카테고리에 묶여 있습니다`
      }
    />
  );
```

> `UncategorizedBanner`는 `CategoryBoardAction` 바깥에 남아 있으므로, `page.tsx`가 `<>...</>`로 보드와 배너를 감싸도록 유지한다.

- [x] **Step 5: 시리즈 헤더 버튼**

`src/app/admin/series/_actions/series-stack.action.tsx`에 같은 방식을 적용한다.

```tsx
type Props = {
  seriesList: AdminSeriesItem[];
  description?: string;
};
```

```tsx
      <AdminPageHeader
        title="시리즈"
        description={description}
        action={
          <Button className="rounded-full" onClick={() => setFormOpen(true)}>
            <Plus size={16} />새 시리즈
          </Button>
        }
      />
```

`src/app/admin/series/page.tsx`에서 `AdminPageHeader`를 없애고 `description`을 넘긴다.

- [x] **Step 6: 기존 테스트 갱신**

카테고리·시리즈의 기존 테스트가 `AdminPageHeader` 위치 변경으로 깨질 수 있다.

```bash
npm run test:run -- src/app/admin/categories/ src/app/admin/series/ src/app/admin/comments/ src/app/admin/statistics/
```

실패하는 단언은 새 구조에 맞게 고친다. **단언의 의도는 유지하고 셀렉터만 바꾼다** — 통과시키려고 검증을 약화시키지 않는다.

- [x] **Step 7: 커밋**

```bash
git add src/app/admin/
git commit -m "💄 style: 어드민 화면 헤더를 AdminPageHeader로 통일하고 누락된 CTA 추가"
```

---

## Task 8: 설정 화면 마무리

**Files:**
- Modify: `src/app/admin/settings/_actions/settings-form.action.tsx`

**Interfaces:**
- Consumes: Task 7이 추가한 `seo` 앵커
- Produces: 없음 (화면 전용)

**시안 반영 항목**

- 필드 라벨: "태그라인" → **한 줄 소개**, "소개" → **홈 문구**
- SEO 필드를 `#seo` 섹션으로 분리
- 저장 바: 전폭 sticky → **떠 있는 알약**, `변경사항 N개` + `되돌리기` + `저장`

- [x] **Step 1: 필드 라벨 교체**

`settings-form.action.tsx`에서 `tagline`·`authorBio` 라벨을 바꾼다.

```tsx
          <Label htmlFor="tagline">한 줄 소개</Label>
```

```tsx
          <Label htmlFor="authorBio">홈 문구</Label>
```

- [x] **Step 2: SEO 섹션 분리**

`기본 정보` 섹션에서 `defaultMetaDescription` 필드 블록을 잘라내고, `기본 정보` `</section>` 바로 뒤에 새 섹션으로 옮긴다. `사이트 URL`도 SEO 쪽이 더 자연스러우므로 함께 옮긴다.

```tsx
      <section id="seo" className="space-y-4">
        <h2 className="text-lg font-semibold">SEO · 공유</h2>

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
```

- [x] **Step 3: 저장 바를 알약으로**

`{isDirty && (...)}` 블록 전체를 교체한다. 변경 필드 개수는 `formState.dirtyFields`로 센다 — 컴포넌트 상단 `useForm` 구조분해에 `dirtyFields`를 추가한다.

```tsx
    formState: { errors, isSubmitting, isDirty, dirtyFields },
```

```tsx
      {isDirty && (
        <div className="pointer-events-none sticky bottom-6 z-10 flex justify-center">
          <div className="bg-foreground text-background pointer-events-auto flex items-center gap-3 rounded-full py-2 pr-2 pl-5 shadow-lg">
            <span className="text-sm">
              변경사항 {Object.keys(dirtyFields).length}개
            </span>
            <button
              type="button"
              onClick={() => reset(defaultFormValues)}
              disabled={isSubmitting}
              className="text-background/70 hover:text-background text-sm transition-colors disabled:opacity-50"
            >
              되돌리기
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-background text-foreground hover:bg-background/90 rounded-full"
              size="sm"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}
```

- [x] **Step 4: 기존 테스트 갱신**

```bash
npm run test:run -- src/app/admin/settings/
```

`settings-form.action.test.tsx`가 "취소"·"변경사항 저장" 라벨을 단언하고 있으면 "되돌리기"·"저장"으로 고친다.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/settings/
git commit -m "💄 style: 설정 화면 SEO 섹션 분리·라벨 시안화·저장 알약 적용"
```

---

## Task 9: 댓글 카드 디테일과 태그 정렬

**Files:**
- Create: `src/app/admin/comments/_components/comment-avatar.tsx` + `.test.tsx`
- Modify: `src/app/admin/comments/_actions/comment-card.action.tsx`
- Modify: `src/db/queries/tags.ts`
- Modify: `src/app/admin/_actions/admin-sidebar.action.tsx` (주석 정리)

**Interfaces:**
- Consumes: 없음
- Produces: `CommentAvatar({ name }: { name: string })` — 이름의 첫 글자를 원형 뱃지로

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/comments/_components/comment-avatar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CommentAvatar } from './comment-avatar';

describe('CommentAvatar', () => {
  it('이름의 첫 글자를 보여준다', () => {
    render(<CommentAvatar name="서준" />);
    expect(screen.getByText('서')).toBeInTheDocument();
  });

  it('영문 이름은 대문자로 보여준다', () => {
    render(<CommentAvatar name="alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('이름이 비면 물음표를 보여준다', () => {
    render(<CommentAvatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('장식 요소이므로 스크린리더에서 숨긴다', () => {
    const { container } = render(<CommentAvatar name="민" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/comments/_components/comment-avatar.test.tsx
```

기대: FAIL.

- [x] **Step 3: 아바타 컴포넌트 작성**

`src/app/admin/comments/_components/comment-avatar.tsx`:

```tsx
type Props = {
  name: string;
};

export function CommentAvatar({ name }: Props) {
  const initial = name.trim() ? name.trim()[0].toUpperCase() : '?';

  return (
    <span
      aria-hidden="true"
      className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
    >
      {initial}
    </span>
  );
}
```

- [x] **Step 4: 댓글 카드 재배치**

`src/app/admin/comments/_actions/comment-card.action.tsx`를 시안 구조로 바꾼다 — 아바타 + (작성자명 / 글 제목 · 상대시각) 메타 줄, 우측에 상태 뱃지.

`format` import를 `formatDistanceToNow`로 교체하고 `CommentAvatar`를 import한다.

```tsx
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CommentAvatar } from '../_components/comment-avatar';
```

카드 상단의 글 제목 블록(`:23-38`)과 작성자 줄(`:46-58`)을 아래 하나로 합친다.

```tsx
      <div className="flex items-start gap-3">
        <CommentAvatar name={thread.isDeleted ? '' : thread.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {thread.isDeleted ? '(삭제됨)' : thread.authorName}
            </span>
            {thread.isAuthor && (
              <Badge variant="secondary" className="text-xs">
                작성자
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            <a
              href={`/posts/${thread.postSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {thread.postTitle}
            </a>
            {' · '}
            {formatDistanceToNow(new Date(thread.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </p>
        </div>
        {!thread.isDeleted &&
          (hasAdminReply ? (
            <Badge variant="secondary">답변 완료</Badge>
          ) : (
            <Badge variant="outline">답변 대기</Badge>
          ))}
      </div>
```

이어지는 본문·액션·답글 폼은 그대로 두되, 아바타 폭만큼 들여쓰기를 맞춘다 (`ml-11`).

> `comment-reply-row.tsx`의 절대시각은 「결정 사항」대로 **그대로 둔다.**

- [x] **Step 5: 태그 정렬 변경**

`src/db/queries/tags.ts`의 `getAllTags`에서 `orderBy`를 바꾼다.

```ts
      .orderBy(desc(count(postTags.postId)), tags.name);
```

시안 1d의 "사용량 순 칩"을 재현한다. 사용 수가 같으면 이름 순으로 안정 정렬된다.

`getAllTags`의 다른 소비처를 확인한다.

```bash
grep -rn "getAllTags" src/
```

글쓰기 화면의 태그 셀렉터도 이 정렬을 쓰게 되는데, 자주 쓰는 태그가 위로 오는 편이 오히려 낫다. 문제가 있으면 보고한다.

- [x] **Step 6: 사이드바 주석 정리**

`src/app/admin/_actions/admin-sidebar.action.tsx:28`의 주석을 현재 사실에 맞게 고친다.

```tsx
  /** 답변 대기 댓글 수. admin/layout.tsx가 주입한다. */
```

- [x] **Step 7: 테스트 확인**

```bash
npm run test:run -- src/app/admin/comments/ src/app/admin/tags/
```

기대: 신규 4개 PASS. 기존 댓글 테스트가 절대시각·글 제목 위치를 단언하고 있으면 새 구조에 맞게 고친다.

- [x] **Step 8: 커밋**

```bash
git add src/app/admin/comments/ src/db/queries/tags.ts src/app/admin/_actions/admin-sidebar.action.tsx
git commit -m "💄 style: 댓글 카드에 아바타·상대시각 적용하고 태그를 사용량 순으로 정렬"
```

---

## Task 10: 검증

**Files:** 없음 (검증 전용)

- [x] **Step 1: 단위 테스트 전체 실행**

```bash
npm run test:run
```

기대: 전부 PASS.

- [x] **Step 2: 린트**

```bash
npm run lint
```

기대: 이 PR이 건드린 파일에서 신규 에러 0건. `docs/design/ralli/support.js`의 기존 에러 2건은 그대로.

- [x] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 신규 에러 0건. `e2e/ralli.spec.ts:57`의 기존 에러 1건만 잔존.

- [x] **Step 4: 빌드**

```bash
npm run build
```

기대: 타입스크립트 컴파일 통과. `DATABASE_URL`이 없어 sitemap 단계에서 실패하면 환경 문제이므로 컴파일 성공만 확인하고 넘어간다.

- [ ] **Step 5: 브라우저 육안 확인 (사용자 확인 필요)**

`/admin/*`은 Clerk 인증을 요구하므로 에이전트가 확인할 수 없다. **사용자가 직접 확인한다.**

- [ ] 대시보드: 기간 세그먼트를 바꾸면 부제 날짜 범위·지표·차트가 함께 바뀐다
- [ ] 대시보드: 검정 카드 안 3지표가 보이고 방문에 증감이 붙는다
- [ ] 대시보드: 차트에 직전 기간 점선 계열이 함께 그려진다
- [ ] 대시보드: 인기 글·유입경로 블록의 [더보기]가 각 상세 화면으로 간다
- [ ] 대시보드: 우측 칼럼의 "이어 쓸 글"이 임시저장 글만 보여준다
- [ ] 대시보드: "새 댓글" 개수가 사이드바 뱃지 숫자와 일치한다
- [ ] 유입경로: 같은 서비스의 하위 호스트가 한 행으로 묶이고 보조 라인에 나열된다
- [ ] 유입경로: 로컬에서 접속한 기록이 있으면 개발 트래픽 알림이 뜨고 [펼치기]가 동작한다
- [ ] 유입경로: 부제의 "방문 N회 중 외부 유입 M회" 숫자가 표와 어긋나지 않는다
- [ ] 설정: 좌측 앵커의 "SEO · 공유"를 누르면 해당 섹션으로 스크롤된다
- [ ] 설정: 필드를 고치면 하단에 알약이 떠오르고 "변경사항 N개"가 실제 수정 필드 수와 맞는다
- [ ] 설정: [되돌리기]가 원래 값으로 되돌린다
- [ ] 카테고리·시리즈: 헤더의 [새 카테고리]/[새 시리즈] 버튼이 다이얼로그를 연다
- [ ] 댓글: 아바타가 뜨고 시각이 "1일 전" 형태로 보인다
- [ ] 태그: 칩이 사용량 많은 순으로 정렬된다
- [ ] 다크 모드에서 대시보드 검정 카드·차트·퍼센트 바 대비가 읽을 만하다
- [ ] 블로그 화면(`/`)이 이 PR 전후로 달라지지 않았다

- [x] **Step 6: plan 문서 완료 기록**

이 문서 상단에 완료 일자와 결과 요약을 추가하고 체크박스를 반영한다.

- [ ] **Step 7: PR 생성 (사용자 확인 필요)**

`develop`으로의 PR 생성은 사용자 확인 없이 진행하지 않는다. 머지는 squash 금지, `--no-ff` 방식이다.

---

## Self-Review 기록

**갭 커버리지** — 2026-08-21 시안 대조에서 나온 항목별 대응:

| 갭 | 대응 |
|---|---|
| 대시보드 2c 미반영 | Task 3·5 |
| "직전 기간" 비교 차트 누락 (스펙 채택 항목) | Task 4 |
| 유입경로 도메인 그룹핑 안 됨 | Task 1·2 |
| 개발 트래픽 자동 접힘 미구현 | Task 1·2·6 |
| letter 뱃지·하위 호스트 보조 라인·"내부 링크" | Task 1·6 |
| 유입경로·설정 헤더 부제 누락 | Task 6·7 |
| [새 카테고리]·[새 시리즈] 버튼 누락 | Task 7 |
| 댓글 "답변 대기 N" 헤더 카운트 | Task 7 |
| 댓글 아바타 누락 | Task 9 |
| 태그 칩 사용량 순 정렬 | Task 9 |
| 저장 바 "변경사항 N개"·알약·문구 | Task 8 |
| SEO·공유 섹션 분리 | Task 7·8 |
| 시각 표기 상대시각화 | Task 5·9 (대댓글은 결정 사항대로 제외) |
| 헤더 스타일 불일치 (parked minor) | Task 7 |

대조에서 "의도적 제외"로 분류된 항목(지표 3종·설정 외형 토글·태그 rename/병합·시리즈 드래그)은 「이 PR의 범위 밖」에 그대로 유지했다.

**태스크 간 파일 충돌** — `src/app/admin/page.tsx`는 Task 5만, `statistics/referrers/page.tsx`는 Task 6만 건드린다. `src/db/queries/statistics.ts`는 Task 2만. `comments/page.tsx`는 Task 7, `comment-card.action.tsx`는 Task 9 — 다른 파일이라 안전하다. 다만 **Task 2가 `tsc` 에러를 남긴 채 끝나고 Task 6에서 해소된다** — 각 태스크 검증 스텝에 이 사실을 적어 두었으니 리뷰어가 실패로 오판하지 않게 한다.

**플레이스홀더 스캔** — 모든 코드 스텝에 실제 코드가 있고 커맨드·기대 결과를 명시했다.

**검증 완료** — Task 3의 `selectPendingComments`가 재사용할 `getPendingReplyCount`(`src/db/queries/comments.ts:197-220`)의 실제 구현을 읽고, 판정 조건(`isNull(parentId)` + `isDeleted=false` + `notExists(isAuthor 대댓글)`)과 self-join 별칭 `replyComments`, 필요한 import가 모두 이미 갖춰져 있음을 확인해 Step 3의 코드를 확정했다. Task 5 Step 10의 육안 확인 항목("새 댓글 개수가 사이드바 뱃지와 일치")이 이중 안전망이다.

**미확인 사항** — Task 3의 `selectDashboardOverview`가 쓰는 날짜 채우기 로직(`fill`)은 `new Date(\`${start}T00:00:00\`)`로 로컬 자정을 만든 뒤 `subDays(date, -i)`로 하루씩 더한다. 서버 타임존이 UTC이고 `dailyStats.date`가 KST 기준으로 쌓였다면 경계 하루가 어긋날 수 있다. 기존 `selectDailyStatsForRange`도 같은 `format(subDays(new Date(), ...))` 방식을 쓰므로 **새로 생기는 위험은 아니지만**, Task 5 Step 10의 "기간 세그먼트를 바꾸면 부제 날짜 범위·지표·차트가 함께 바뀐다" 확인에서 날짜가 하루 밀리지 않는지 함께 본다.
