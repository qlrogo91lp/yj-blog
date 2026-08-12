# Apps 목록 아이템 컴포넌트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/apps` 목록의 앱 카드를 `[앱 아이콘 | 플랫폼 칩·이름·설명 | chevron]` 가로 배치로 바꾸고, iOS/watchOS/Web 플랫폼을 아이콘 칩으로 표시한다.

**Architecture:** 설계 문서 [`2026-08-12-apps-list-item-design.md`](../specs/2026-08-12-apps-list-item-design.md)를 따른다. `App`의 `type` 필드(배포 채널)를 `platforms` 배열로 교체하고 `iconSrc`를 추가한다. 플랫폼 → 아이콘·레이블 매핑은 `AppPlatformChips` 한 곳에 가둬 목록과 상세가 같은 표기를 쓰게 한다. 데이터 모델 변경이 두 페이지를 동시에 깨뜨리지 않도록 `type`을 먼저 optional로 낮춘 뒤 소비자를 순서대로 옮기고 마지막에 제거한다 — **각 태스크의 커밋은 독립적으로 컴파일된다.**

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, lucide-react, Vitest + @testing-library/react

## Global Constraints

모든 태스크의 요구사항에 아래가 암묵적으로 포함된다.

- **Tailwind v4 문법** — 임의값 `[Npx]` 대신 spacing 스케일 숫자 유틸리티를 쓴다 (`size-14` = 56px, `size-18` = 72px). `w-14 h-14` 대신 `size-14`.
- **radius는 `globals.css` 토큰만 사용** — 임의값 금지. 카드 `rounded-2xl`(18px), 아이콘 `rounded-xl`(14px), 상세 아이콘 `rounded-2xl`(18px).
- **lucide-react 아이콘 크기는 `size` 속성** — `className="w-4 h-4"` 금지 (`.claude/rules/coding-conventions.md`).
- **컴포넌트 규칙** — 파일명 kebab-case, 함수명 PascalCase, props 타입은 `type Props = {}`, 조건부 클래스는 `cn()`.
- **Import 규칙** — React hook은 named import. `React.useState`·`import * as React` 금지.
- **파일 위치** — 순수 컴포넌트는 `_components/`에 `.tsx`로 둔다 (`.claude/rules/page-folder.md`).
- **테스트** — `vitest.config.ts`가 `globals: true`이므로 `describe`·`it`·`expect`·`vi`를 **import 없이** 쓴다 (ralli 테스트들과 동일한 스타일). `next/image`·`next/link`는 jsdom에서 동작하지 않으므로 `vi.mock`으로 교체한다.
- **커밋 메시지는 gitmoji 사용** (예: `✨`, `♻️`, `🎨`, `🔥`)
- **각 태스크 종료 시** `npx tsc --noEmit` 에러 0건, `npm run test:run` 전체 통과를 유지한다.

> **기존 baseline 참고**: `docs/design/ralli/support.js`에 이 작업과 무관한 lint 에러 2건이 있다(생성된 번들, "do not edit"). 무시한다.

## 시작 전: 브랜치 생성

스펙·플랜 문서는 `develop`에 둔다. 여기서부터는 구현 코드이므로 브랜치를 만든다.

```bash
git checkout develop
git checkout -b feature/apps-list-item
```

## File Structure

| 파일 | 책임 | 태스크 |
|---|---|---|
| `src/app/(main)/apps/_utils/apps-data.ts` | `AppPlatform` 타입 · `platforms`·`iconSrc` 필드 · Ralli 데이터 | 1, 3 |
| `src/app/(main)/apps/_components/app-platform-chips.tsx` | 플랫폼 → 아이콘·레이블 매핑의 **단일 출처**. 목록·상세가 공유 | 1 |
| `src/app/(main)/apps/_components/app-list-item.tsx` | 목록의 가로 카드 하나. props만 받는 순수 컴포넌트 | 2 |
| `src/app/(main)/apps/page.tsx` | 목록 조립 — 컴포넌트 교체만, 그리드는 유지 | 2 |
| `src/app/(main)/apps/_components/app-card.tsx` | **삭제** — `app-list-item.tsx`로 대체 | 2 |
| `src/app/(main)/apps/[slug]/page.tsx` | 상세 헤더에 아이콘 + 플랫폼 칩 적용 | 3 |

