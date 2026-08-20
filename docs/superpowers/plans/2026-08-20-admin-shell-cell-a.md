# 어드민 셸 셀 A 구현 계획 (어드민 리디자인 PR 1/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 전 화면이 올라탈 셀 A 셸 — 차콜 사이드바 + 흰 본문 — 을 디자인 토큰·다크모드 대응과 함께 완성하고, 이후 PR이 쓸 `Switch` 프리미티브를 확보한다.

**Architecture:** 색은 전부 `globals.css`의 CSS 변수로만 정의하고 컴포넌트에는 hex를 쓰지 않는다. 사이드바 차콜화는 `--sidebar` 계열 토큰 교체만으로 끝나며(`Sidebar`는 어드민 전용이라 블로그 영향 없음), 다크모드는 `.dark` 블록의 같은 토큰을 재정의해 대응한다. 사이드바·헤더가 공유하는 라우트 메타데이터는 `_utils/admin-nav.ts` 순수 모듈 하나로 모아 브레드크럼과 메뉴가 같은 소스를 보게 한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui + radix-ui, Vitest + Testing Library

**Spec:** [2026-08-20-admin-cell-a-redesign-design.md](../specs/2026-08-20-admin-cell-a-redesign-design.md)

## Global Constraints

- Tailwind v4 문법만 쓴다 — CSS 변수는 `max-w-(--content-width)`, 그라디언트는 `bg-linear-to-*`, spacing 스케일의 4배수 px 임의값은 숫자 유틸리티(`max-w-[1180px]` → `max-w-295`). v3 문법은 경고 없이 컴파일되므로 린트가 잡아주지 않는다.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다.
- React hook·타입은 named import (`import { useState } from 'react'`). `React.useState`와 네임스페이스 import 금지.
- 색상 hex를 컴포넌트에 직접 쓰지 않는다. 반드시 `globals.css` 토큰을 경유한다.
- `console.log`를 커밋하지 않는다.
- 폴더·파일 네이밍은 `.claude/rules/page-folder.md`를 따른다 — `_actions/*.action.tsx`, `_components/kebab-case.tsx`, `_utils/kebab-case.ts`.
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 만든다.

## 이 PR의 범위 밖

아래는 후속 PR에서 다룬다. 이 PR에서 미리 손대지 않는다.

- 개별 화면(글 관리·카테고리·태그·시리즈·댓글·통계·설정)의 내용 교체 — PR 2~4
- `@tanstack/react-table` 제거 — PR 2 (마지막 표 사용처가 사라진 뒤)
- 사이드바 "댓글 관리" 뱃지에 실제 답변 대기 수 연결 — PR 3 (`comments.isAuthor` 필요). **이 PR은 뱃지 슬롯과 렌더 분기까지만 만든다.**
- Clerk `UserButton` 다크 팝오버 대응 (`@clerk/themes`) — 범위 밖, 현재도 동일한 상태라 회귀 아님

---

## 로드맵 — 어드민 리디자인 4개 PR

| 순서 | 브랜치 | plan 문서 | 요지 |
|---|---|---|---|
| 1 | `refactor/admin-shell-cell-a` | 이 문서 | 디자인 토큰 + 다크모드 + 셀 A 셸 + `Switch` |
| 2 | `refactor/admin-content-screens` | 미작성 | 글 관리·카테고리·태그·시리즈 + `series.status` + `@tanstack/react-table` 제거 |
| 3 | `feature/admin-comment-reply` | 미작성 | 댓글 관리 + `comments.isAuthor` + 관리자 답글 |
| 4 | `refactor/admin-stats-settings` | 미작성 | 대시보드·방문 통계·유입경로·블로그 설정 |

---

## File Structure

**생성**

| 파일 | 책임 |
|---|---|
| `src/app/globals.test.ts` | 토큰이 `:root`·`.dark` 양쪽에 정의됐는지 지키는 회귀 가드 |
| `src/components/ui/switch.tsx` | shadcn Switch 프리미티브 (PR 2의 발행 토글이 소비) |
| `src/components/ui/switch.test.tsx` | Switch 토글 동작 |
| `src/app/admin/_utils/admin-nav.ts` | 어드민 라우트 메타데이터 + `getBreadcrumb` 순수 함수 |
| `src/app/admin/_utils/admin-nav.test.ts` | 브레드크럼 경로 매칭 |
| `src/app/admin/_actions/admin-sidebar.action.test.tsx` | 사이드바 렌더·활성 표시·뱃지 분기 |
| `src/app/admin/_actions/admin-header.action.test.tsx` | 헤더 브레드크럼·에디터 분기 |
| `src/app/admin/_components/admin-page-header.tsx` | 모든 어드민 화면이 공유하는 페이지 타이틀 + 설명 + 우측 액션 슬롯 |
| `src/app/admin/_components/admin-page-header.test.tsx` | 타이틀·설명·액션 슬롯 렌더 |