### 태스크 분할 근거

`type` → `platforms` 교체는 `app-card.tsx`와 `[slug]/page.tsx` 두 소비자를 동시에 깨뜨린다. 한 태스크에 몰면 리뷰 단위가 커지고, 순서를 잘못 잡으면 중간 커밋이 컴파일되지 않는다. 그래서:

1. **Task 1** — 새 필드를 **추가**하고 `type`은 `type?:`로 낮춘다. 기존 두 소비자는 손대지 않아도 계속 컴파일된다.
2. **Task 2** — 목록을 새 컴포넌트로 옮기고 `app-card.tsx`를 지운다. `type` 소비자가 하나 줄어든다.
3. **Task 3** — 상세를 옮기고 마지막 남은 `type`을 제거한다.

---

### Task 1: 데이터 모델 확장 + `AppPlatformChips`

`App`에 플랫폼 배열과 아이콘 경로를 추가하고, 플랫폼 표기 컴포넌트를 만든다. 이 태스크는 기존 화면의 동작을 바꾸지 않는다 — 새 필드를 심고 새 컴포넌트를 준비만 한다.

**Files:**
- Modify: `src/app/(main)/apps/_utils/apps-data.ts`
- Create: `src/app/(main)/apps/_components/app-platform-chips.tsx`
- Test: `src/app/(main)/apps/_components/app-platform-chips.test.tsx`

**Interfaces:**
- Produces:
  - `AppPlatform` = `'ios' | 'watch' | 'web'` — Task 2·3이 사용
  - `App.platforms: AppPlatform[]`, `App.iconSrc: string` — Task 2·3이 사용
  - `App.type?: 'web' | 'app-store'` — **optional로 낮춤**. Task 3에서 완전히 제거한다
  - `AppPlatformChips({ platforms }: { platforms: AppPlatform[] })` — Task 2·3이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/_components/app-platform-chips.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { AppPlatformChips } from './app-platform-chips';