**수정**

| 파일 | 변경 |
|---|---|
| `src/app/globals.css` | `--sidebar` 계열 차콜화, `--status-*` 3종 추가, `.dark` 재정의, `@theme inline` 매핑 |
| `src/app/admin/_actions/admin-sidebar.action.tsx` | 셀 A 외형(흰 pill 활성·뱃지 슬롯·footer 재배치), `admin-nav.ts` 소비 |
| `src/app/admin/_actions/admin-header.action.tsx` | 브레드크럼 + 검정 pill 글쓰기 버튼 |
| `src/app/admin/layout.tsx` | 본문 컨테이너 폭·패딩 |

---

## Task 1: 디자인 토큰

**Files:**
- Modify: `src/app/globals.css`
- Test: `src/app/globals.test.ts` (신규)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: CSS 변수 `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--status-published`, `--status-draft`, `--status-danger`. Tailwind 유틸 `bg-status-published` / `bg-status-draft` / `text-status-danger` 등이 `@theme inline` 매핑으로 생성된다. PR 2·3의 상태 뱃지와 발행 스위치가 이 유틸을 쓴다.

> `--status-*` 3종은 이 PR에서 정의만 하고 소비하지 않는다. 팔레트를 한 커밋에 모아두기 위한 의도된 선행이며, 실제 사용은 PR 2부터다.

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/globals.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'globals.css'), 'utf-8');

/** 최상위 블록 하나를 잘라낸다. 닫는 중괄호가 항상 0열에 있는 포맷을 전제한다. */
function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`${selector} 블록을 찾을 수 없습니다`);
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}

/** `--name: oklch(L ...)` 에서 L 값을 뽑는다. */
function lightness(source: string, token: string): number {
  const matched = source.match(
    new RegExp(`${token}:\\s*oklch\\(([\\d.]+)`)
  );
  if (!matched) throw new Error(`${token} 의 oklch 값을 찾을 수 없습니다`);
  return Number(matched[1]);
}

const statusTokens = ['--status-published', '--status-draft', '--status-danger'];