describe('AppPlatformChips', () => {
  it('ios와 watch를 함께 주면 iPhone·Watch 칩을 렌더한다', () => {
    render(<AppPlatformChips platforms={['ios', 'watch']} />);
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('web을 주면 Web 칩만 렌더한다', () => {
    render(<AppPlatformChips platforms={['web']} />);
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.queryByText('iPhone')).not.toBeInTheDocument();
  });

  it('플랫폼 순서대로 렌더한다', () => {
    render(<AppPlatformChips platforms={['watch', 'ios']} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Watch');
    expect(items[1]).toHaveTextContent('iPhone');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- app-platform-chips
```

Expected: FAIL — `Failed to resolve import "./app-platform-chips"`

- [ ] **Step 3: `apps-data.ts` 수정**

파일 전체를 아래로 교체한다. `type`은 `?`를 붙여 optional로 낮추되 Ralli 데이터에는 값을 남겨둔다 — `[slug]/page.tsx`가 아직 이 값으로 렌더하기 때문이다.

```ts
export type AppPlatform = 'ios' | 'watch' | 'web';

export type App = {
  slug: string;
  name: string;
  description: string;
  iconSrc: string;
  platforms: AppPlatform[];
  /** @deprecated platforms로 대체됨. Task 3에서 제거한다. */
  type?: 'web' | 'app-store';
  tags: string[];
  longDescription: string;
  links: { label: string; url: string }[];
};

export const apps: App[] = [
  {
    slug: 'ralli',
    name: 'Ralli',
    description: '테니스 경기 중 점수 카운터 앱',
    iconSrc: '/ralli/icon1.png',
    platforms: ['ios', 'watch'],
    type: 'app-store',
    tags: ['테니스', '스포츠', 'iOS'],
    longDescription:
      '테니스 경기 중 점수를 빠르고 편리하게 카운트할 수 있는 iOS 앱입니다. 게임·세트·매치 단위로 점수를 자동 관리합니다.',
    links: [],
  },
];

export function getApp(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
```

`/ralli/icon1.png`는 `public/ralli/icon1.png`에 이미 존재한다(1024×1024 PNG). 새로 추가할 자산은 없다.

- [ ] **Step 4: `app-platform-chips.tsx` 구현**

```tsx
import { Globe, LucideIcon, Smartphone, Watch } from 'lucide-react';
import type { AppPlatform } from '../_utils/apps-data';

const platformMeta: Record<AppPlatform, { label: string; Icon: LucideIcon }> = {
  ios: { label: 'iPhone', Icon: Smartphone },
  watch: { label: 'Watch', Icon: Watch },
  web: { label: 'Web', Icon: Globe },
};

type Props = {
  platforms: AppPlatform[];
};

export function AppPlatformChips({ platforms }: Props) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {platforms.map((platform) => {
        const { label, Icon } = platformMeta[platform];
        return (
          <li
            key={platform}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <Icon size={12} />
            {label}
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm run test:run -- app-platform-chips
```

Expected: PASS (3 tests)

- [ ] **Step 6: 기존 화면이 깨지지 않았는지 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 0건. `type`을 optional로 낮췄을 뿐 제거하지 않았으므로 `app-card.tsx`와 `[slug]/page.tsx`의 `app.type === 'web'` 비교는 그대로 컴파일된다.

- [ ] **Step 7: 커밋**

```bash
git add "src/app/(main)/apps/_utils/apps-data.ts" "src/app/(main)/apps/_components/app-platform-chips.tsx" "src/app/(main)/apps/_components/app-platform-chips.test.tsx"
git commit -m "✨ 앱 데이터에 플랫폼·아이콘 필드와 플랫폼 칩 컴포넌트 추가"
```

---

### Task 2: `AppListItem` + 목록 페이지 교체

목록 카드를 가로 배치로 바꾸고 기존 `AppCard`를 지운다.

**Files:**
- Create: `src/app/(main)/apps/_components/app-list-item.tsx`
- Test: `src/app/(main)/apps/_components/app-list-item.test.tsx`
- Modify: `src/app/(main)/apps/page.tsx`
- Delete: `src/app/(main)/apps/_components/app-card.tsx`

**Interfaces:**
- Consumes: `App` · `AppPlatform` (Task 1), `AppPlatformChips` (Task 1)
- Produces: `AppListItem({ app }: { app: App })` — `apps/page.tsx`가 사용

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/_components/app-list-item.test.tsx`:

테스트 fixture에는 `type`을 넣지 않는다 — Task 1에서 optional로 낮췄고 Task 3에서 제거되므로, 넣으면 Task 3에서 이 파일을 다시 고쳐야 한다.

```tsx
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { AppListItem } from './app-list-item';
import type { App } from '../_utils/apps-data';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockApp: App = {
  slug: 'ralli',
  name: 'Ralli',
  description: '테니스 경기 중 점수 카운터 앱',
  iconSrc: '/ralli/icon1.png',
  platforms: ['ios', 'watch'],
  tags: ['테니스'],
  longDescription: '긴 설명',
  links: [],
};

describe('AppListItem', () => {
  it('앱 이름과 설명을 렌더한다', () => {
    render(<AppListItem app={mockApp} />);
    expect(screen.getByRole('heading', { name: 'Ralli' })).toBeInTheDocument();
    expect(screen.getByText('테니스 경기 중 점수 카운터 앱')).toBeInTheDocument();
  });

  it('상세 페이지로 링크한다', () => {
    render(<AppListItem app={mockApp} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/apps/ralli');
  });

  it('앱 아이콘을 alt와 함께 렌더한다', () => {
    render(<AppListItem app={mockApp} />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('src', '/ralli/icon1.png');
    expect(icon).toHaveAttribute('alt', 'Ralli 앱 아이콘');
  });

  it('플랫폼 칩을 모두 렌더한다', () => {
    render(<AppListItem app={mockApp} />);
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('웹앱은 Web 칩을 렌더한다', () => {
    render(<AppListItem app={{ ...mockApp, platforms: ['web'] }} />);
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.queryByText('iPhone')).not.toBeInTheDocument();
  });
});
```

마지막 테스트는 현재 데이터에 웹앱이 없으므로 fixture로 검증한다 — `web` 분기가 죽은 코드가 아님을 보장한다.

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- app-list-item
```

Expected: FAIL — `Failed to resolve import "./app-list-item"`

- [ ] **Step 3: `app-list-item.tsx` 구현**

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AppPlatformChips } from './app-platform-chips';
import type { App } from '../_utils/apps-data';

type Props = {
  app: App;
};

export function AppListItem({ app }: Props) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50"
    >
      <Image
        src={app.iconSrc}
        alt={`${app.name} 앱 아이콘`}
        width={56}
        height={56}
        sizes="56px"
        className="size-14 flex-none rounded-xl"
      />

      <div className="min-w-0 flex-1">
        <AppPlatformChips platforms={app.platforms} />
        <h2 className="mt-1.5 font-semibold">{app.name}</h2>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{app.description}</p>
      </div>

      <ChevronRight
        size={18}
        className="flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
```

`min-w-0 flex-1`이 핵심이다. flex 자식의 기본 `min-width: auto` 때문에 이게 없으면 `truncate`가 동작하지 않고, 2열 그리드에서 긴 설명이 카드를 밀어낸다.

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- app-list-item
```

Expected: PASS (5 tests)

- [ ] **Step 5: `apps/page.tsx` 교체**

import 한 줄과 컴포넌트 이름만 바꾼다. 그리드(`gap-4 sm:grid-cols-2`)와 `max-w-3xl`은 그대로 둔다.

```tsx
import type { Metadata } from 'next';
import { apps } from './_utils/apps-data';
import { AppListItem } from './_components/app-list-item';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Apps | ${SITE_NAME}`,
  description: '개발한 웹앱과 앱스토어 앱 목록',
};

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Apps</h1>
      <p className="mt-2 text-muted-foreground">개발한 웹앱과 앱스토어 앱을 소개합니다.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <AppListItem key={app.slug} app={app} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 구 컴포넌트 삭제**

```bash
git rm "src/app/(main)/apps/_components/app-card.tsx"
```

`app-card.tsx`에는 대응하는 테스트 파일이 없으므로 함께 지울 파일은 없다. 삭제 후 잔여 참조가 없는지 확인한다:

```bash
grep -rn "AppCard\|app-card" src/ e2e/
```

Expected: 출력 없음

- [ ] **Step 7: 타입·테스트 전체 확인**

```bash
npx tsc --noEmit && npm run test:run
```

Expected: 에러 0건, 전체 PASS. `app-card.tsx`가 사라지면서 `type` 소비자는 `[slug]/page.tsx` 하나만 남는다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "✨ Apps 목록을 앱 아이콘 가로 배치 카드로 교체"
```

---

### Task 3: 상세 페이지 적용 + `type` 필드 제거

상세 헤더에도 아이콘과 플랫폼 칩을 적용하고, 더 이상 쓰이지 않는 `type` 필드를 완전히 제거한다.

**Files:**
- Modify: `src/app/(main)/apps/[slug]/page.tsx`
- Modify: `src/app/(main)/apps/_utils/apps-data.ts`

**Interfaces:**
- Consumes: `AppPlatformChips` (Task 1), `App.iconSrc`·`App.platforms` (Task 1)
- **삭제**: `App.type` — 이 태스크 이후 어디에도 남지 않는다

- [ ] **Step 1: `[slug]/page.tsx` 재작성**

파일 전체를 아래로 교체한다. 변경점은 세 가지다 — (1) `Globe`·`Smartphone` import 제거하고 `Image` 추가, (2) `app.type` 분기 블록을 `AppPlatformChips`로 교체, (3) 헤더를 아이콘과 나란히 두는 flex 배치로 감쌈. 태그 칩과 링크 섹션은 그대로 유지한다.

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { apps, getApp } from '../_utils/apps-data';
import { AppPlatformChips } from '../_components/app-platform-chips';
import { SITE_NAME } from '@/lib/constants';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) return {};

  return {
    title: `${app.name} | ${SITE_NAME}`,
    description: app.description,
  };
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const app = getApp(slug);

  if (!app) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/apps"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Apps 목록
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <Image
          src={app.iconSrc}
          alt={`${app.name} 앱 아이콘`}
          width={72}
          height={72}
          sizes="72px"
          className="size-18 flex-none rounded-2xl"
        />

        <div className="min-w-0">
          <AppPlatformChips platforms={app.platforms} />

          <h1 className="mt-2 text-3xl font-bold">{app.name}</h1>
          <p className="mt-2 text-muted-foreground">{app.description}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {app.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-muted-foreground leading-relaxed">{app.longDescription}</p>
      </div>

      {app.links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {app.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <ExternalLink size={16} />
              {link.label}
            </a>
          ))}
        </div>
      )}

      {app.links.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">출시 준비 중입니다.</p>
      )}
    </div>
  );
}
```

기존 `ArrowLeft`·`ExternalLink`가 `className="h-4 w-4"`로 크기를 지정하고 있었는데 `size={16}`으로 바꿨다 — `coding-conventions.md`의 lucide 규칙이다.

- [ ] **Step 2: `apps-data.ts`에서 `type` 제거**

`App` 타입에서 `type?: 'web' | 'app-store';` 줄과 그 위의 `@deprecated` 주석을 지우고, `apps` 배열의 Ralli 항목에서 `type: 'app-store',` 줄을 지운다. 결과는 아래와 같다.

```ts
export type AppPlatform = 'ios' | 'watch' | 'web';

export type App = {
  slug: string;
  name: string;
  description: string;
  iconSrc: string;
  platforms: AppPlatform[];
  tags: string[];
  longDescription: string;
  links: { label: string; url: string }[];
};

export const apps: App[] = [
  {
    slug: 'ralli',
    name: 'Ralli',
    description: '테니스 경기 중 점수 카운터 앱',
    iconSrc: '/ralli/icon1.png',
    platforms: ['ios', 'watch'],
    tags: ['테니스', '스포츠', 'iOS'],
    longDescription:
      '테니스 경기 중 점수를 빠르고 편리하게 카운트할 수 있는 iOS 앱입니다. 게임·세트·매치 단위로 점수를 자동 관리합니다.',
    links: [],
  },
];

export function getApp(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
```

- [ ] **Step 3: 잔여 참조 확인**

```bash
grep -rn "app\.type\|'app-store'" src/ e2e/
```

Expected: 출력 없음. 하나라도 나오면 그 파일을 함께 고친다.

- [ ] **Step 4: 타입·린트·테스트 전체 확인**

```bash
npx tsc --noEmit && npm run lint && npm run test:run
```

Expected: 타입 에러 0건, 전체 테스트 PASS. lint는 `docs/design/ralli/support.js`의 사전 존재 에러 2건 외에 0건이어야 한다.

- [ ] **Step 5: E2E 확인**

기존 `e2e/ralli.spec.ts`에 `/apps` 목록에서 Ralli 카드로 진입하는 시나리오가 있다(`getByRole('link', { name: /Ralli/ })`). 카드 구조가 바뀌었으므로 여전히 통과하는지 확인한다.

```bash
npm run test:e2e
```

Expected: `Apps 목록에서 Ralli 카드로 진입한다` 통과.

> **알려진 실패 1건**: 모바일(390px) 가로 스크롤 테스트는 이 작업과 무관한 사이트 전역 `min-w-100`(`src/app/layout.tsx:66`) 때문에 계속 실패한다. 사용자가 이미 인지하고 현행 유지로 결정한 항목이다.
>
> **포트 확인**: `npm run test:e2e` 전에 3000 포트를 다른 프로젝트가 점유하고 있지 않은지 `lsof -nP -iTCP:3000 -sTCP:LISTEN`으로 확인한다. Playwright의 `reuseExistingServer`가 엉뚱한 앱을 대상으로 테스트할 수 있다.

- [ ] **Step 6: 프로덕션 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공. `/apps`와 `/apps/ralli`가 정적 페이지(`○`)로 생성된다.

- [ ] **Step 7: 실제 화면 확인**

개발 서버를 띄우고 `/apps`를 연다. 확인할 것:

- 2열 그리드에서 카드가 밀리거나 넘치지 않는가 (긴 설명이 `truncate`되는가)
- 앱 아이콘이 `rounded-xl`(14px)로 렌더되고 카드 `rounded-2xl`(18px)와 중첩이 자연스러운가
- 플랫폼 칩(iPhone·Watch)의 아이콘과 텍스트가 세로 중앙 정렬되는가
- **다크 모드**에서 칩 배경(`bg-muted`)과 텍스트 대비가 유지되는가
- 상세 페이지(`/apps/ralli`)의 아이콘 72px과 칩이 목록과 같은 표기인가

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "♻️ 앱 상세에 플랫폼 칩 적용하고 type 필드 제거"
```

- [ ] **Step 9: PR 생성**

```bash
git push -u origin feature/apps-list-item
gh pr create --base develop --title "✨ Apps 목록 아이템을 앱 아이콘 가로 카드로 교체" --body "$(cat <<'EOF'
## 요약
`/apps` 목록 카드를 `[앱 아이콘 | 플랫폼 칩·이름·설명 | chevron]` 가로 배치로 교체하고, iOS/watchOS/Web 플랫폼을 아이콘 칩으로 표시한다.

- 설계 문서: `docs/superpowers/specs/2026-08-12-apps-list-item-design.md`
- 구현 계획: `docs/superpowers/plans/2026-08-12-apps-list-item.md`

## 주요 변경
- `App.type`(배포 채널) → `App.platforms`(플랫폼 배열)로 교체, `iconSrc` 추가
- `AppPlatformChips` 신설 — 플랫폼 → 아이콘·레이블 매핑의 단일 출처. 목록·상세가 공유
- `AppCard`(세로) → `AppListItem`(가로) 교체
- 상세 페이지 헤더에도 앱 아이콘과 플랫폼 칩 적용
- radius를 `globals.css` 토큰으로 통일 — 카드 `rounded-2xl`(18px), 아이콘 `rounded-xl`(14px)

## 검증
- `npm run test:run` 전체 통과 (신규 8건 포함)
- `npm run build` 성공
- `npm run test:e2e` — `/apps` 진입 시나리오 통과

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 사람이 직접 확인해야 할 항목

- **다크 모드 대비** — 칩의 `bg-muted` + `text-muted-foreground` 조합이 다크 모드에서 충분히 읽히는지. 자동 테스트로는 잡히지 않는다.
- **아이콘 곡률** — `rounded-xl`(14px)은 56px 아이콘에서 25% 비율이라 iOS 실제 곡률(≈22%, 12.5px)보다 살짝 둥글다. 실제로 보고 어색하면 조정한다.
- **두 번째 앱이 생겼을 때** — 현재 앱이 1개라 2열 그리드의 두 번째 칸이 비어 있다. 카드 폭이 좁아졌을 때의 `truncate` 동작은 실제 두 번째 앱이 생겨야 제대로 검증된다.