describe('globals.css 어드민 토큰', () => {
  it('상태 색 토큰이 :root와 .dark 양쪽에 정의된다', () => {
    const root = block(':root');
    const dark = block('.dark');

    for (const token of statusTokens) {
      expect(root).toContain(`${token}:`);
      expect(dark).toContain(`${token}:`);
    }
  });

  it('상태 색 토큰이 Tailwind 유틸로 노출된다', () => {
    const theme = block('@theme inline');

    for (const token of statusTokens) {
      expect(theme).toContain(`--color${token}: var(${token});`);
    }
  });

  it('라이트 모드 사이드바가 차콜이다', () => {
    expect(lightness(block(':root'), '--sidebar')).toBeLessThan(0.3);
  });

  it('라이트 모드 활성 항목이 흰 pill이다', () => {
    const root = block(':root');
    expect(lightness(root, '--sidebar-accent')).toBeGreaterThan(0.95);
    expect(lightness(root, '--sidebar-accent-foreground')).toBeLessThan(0.3);
  });

  it('다크 모드에서도 사이드바가 본문 배경보다 어둡다', () => {
    const dark = block('.dark');
    expect(lightness(dark, '--sidebar')).toBeLessThan(
      lightness(dark, '--background')
    );
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/globals.test.ts
```

기대: 5개 중 최소 4개 FAIL. `--status-*` 토큰이 없어 `expect(root).toContain` 실패, 라이트 `--sidebar`가 `oklch(0.985 0 0)`이라 차콜 단언 실패, 다크 `--sidebar`(0.205)가 `--background`(0.145)보다 밝아 실패.

- [x] **Step 3: `@theme inline`에 상태 색 매핑 추가**

`src/app/globals.css`의 `@theme inline` 블록에서 `--color-sidebar-ring` 줄 바로 앞에 추가한다.

```css
  --color-status-published: var(--status-published);
  --color-status-draft: var(--status-draft);
  --color-status-danger: var(--status-danger);
```

- [x] **Step 4: `:root` 사이드바 차콜화 + 상태 색 추가**

`:root` 블록의 `--sidebar` 8줄을 아래로 교체한다.

```css
  --sidebar: oklch(0.22 0.004 100);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(1 0 0);
  --sidebar-primary-foreground: oklch(0.22 0.004 100);
  --sidebar-accent: oklch(1 0 0);
  --sidebar-accent-foreground: oklch(0.22 0.004 100);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.708 0 0);
```

이어서 같은 `:root` 블록 끝에 상태 색을 추가한다.

```css
  --status-published: oklch(0.72 0.19 145);
  --status-draft: oklch(0.8 0.15 75);
  --status-danger: oklch(0.62 0.23 27);
```

- [x] **Step 5: `.dark` 재정의**

`.dark` 블록의 `--sidebar` 8줄을 아래로 교체한다. 사이드바가 본문 배경(`--background: oklch(0.145 0 0)`)보다 어두워야 라이트 모드와 같은 위계(사이드바 < 페이지 < 카드)가 유지된다.

```css
  --sidebar: oklch(0.12 0.004 100);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.985 0 0);
  --sidebar-primary-foreground: oklch(0.12 0.004 100);
  --sidebar-accent: oklch(0.3 0.004 100);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
```

이어서 같은 `.dark` 블록 끝에 상태 색을 추가한다.

```css
  --status-published: oklch(0.76 0.17 145);
  --status-draft: oklch(0.78 0.14 75);
  --status-danger: oklch(0.7 0.19 22);
```

- [x] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- src/app/globals.test.ts
```

기대: 5개 PASS.

- [x] **Step 7: 커밋**

```bash
git add src/app/globals.css src/app/globals.test.ts
git commit -m "🎨 style: 어드민 셀 A 디자인 토큰 정의 (차콜 사이드바·상태 색·다크 대응)"
```

---

## Task 2: Switch 프리미티브

**Files:**
- Create: `src/components/ui/switch.tsx`
- Test: `src/components/ui/switch.test.tsx`

**Interfaces:**
- Consumes: Task 1의 토큰 (직접 참조는 없음. 색은 shadcn 기본 `bg-primary`를 쓰고, 발행 초록은 PR 2가 사용처에서 `data-[state=checked]:bg-status-published`로 덮는다)
- Produces: `Switch` — radix `SwitchPrimitive.Root` 래퍼. props는 radix 원형 그대로(`checked`, `defaultChecked`, `onCheckedChange`, `disabled`, `aria-label`). `role="switch"`와 `data-state="checked" | "unchecked"`를 노출한다.

- [x] **Step 1: 실패하는 테스트 작성**

`src/components/ui/switch.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('기본값은 unchecked이고 클릭하면 checked로 바뀐다', () => {
    render(<Switch aria-label="발행 상태" />);

    const target = screen.getByRole('switch', { name: '발행 상태' });
    expect(target).toHaveAttribute('data-state', 'unchecked');

    fireEvent.click(target);
    expect(target).toHaveAttribute('data-state', 'checked');
  });

  it('defaultChecked를 주면 checked 상태로 렌더된다', () => {
    render(<Switch defaultChecked aria-label="발행 상태" />);
    expect(screen.getByRole('switch', { name: '발행 상태' })).toHaveAttribute(
      'data-state',
      'checked'
    );
  });

  it('onCheckedChange가 새 값과 함께 호출된다', () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="발행 상태" onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole('switch', { name: '발행 상태' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('disabled면 클릭해도 상태가 바뀌지 않는다', () => {
    render(<Switch disabled aria-label="발행 상태" />);

    const target = screen.getByRole('switch', { name: '발행 상태' });
    fireEvent.click(target);
    expect(target).toHaveAttribute('data-state', 'unchecked');
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/components/ui/switch.test.tsx
```

기대: FAIL — `Failed to resolve import "./switch"`.

- [x] **Step 3: Switch 컴포넌트 작성**

`npx shadcn@latest add switch`로 받아도 되지만, 이 프로젝트는 개별 `@radix-ui/*` 패키지가 아니라 통합 `radix-ui` 패키지를 쓴다(`ui/toggle.tsx` 참고). CLI 결과가 `@radix-ui/react-switch`를 import하면 아래 형태로 맞춰 고친다.

`src/components/ui/switch.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-background ring-0 transition-transform',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/components/ui/switch.test.tsx
```

기대: 4개 PASS.

- [x] **Step 5: 커밋**

```bash
git add src/components/ui/switch.tsx src/components/ui/switch.test.tsx
git commit -m "➕ feat: Switch 프리미티브 추가"
```

---

## Task 3: 어드민 라우트 메타데이터

**Files:**
- Create: `src/app/admin/_utils/admin-nav.ts`
- Test: `src/app/admin/_utils/admin-nav.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type AdminNavItem = { label: string; icon: LucideIcon; href: string }`
  - `type AdminNavGroup = { label?: string; items: AdminNavItem[] }`
  - `const adminNavGroups: AdminNavGroup[]` — 사이드바 본문 메뉴
  - `const adminFooterItems: AdminNavItem[]` — 사이드바 하단 메뉴
  - `function getBreadcrumb(pathname: string): string[]` — 헤더 브레드크럼 조각. 매칭 실패 시 빈 배열

`getBreadcrumb`은 **가장 긴 href 접두사**로 매칭한다. `/admin/statistics/referrers`가 `/admin/statistics`가 아니라 `/admin/statistics/referrers`에 붙어야 하기 때문이다. `/admin`은 다른 모든 경로의 접두사이므로 정확히 일치할 때만 매칭한다.

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/_utils/admin-nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { adminFooterItems, adminNavGroups, getBreadcrumb } from './admin-nav';

describe('adminNavGroups', () => {
  it('대시보드·콘텐츠·통계 3개 그룹을 가진다', () => {
    expect(adminNavGroups).toHaveLength(3);
    expect(adminNavGroups[1].label).toBe('콘텐츠');
    expect(adminNavGroups[2].label).toBe('통계');
  });

  it('첫 그룹은 라벨 없이 대시보드만 담는다', () => {
    expect(adminNavGroups[0].label).toBeUndefined();
    expect(adminNavGroups[0].items).toHaveLength(1);
    expect(adminNavGroups[0].items[0].href).toBe('/admin');
  });

  it('블로그 설정과 블로그 보기는 하단 메뉴에 있다', () => {
    expect(adminFooterItems.map((item) => item.href)).toEqual([
      '/admin/settings',
      '/',
    ]);
  });

  it('본문 메뉴에는 블로그 설정이 없다', () => {
    const hrefs = adminNavGroups.flatMap((group) =>
      group.items.map((item) => item.href)
    );
    expect(hrefs).not.toContain('/admin/settings');
  });
});

describe('getBreadcrumb', () => {
  it('대시보드는 그룹 라벨 없이 항목명만 반환한다', () => {
    expect(getBreadcrumb('/admin')).toEqual(['대시보드']);
  });

  it('그룹에 속한 화면은 [그룹, 항목]을 반환한다', () => {
    expect(getBreadcrumb('/admin/categories')).toEqual(['콘텐츠', '카테고리 관리']);
  });

  it('더 긴 경로가 있으면 그쪽에 매칭한다', () => {
    expect(getBreadcrumb('/admin/statistics/referrers')).toEqual([
      '통계',
      '유입경로',
    ]);
  });

  it('하위 경로는 상위 항목에 매칭한다', () => {
    expect(getBreadcrumb('/admin/posts/new')).toEqual(['콘텐츠', '글 관리']);
  });

  it('하단 메뉴 항목도 매칭한다', () => {
    expect(getBreadcrumb('/admin/settings')).toEqual(['블로그 설정']);
  });

  it('매칭되는 항목이 없으면 빈 배열을 반환한다', () => {
    expect(getBreadcrumb('/admin/unknown')).toEqual([]);
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_utils/admin-nav.test.ts
```

기대: FAIL — `Failed to resolve import "./admin-nav"`.

- [x] **Step 3: 모듈 작성**

`src/app/admin/_utils/admin-nav.ts`:

```ts
import {
  BarChart3,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Settings,
  Tag,
} from 'lucide-react';

export type AdminNavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

export type AdminNavGroup = {
  label?: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    items: [{ label: '대시보드', icon: LayoutDashboard, href: '/admin' }],
  },
  {
    label: '콘텐츠',
    items: [
      { label: '글 관리', icon: FileText, href: '/admin/posts' },
      { label: '카테고리 관리', icon: FolderOpen, href: '/admin/categories' },
      { label: '시리즈 관리', icon: Layers, href: '/admin/series' },
      { label: '태그 관리', icon: Tag, href: '/admin/tags' },
      { label: '댓글 관리', icon: MessageSquare, href: '/admin/comments' },
    ],
  },
  {
    label: '통계',
    items: [
      { label: '방문 통계', icon: BarChart3, href: '/admin/statistics' },
      {
        label: '유입경로',
        icon: ExternalLink,
        href: '/admin/statistics/referrers',
      },
    ],
  },
];

export const adminFooterItems: AdminNavItem[] = [
  { label: '블로그 설정', icon: Settings, href: '/admin/settings' },
  { label: '블로그 보기', icon: Globe, href: '/' },
];

/** 사이드바 본문 + 하단 메뉴를 그룹 라벨과 함께 펼친 목록 */
const searchable: { groupLabel?: string; item: AdminNavItem }[] = [
  ...adminNavGroups.flatMap((group) =>
    group.items.map((item) => ({ groupLabel: group.label, item }))
  ),
  ...adminFooterItems.map((item) => ({ groupLabel: undefined, item })),
];

function isMatch(pathname: string, href: string): boolean {
  // '/admin'과 '/'는 다른 모든 경로의 접두사이므로 정확히 일치할 때만 매칭한다
  if (href === '/admin' || href === '/') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getBreadcrumb(pathname: string): string[] {
  const matched = searchable
    .filter(({ item }) => isMatch(pathname, item.href))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];

  if (!matched) return [];

  return matched.groupLabel
    ? [matched.groupLabel, matched.item.label]
    : [matched.item.label];
}
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_utils/admin-nav.test.ts
```

기대: 10개 PASS.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/_utils/admin-nav.ts src/app/admin/_utils/admin-nav.test.ts
git commit -m "♻️ refactor: 어드민 라우트 메타데이터를 admin-nav 모듈로 분리"
```

---

## Task 4: 사이드바 셀 A

**Files:**
- Modify: `src/app/admin/_actions/admin-sidebar.action.tsx`
- Test: `src/app/admin/_actions/admin-sidebar.action.test.tsx` (신규)

**Interfaces:**
- Consumes: Task 3의 `adminNavGroups`, `adminFooterItems`. Task 1의 `--sidebar-*` 토큰(`Sidebar`가 `bg-sidebar`로 자동 소비)
- Produces: `AdminSidebarAction({ pendingReplyCount }: { pendingReplyCount?: number })`. `pendingReplyCount`가 0보다 클 때만 "댓글 관리" 항목에 뱃지를 렌더한다. PR 3이 `admin/layout.tsx`에서 실제 값을 주입한다.

**셀 A 반영 항목**

- 활성 항목은 흰 pill — `rounded-full`, 배경 `--sidebar-accent`(Task 1에서 흰색), 텍스트 `--sidebar-accent-foreground`
- 상단 로고는 원형 마크 + "YJlogs 관리". 기존 `Logo`는 `bg-zinc-900`이라 차콜 사이드바에 묻히므로 `className`으로 흰 배경을 덮는다
- 블로그 설정을 본문 메뉴에서 하단으로 내린다 (시안 3a)
- 시안 하단에는 "블로그 설정"만 있지만 **"블로그 보기"를 함께 남긴다.** 기존 기능이고 블로그로 돌아가는 유일한 링크라 제거할 이유가 없다

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/_actions/admin-sidebar.action.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebarAction } from './admin-sidebar.action';

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/categories',
}));

function renderSidebar(props: { pendingReplyCount?: number } = {}) {
  return render(
    <SidebarProvider>
      <AdminSidebarAction {...props} />
    </SidebarProvider>
  );
}

describe('AdminSidebarAction', () => {
  it('콘텐츠·통계 메뉴와 그룹 라벨을 렌더한다', () => {
    renderSidebar();

    expect(screen.getByText('콘텐츠')).toBeInTheDocument();
    expect(screen.getByText('통계')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /글 관리/ })).toHaveAttribute(
      'href',
      '/admin/posts'
    );
    expect(screen.getByRole('link', { name: /유입경로/ })).toHaveAttribute(
      'href',
      '/admin/statistics/referrers'
    );
  });

  it('블로그 설정과 블로그 보기는 하단에 있다', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: /블로그 설정/ })).toHaveAttribute(
      'href',
      '/admin/settings'
    );
    expect(screen.getByRole('link', { name: /블로그 보기/ })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('현재 경로 항목만 활성 상태로 표시된다', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /카테고리 관리/ }).closest('[data-active]')
    ).toHaveAttribute('data-active', 'true');
    expect(
      screen.getByRole('link', { name: /글 관리/ }).closest('[data-active]')
    ).toHaveAttribute('data-active', 'false');
  });

  it('대시보드는 정확히 /admin일 때만 활성화된다', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /대시보드/ }).closest('[data-active]')
    ).toHaveAttribute('data-active', 'false');
  });

  it('답변 대기 수가 있으면 댓글 관리에 뱃지를 렌더한다', () => {
    renderSidebar({ pendingReplyCount: 2 });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('답변 대기 수가 0이면 뱃지를 렌더하지 않는다', () => {
    renderSidebar({ pendingReplyCount: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('답변 대기 수를 주지 않으면 뱃지를 렌더하지 않는다', () => {
    const { container } = renderSidebar();
    expect(
      container.querySelector('[data-slot="sidebar-menu-badge"]')
    ).not.toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_actions/admin-sidebar.action.test.tsx
```

기대: FAIL — 블로그 설정이 아직 본문 메뉴에 있어 하단 단언 실패, 뱃지 미구현으로 뱃지 테스트 실패.

- [x] **Step 3: 사이드바 재작성**

`src/app/admin/_actions/admin-sidebar.action.tsx` 전체를 교체한다.

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/nav/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SITE_NAME } from '@/lib/constants';
import {
  type AdminNavItem,
  adminFooterItems,
  adminNavGroups,
} from '../_utils/admin-nav';

type Props = {
  /** 답변 대기 댓글 수. PR 3에서 layout이 주입한다. */
  pendingReplyCount?: number;
};

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarAction({ pendingReplyCount }: Props) {
  const pathname = usePathname();

  function renderItem(item: AdminNavItem, badge?: number) {
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive(pathname, item.href)}
          className="h-10 rounded-full px-3"
        >
          <Link href={item.href}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {badge !== undefined && badge > 0 && (
          <SidebarMenuBadge className="bg-sidebar-accent text-sidebar-accent-foreground rounded-full">
            {badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="h-14 justify-center px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="size-7 bg-white text-zinc-900 dark:bg-white dark:text-zinc-900" />
          <span className="text-base font-semibold">{SITE_NAME} 관리</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {adminNavGroups.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  renderItem(
                    item,
                    item.href === '/admin/comments'
                      ? pendingReplyCount
                      : undefined
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2">
        <SidebarMenu>{adminFooterItems.map((item) => renderItem(item))}</SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_actions/admin-sidebar.action.test.tsx
```

기대: 7개 PASS.

> 테스트가 의존하는 두 속성은 확인해 두었다 — `SidebarMenuButton`이 `data-active={isActive}`를 렌더하고(`src/components/ui/sidebar.tsx:522`), `SidebarMenuBadge`가 `data-slot="sidebar-menu-badge"`를 붙인다(`src/components/ui/sidebar.tsx:586`).

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/_actions/admin-sidebar.action.tsx src/app/admin/_actions/admin-sidebar.action.test.tsx
git commit -m "💄 style: 어드민 사이드바를 셀 A 외형으로 교체"
```

---

## Task 5: 헤더 셀 A

**Files:**
- Modify: `src/app/admin/_actions/admin-header.action.tsx`
- Test: `src/app/admin/_actions/admin-header.action.test.tsx` (신규)

**Interfaces:**
- Consumes: Task 3의 `getBreadcrumb`
- Produces: `AdminHeaderAction()` — props 없음. 에디터 경로(`/admin/posts/new`, `/admin/posts/<id>/edit`)에서는 브레드크럼·사이드바 트리거·글쓰기 버튼을 숨기고 사이트명 링크만 남기는 기존 동작을 유지한다.

**셀 A 반영 항목**

- 좌측에 `콘텐츠 / 카테고리 관리` 브레드크럼. 마지막 조각만 진하게
- 우측 글쓰기 버튼은 검정 pill (`rounded-full`) + `+` 아이콘

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/_actions/admin-header.action.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminHeaderAction } from './admin-header.action';

const pathname = vi.hoisted(() => ({ current: '/admin/categories' }));

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

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button type="button">사이드바 토글</button>,
}));

describe('AdminHeaderAction', () => {
  beforeEach(() => {
    pathname.current = '/admin/categories';
  });

  it('현재 경로의 브레드크럼을 렌더한다', () => {
    render(<AdminHeaderAction />);

    expect(screen.getByText('콘텐츠')).toBeInTheDocument();
    expect(screen.getByText('카테고리 관리')).toBeInTheDocument();
  });

  it('글쓰기 버튼과 사용자 버튼을 렌더한다', () => {
    render(<AdminHeaderAction />);

    expect(screen.getByRole('link', { name: /글쓰기/ })).toHaveAttribute(
      'href',
      '/admin/posts/new'
    );
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });

  it('새 글 작성 화면에서는 브레드크럼과 글쓰기 버튼을 숨긴다', () => {
    pathname.current = '/admin/posts/new';
    render(<AdminHeaderAction />);

    expect(screen.queryByRole('link', { name: /글쓰기/ })).not.toBeInTheDocument();
    expect(screen.queryByText('콘텐츠')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YJlogs' })).toHaveAttribute(
      'href',
      '/admin'
    );
  });

  it('글 수정 화면에서도 동일하게 숨긴다', () => {
    pathname.current = '/admin/posts/12/edit';
    render(<AdminHeaderAction />);

    expect(screen.queryByRole('link', { name: /글쓰기/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YJlogs' })).toBeInTheDocument();
  });

  it('브레드크럼이 없는 경로에서는 브레드크럼 영역을 비운다', () => {
    pathname.current = '/admin/unknown';
    render(<AdminHeaderAction />);

    expect(screen.getByRole('link', { name: /글쓰기/ })).toBeInTheDocument();
    expect(screen.queryByText('콘텐츠')).not.toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_actions/admin-header.action.test.tsx
```

기대: FAIL — 브레드크럼 미구현으로 "콘텐츠"·"카테고리 관리" 단언 실패.

- [x] **Step 3: 헤더 재작성**

`src/app/admin/_actions/admin-header.action.tsx` 전체를 교체한다.

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SITE_NAME } from '@/lib/constants';
import { getBreadcrumb } from '../_utils/admin-nav';

function isEditorPath(pathname: string) {
  return (
    pathname === '/admin/posts/new' ||
    (pathname.startsWith('/admin/posts/') && pathname.endsWith('/edit'))
  );
}

export function AdminHeaderAction() {
  const pathname = usePathname();
  const isEditor = isEditorPath(pathname);
  const breadcrumb = isEditor ? [] : getBreadcrumb(pathname);

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      {isEditor ? (
        <Link href="/admin" className="text-lg font-semibold">
          {SITE_NAME}
        </Link>
      ) : (
        <>
          <SidebarTrigger />
          <nav aria-label="현재 위치" className="flex items-center gap-1.5 text-sm">
            {breadcrumb.map((crumb, index) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <span
                  className={
                    index === breadcrumb.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </>
      )}

      <div className="ml-auto flex items-center gap-4">
        {!isEditor && (
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/admin/posts/new">
              <Plus size={16} />
              글쓰기
            </Link>
          </Button>
        )}
        <UserButton />
      </div>
    </header>
  );
}
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_actions/admin-header.action.test.tsx
```

기대: 5개 PASS.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/_actions/admin-header.action.tsx src/app/admin/_actions/admin-header.action.test.tsx
git commit -m "💄 style: 어드민 헤더에 브레드크럼 추가하고 셀 A 외형으로 교체"
```

---

## Task 6: 본문 셸과 공통 페이지 헤더

**Files:**
- Create: `src/app/admin/_components/admin-page-header.tsx`
- Test: `src/app/admin/_components/admin-page-header.test.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: 없음 (순수 컴포넌트)
- Produces: `AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode })`. PR 2~4의 모든 어드민 화면이 `<h1>` 직접 작성 대신 이 컴포넌트를 쓴다. 시안의 "카테고리 / 글 3개가 카테고리에 묶여 있고, 1개는 아직 미분류입니다 / [+ 새 카테고리]" 3단 구성에 대응한다.

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/_components/admin-page-header.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminPageHeader } from './admin-page-header';

describe('AdminPageHeader', () => {
  it('타이틀을 h1으로 렌더한다', () => {
    render(<AdminPageHeader title="카테고리" />);
    expect(screen.getByRole('heading', { level: 1, name: '카테고리' })).toBeInTheDocument();
  });

  it('설명을 함께 렌더한다', () => {
    render(
      <AdminPageHeader title="카테고리" description="글 3개가 카테고리에 묶여 있습니다" />
    );
    expect(
      screen.getByText('글 3개가 카테고리에 묶여 있습니다')
    ).toBeInTheDocument();
  });

  it('설명이 없으면 설명 영역을 렌더하지 않는다', () => {
    const { container } = render(<AdminPageHeader title="카테고리" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('우측 액션 슬롯을 렌더한다', () => {
    render(
      <AdminPageHeader
        title="카테고리"
        action={<button type="button">새 카테고리</button>}
      />
    );
    expect(
      screen.getByRole('button', { name: '새 카테고리' })
    ).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

```bash
npm run test:run -- src/app/admin/_components/admin-page-header.test.tsx
```

기대: FAIL — `Failed to resolve import "./admin-page-header"`.

- [x] **Step 3: 컴포넌트 작성**

`src/app/admin/_components/admin-page-header.tsx`:

```tsx
type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ title, description, action }: Props) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/_components/admin-page-header.test.tsx
```

기대: 4개 PASS.

- [x] **Step 5: layout 본문 컨테이너 조정**

`src/app/admin/layout.tsx`의 `main` 줄을 교체한다. 시안의 본문은 좌우 여백이 넉넉하고 폭이 제한돼 있다.

```tsx
        <main className="flex-1 px-8 py-8">
          <div className="mx-auto max-w-360">{children}</div>
        </main>
```

> `max-w-360`은 1440px이다 (360 × 4px). Tailwind v4 spacing 스케일 규칙에 따라 `max-w-[1440px]` 임의값 대신 숫자 유틸리티를 쓴다.

- [x] **Step 6: 전체 테스트 통과 확인**

```bash
npm run test:run
```

기대: 기존 테스트 전부 PASS + 이 PR에서 추가한 테스트 PASS. 실패가 있으면 이 태스크에서 고친다.

- [x] **Step 7: 커밋**

```bash
git add src/app/admin/_components/admin-page-header.tsx src/app/admin/_components/admin-page-header.test.tsx src/app/admin/layout.tsx
git commit -m "✨ feat: 어드민 공통 페이지 헤더 추가하고 본문 컨테이너 정리"
```

---

## Task 7: 검증

**Files:** 없음 (검증 전용)

**Interfaces:**
- Consumes: Task 1~6 전부
- Produces: 없음

- [x] **Step 1: 단위 테스트 전체 실행**

```bash
npm run test:run
```

기대: 전부 PASS. 실패가 있으면 원인을 고친 뒤 다음 단계로 간다.

- [x] **Step 2: 린트**

```bash
npm run lint
```

기대: 이 PR이 건드린 파일에서 신규 에러 0건. `docs/design/ralli/support.js`의 기존 에러 2건은 이 브랜치와 무관하므로 그대로 둔다.

- [x] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

기대: 이 PR이 건드린 파일에서 신규 에러 0건. `e2e/ralli.spec.ts`의 기존 타입 에러 1건은 `develop`에도 존재하므로 그대로 둔다.

- [x] **Step 4: 빌드**

```bash
npm run build
```

기대: 타입스크립트 컴파일 통과. 워크트리에 `DATABASE_URL`이 없으면 sitemap 데이터 수집 단계에서 실패하는데, 이는 이 PR과 무관한 환경 문제다. 그 경우 컴파일 단계까지 성공했음을 확인하고 넘어간다.

- [ ] **Step 5: 브라우저 육안 확인 (사용자 확인 필요)**

`/admin/*`은 Clerk 인증을 요구하므로 로그인 세션 없이는 에이전트가 확인할 수 없다. **아래는 사용자가 직접 확인한다.**

- [ ] 라이트 모드에서 사이드바가 차콜이고 활성 항목이 흰 pill로 보인다
- [ ] 다크 모드에서 사이드바가 본문보다 어둡고, 활성 항목이 회색 pill로 구분된다
- [ ] 다크 모드에서 사이드바 텍스트·아이콘 대비가 읽을 만하다
- [ ] 헤더 브레드크럼이 각 화면에서 올바르게 나온다 (`/admin`, `/admin/categories`, `/admin/statistics/referrers`)
- [ ] 글쓰기 화면(`/admin/posts/new`)에서 브레드크럼·글쓰기 버튼이 사라지고 사이트명만 남는다
- [ ] 블로그 화면(`/`)의 색이 이 PR 전후로 달라지지 않았다 (`--sidebar` 변경이 블로그로 새지 않았는지)
- [ ] 사이드바를 접었다 펴도 레이아웃이 깨지지 않는다
- [ ] 모바일 폭에서 사이드바가 Sheet로 열린다

토큰 값이 시안과 어긋나 보이면 `globals.css`의 `oklch` 값만 조정한다. 스펙의 토큰 표에 적힌 값은 출발점이며 최종값이 아니다.

- [ ] **Step 6: plan 문서 완료 기록**

이 문서 상단에 완료 일자와 결과 요약을 추가하고, 모든 체크박스를 `- [x]`로 반영한다.

- [ ] **Step 7: PR 생성 (사용자 확인 필요)**

`develop`으로의 PR 생성은 공유 브랜치에 영향을 주므로 사용자 확인 없이 진행하지 않는다. 브랜치 리뷰까지 마친 뒤 사용자에게 옵션을 안내한다.

머지는 squash 금지, `--no-ff` 머지 커밋 방식이다 (`CLAUDE.md` 머지 규칙).

---

## Self-Review 기록

**스펙 커버리지** — 이 PR이 담당하는 스펙 항목은 「디자인 토큰」(Task 1), 「새로 만들어야 하는 것」의 `switch.tsx`(Task 2), 「채택 — 셀 A 전 화면 통일」의 셸 부분(Task 4~6), 「다크모드 대응」(Task 1 + Task 7 Step 5)이다. 개별 화면·스키마 변경·`@tanstack/react-table` 제거는 PR 2~4 소관으로 「이 PR의 범위 밖」에 명시했다.

**타입 일관성** — `AdminNavItem`/`AdminNavGroup`은 Task 3에서 정의하고 Task 4가 소비한다. `getBreadcrumb`은 Task 3에서 정의하고 Task 5가 소비한다. `AdminSidebarAction`의 `pendingReplyCount`는 이 PR에서 optional로 두고 PR 3이 주입한다 — 주입 전에도 뱃지 미렌더 경로가 테스트로 덮여 있다.

**플레이스홀더 스캔** — 모든 코드 스텝에 실제 코드 블록이 들어 있고, 실행 커맨드와 기대 결과를 명시했다. "적절히 처리" 류 문구 없음.

**미확인 사항** — Task 1의 `oklch` 값들은 시안을 눈으로 읽은 근사치다. Task 7 Step 5의 육안 확인에서 조정하는 것을 전제로 하며, 이는 스펙에도 명시돼 있다. 그 외 미확인 사항 없음 — 테스트가 의존하는 `data-active`·`data-slot` 속성과 `SidebarMenuBadge` 존재 여부는 실제 파일에서 확인했다.
