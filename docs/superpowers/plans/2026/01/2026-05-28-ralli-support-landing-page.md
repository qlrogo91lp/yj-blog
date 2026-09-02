# Ralli 지원·랜딩 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Store 지원 URL 겸 랜딩 페이지(`/apps/ralli`)와 개인정보 처리방침(`/apps/ralli/privacy`)을 yj-blog에 추가한다.

**Architecture:** Next.js App Router 정적 세그먼트(`apps/ralli`)가 기존 동적 `[slug]` 템플릿보다 우선 적용되어 Ralli 전용 커스텀 페이지를 렌더한다. 모든 카피·이미지·상수는 `_utils/ralli-content.ts`에 모으고, 페이지는 순수 프레젠테이션 컴포넌트를 조합한다. 스크린샷이 모두 검은 배경이라 페이지는 사이트 테마와 무관하게 다크 톤(블랙 배경 + 라임그린 강조 + 오렌지 보조)으로 고정한다.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS v4, `next/image`, `next/link`, lucide-react. 테스트: Vitest + Testing Library(순수 컴포넌트·로직), Playwright(페이지 흐름).

**언어:** 페이지 콘텐츠는 영문 단독. 데이터 모델: SwiftData + CloudKit(사용자 본인 iCloud 동기화), 외부 서버 전송 없음.

**관련 spec:** `docs/superpowers/specs/2026-05-28-ralli-support-landing-page-design.md`

---

## File Structure

생성:
- `src/app/(main)/apps/ralli/page.tsx` — 랜딩/지원 페이지 조합 (서버 컴포넌트)
- `src/app/(main)/apps/ralli/privacy/page.tsx` — 개인정보 처리방침 (서버 컴포넌트, 정적 텍스트)
- `src/app/(main)/apps/ralli/_utils/ralli-content.ts` — 카피·기능·스크린샷 데이터·상수
- `src/app/(main)/apps/ralli/_utils/ralli-content.test.ts` — 데이터 정합성 테스트
- `src/app/(main)/apps/ralli/_components/ralli-cta-button.tsx` — App Store 버튼 / Coming soon 배지 분기
- `src/app/(main)/apps/ralli/_components/ralli-cta-button.test.tsx`
- `src/app/(main)/apps/ralli/_components/ralli-hero.tsx` — Hero
- `src/app/(main)/apps/ralli/_components/ralli-feature-section.tsx` — 기능 섹션 1개
- `src/app/(main)/apps/ralli/_components/ralli-screenshot-gallery.tsx` — 스크린샷 갤러리
- `src/app/(main)/apps/ralli/_components/ralli-support.tsx` — 지원(이메일·개인정보 링크)
- `src/app/(main)/apps/ralli/_components/ralli-support.test.tsx`
- `e2e/ralli.spec.ts` — 페이지·내비게이션 E2E

이미 작업트리에 존재(미커밋):
- `public/ralli/*` (이미지 11장 + 아이콘)
- `src/app/(main)/apps/_utils/apps-data.ts` (Tennis Counter → Ralli 변경)

---

### Task 1: 자산 커밋 + 콘텐츠 모듈

기존 미커밋 자산(이미지·apps-data 변경)을 먼저 커밋해 토대를 만들고, 모든 카피/상수를 담는 콘텐츠 모듈을 작성한다.

**Files:**
- Create: `src/app/(main)/apps/ralli/_utils/ralli-content.ts`
- Create: `src/app/(main)/apps/ralli/_utils/ralli-content.test.ts`
- Commit: `public/ralli/`, `src/app/(main)/apps/_utils/apps-data.ts`

- [ ] **Step 1: 콘텐츠 모듈 작성**

`src/app/(main)/apps/ralli/_utils/ralli-content.ts`:

```ts
export type RalliImageKind = 'ios' | 'watch';

export type RalliImage = {
  src: string;
  alt: string;
  kind: RalliImageKind;
  width: number;
  height: number;
};

const IOS_W = 1284;
const IOS_H = 2778;
const WATCH_W = 422;
const WATCH_H = 514;

function iosImage(src: string, alt: string): RalliImage {
  return { src, alt, kind: 'ios', width: IOS_W, height: IOS_H };
}

function watchImage(src: string, alt: string): RalliImage {
  return { src, alt, kind: 'watch', width: WATCH_W, height: WATCH_H };
}

export const ralliMeta = {
  name: 'Ralli',
  tagline: 'Tennis scores, right on your wrist.',
  subtitle: 'A score-counting companion for tennis players.',
  iconSrc: '/ralli/icon1.png',
  supportEmail: 'qlrogo91lp@gmail.com',
  // 출시 후 App Store URL을 채우면 Hero CTA가 다운로드 버튼으로 자동 전환된다.
  appStoreUrl: '',
} as const;

export type RalliFeature = {
  id: string;
  heading: string;
  bullets: string[];
  images: RalliImage[];
};

export const ralliFeatures: RalliFeature[] = [
  {
    id: 'on-the-wrist',
    heading: 'On the court, all on your wrist',
    bullets: [
      'Score, pick a format, and check results — entirely from Apple Watch',
      'Launch the app from your watch face with a complication',
      'At a glance on the Lock Screen and Dynamic Island',
    ],
    images: [
      watchImage('/ralli/watch-match-global.png', 'Ralli match score on Apple Watch'),
      watchImage('/ralli/watch-complication-global.png', 'Ralli complication on the Apple Watch face'),
    ],
  },
  {
    id: 'match-is-a-workout',
    heading: 'A match is a workout — logged automatically',
    bullets: [
      'Seamlessly tied to a HealthKit workout session',
      'Calories, heart rate, and workout time tracked automatically',
      'Syncs with the Apple Fitness app',
    ],
    images: [
      watchImage('/ralli/watch-workout-global.png', 'Ralli workout metrics on Apple Watch'),
      iosImage('/ralli/ios-workout-global.png', 'Ralli workout metrics on iPhone'),
    ],
  },
  {
    id: 'replay-on-iphone',
    heading: 'Replay every match on iPhone',
    bullets: [
      'Set-by-set scores, kcal, and workout time in detail',
      'Your tennis days stacked on a calendar, automatically',
      'Monthly and lifetime stats',
    ],
    images: [
      iosImage('/ralli/ios-summary-global.png', 'Ralli match summary stats on iPhone'),
      iosImage('/ralli/ios-live-global.png', 'Ralli Live Activity on the iPhone Lock Screen'),
    ],
  },
  {
    id: 'your-own-rules',
    heading: 'Play by your own rules',
    bullets: [
      'Customizable set length: 4, 5, or 6 games',
      'No-ad, no-tie, and tiebreak support',
      'Start with the rules you actually play',
    ],
    images: [
      watchImage('/ralli/watch-mode-global.png', 'Ralli match format on Apple Watch'),
      iosImage('/ralli/ios-mode-global.png', 'Ralli match format selection on iPhone'),
    ],
  },
];

export const ralliScreenshots: RalliImage[] = [
  iosImage('/ralli/ios-match-global.png', 'Ralli match score on iPhone'),
  iosImage('/ralli/connectivity-global.png', 'Ralli on iPhone and Apple Watch together'),
  iosImage('/ralli/ios-mode-global.png', 'Ralli match format selection on iPhone'),
  iosImage('/ralli/ios-workout-global.png', 'Ralli workout metrics on iPhone'),
  iosImage('/ralli/ios-summary-global.png', 'Ralli match summary stats on iPhone'),
  iosImage('/ralli/ios-live-global.png', 'Ralli Live Activity on the iPhone Lock Screen'),
  watchImage('/ralli/watch-home-global.png', 'Ralli home on Apple Watch'),
  watchImage('/ralli/watch-match-global.png', 'Ralli match score on Apple Watch'),
  watchImage('/ralli/watch-mode-global.png', 'Ralli match format on Apple Watch'),
  watchImage('/ralli/watch-complication-global.png', 'Ralli complication on the Apple Watch face'),
  watchImage('/ralli/watch-workout-global.png', 'Ralli workout metrics on Apple Watch'),
];
```

- [ ] **Step 2: 데이터 정합성 테스트 작성 (failing)**

`src/app/(main)/apps/ralli/_utils/ralli-content.test.ts`:

```ts
import { ralliFeatures, ralliScreenshots, ralliMeta } from './ralli-content';

const allImages = [...ralliScreenshots, ...ralliFeatures.flatMap((f) => f.images)];

describe('ralli-content', () => {
  it('모든 이미지 src는 /ralli/ 경로이고 alt가 비어있지 않다', () => {
    for (const img of allImages) {
      expect(img.src.startsWith('/ralli/')).toBe(true);
      expect(img.alt.length).toBeGreaterThan(0);
    }
  });

  it('ios/watch 이미지의 intrinsic 크기가 양수다', () => {
    for (const img of allImages) {
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
    }
  });

  it('기능 섹션은 4개이고 각각 불릿과 이미지를 갖는다', () => {
    expect(ralliFeatures).toHaveLength(4);
    for (const f of ralliFeatures) {
      expect(f.bullets.length).toBeGreaterThan(0);
      expect(f.images.length).toBeGreaterThan(0);
    }
  });

  it('지원 이메일이 설정되어 있다', () => {
    expect(ralliMeta.supportEmail).toContain('@');
  });
});
```

- [ ] **Step 3: 테스트 실행 (통과 확인)**

Run: `npm run test:run -- src/app/\(main\)/apps/ralli/_utils/ralli-content.test.ts`
Expected: PASS (구현이 이미 데이터를 만족하므로 통과)

> 참고: 이 테스트는 데이터 정합성 가드다. Step 1의 모듈이 조건을 만족하도록 작성되었으므로 바로 통과한다.

- [ ] **Step 4: 자산 + 콘텐츠 커밋**

```bash
git add public/ralli "src/app/(main)/apps/_utils/apps-data.ts" "src/app/(main)/apps/ralli/_utils/ralli-content.ts" "src/app/(main)/apps/ralli/_utils/ralli-content.test.ts"
git commit -m "feat: Ralli 랜딩 콘텐츠 모듈·이미지 자산 추가"
```

---

### Task 2: RalliCtaButton (분기 로직)

`appStoreUrl`이 있으면 다운로드 링크, 없으면 "Coming soon" 배지를 렌더하는 유일한 로직 컴포넌트. TDD 대상.

**Files:**
- Create: `src/app/(main)/apps/ralli/_components/ralli-cta-button.tsx`
- Test: `src/app/(main)/apps/ralli/_components/ralli-cta-button.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_components/ralli-cta-button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { RalliCtaButton } from './ralli-cta-button';

describe('RalliCtaButton', () => {
  it('appStoreUrl이 있으면 App Store 다운로드 링크를 렌더한다', () => {
    render(<RalliCtaButton appStoreUrl="https://apps.apple.com/app/id123" />);
    const link = screen.getByRole('link', { name: /App Store/i });
    expect(link).toHaveAttribute('href', 'https://apps.apple.com/app/id123');
  });

  it('appStoreUrl이 비어있으면 Coming soon 배지를 렌더하고 링크는 없다', () => {
    render(<RalliCtaButton appStoreUrl="" />);
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm run test:run -- src/app/\(main\)/apps/ralli/_components/ralli-cta-button.test.tsx`
Expected: FAIL ("Cannot find module './ralli-cta-button'")

- [ ] **Step 3: 컴포넌트 구현**

`src/app/(main)/apps/ralli/_components/ralli-cta-button.tsx`:

```tsx
type Props = {
  appStoreUrl: string;
};

export function RalliCtaButton({ appStoreUrl }: Props) {
  if (appStoreUrl.trim().length > 0) {
    return (
      <a
        href={appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
      >
        Download on the App Store
      </a>
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full border border-lime-400/40 px-6 py-3 text-sm font-semibold text-lime-400">
      Coming soon to the App Store
    </span>
  );
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm run test:run -- src/app/\(main\)/apps/ralli/_components/ralli-cta-button.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-cta-button.tsx" "src/app/(main)/apps/ralli/_components/ralli-cta-button.test.tsx"
git commit -m "feat: RalliCtaButton — App Store 링크/Coming soon 분기"
```

---

### Task 3: RalliSupport (지원 섹션)

문의 이메일 mailto와 개인정보 처리방침 링크. 링크 정확성이 중요하므로 TDD 대상.

**Files:**
- Create: `src/app/(main)/apps/ralli/_components/ralli-support.tsx`
- Test: `src/app/(main)/apps/ralli/_components/ralli-support.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_components/ralli-support.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { RalliSupport } from './ralli-support';

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

describe('RalliSupport', () => {
  it('mailto 링크가 지원 이메일을 가리킨다', () => {
    render(<RalliSupport email="qlrogo91lp@gmail.com" />);
    const mailto = screen.getByRole('link', { name: /qlrogo91lp@gmail.com/i });
    expect(mailto).toHaveAttribute('href', 'mailto:qlrogo91lp@gmail.com');
  });

  it('개인정보 처리방침 링크가 /apps/ralli/privacy를 가리킨다', () => {
    render(<RalliSupport email="qlrogo91lp@gmail.com" />);
    const privacy = screen.getByRole('link', { name: /Privacy Policy/i });
    expect(privacy).toHaveAttribute('href', '/apps/ralli/privacy');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm run test:run -- src/app/\(main\)/apps/ralli/_components/ralli-support.test.tsx`
Expected: FAIL ("Cannot find module './ralli-support'")

- [ ] **Step 3: 컴포넌트 구현**

`src/app/(main)/apps/ralli/_components/ralli-support.tsx`:

```tsx
import Link from 'next/link';

type Props = {
  email: string;
};

export function RalliSupport({ email }: Props) {
  return (
    <section className="border-t border-white/10 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-2xl font-bold">Need help?</h2>
        <p className="mt-3 text-white/70">
          Questions, bug reports, or feedback are always welcome.
        </p>
        <a
          href={`mailto:${email}`}
          className="mt-4 inline-block text-lg font-semibold text-lime-400 hover:underline"
        >
          {email}
        </a>
        <div className="mt-8 text-sm text-white/50">
          <Link href="/apps/ralli/privacy" className="hover:text-white/80 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm run test:run -- src/app/\(main\)/apps/ralli/_components/ralli-support.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-support.tsx" "src/app/(main)/apps/ralli/_components/ralli-support.test.tsx"
git commit -m "feat: RalliSupport — 문의 이메일·개인정보 링크"
```

---

### Task 4: RalliHero (프레젠테이션)

아이콘·이름·태그라인·CTA. 외부 의존성 없는 순수 컴포넌트. E2E에서 검증하므로 별도 단위 테스트 없음.

**Files:**
- Create: `src/app/(main)/apps/ralli/_components/ralli-hero.tsx`

- [ ] **Step 1: 컴포넌트 구현**

`src/app/(main)/apps/ralli/_components/ralli-hero.tsx`:

```tsx
import Image from 'next/image';
import { RalliCtaButton } from './ralli-cta-button';

type Props = {
  name: string;
  tagline: string;
  subtitle: string;
  iconSrc: string;
  appStoreUrl: string;
};

export function RalliHero({ name, tagline, subtitle, iconSrc, appStoreUrl }: Props) {
  return (
    <section className="py-20 text-center">
      <div className="mx-auto max-w-3xl px-4">
        <Image
          src={iconSrc}
          alt={`${name} app icon`}
          width={112}
          height={112}
          className="mx-auto rounded-[22px] shadow-lg"
          priority
        />
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{name}</h1>
        <p className="mt-4 text-xl font-medium text-lime-400">{tagline}</p>
        <p className="mt-2 text-white/60">{subtitle}</p>
        <div className="mt-8">
          <RalliCtaButton appStoreUrl={appStoreUrl} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-hero.tsx"
git commit -m "feat: RalliHero — 아이콘·태그라인·CTA"
```

---

### Task 5: RalliFeatureSection (프레젠테이션)

헤드라인 + 불릿 + 이미지 1개 섹션. 짝수/홀수 인덱스로 이미지·텍스트 좌우 배치를 교차한다.

**Files:**
- Create: `src/app/(main)/apps/ralli/_components/ralli-feature-section.tsx`

- [ ] **Step 1: 컴포넌트 구현**

`src/app/(main)/apps/ralli/_components/ralli-feature-section.tsx`:

```tsx
import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RalliFeature } from '../_utils/ralli-content';

type Props = {
  feature: RalliFeature;
  index: number;
};

export function RalliFeatureSection({ feature, index }: Props) {
  const isReversed = index % 2 === 1;

  return (
    <section className="border-t border-white/10 py-16">
      <div
        className={cn(
          'mx-auto flex max-w-4xl flex-col items-center gap-10 px-4 md:flex-row',
          isReversed && 'md:flex-row-reverse',
        )}
      >
        <div className="flex-1">
          <h2 className="text-2xl font-bold sm:text-3xl">{feature.heading}</h2>
          <ul className="mt-6 space-y-3">
            {feature.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-white/70">
                <Check size={18} className="mt-1 shrink-0 text-lime-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-1 justify-center gap-4">
          {feature.images.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className={cn(
                'h-auto rounded-2xl',
                img.kind === 'ios' ? 'w-full max-w-[180px]' : 'w-full max-w-[150px]',
              )}
              sizes="(max-width: 768px) 45vw, 180px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

> `cn`은 기존 프로젝트 유틸(`@/lib/utils`)이다. 컴포넌트 규칙(`component.md`)상 조건부 클래스는 `cn()`으로 처리한다.

- [ ] **Step 2: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-feature-section.tsx"
git commit -m "feat: RalliFeatureSection — 기능 소개 섹션"
```

---

### Task 6: RalliScreenshotGallery (프레젠테이션)

iOS·Watch 스크린샷을 종류별로 그룹화해 가로 스크롤로 표시.

**Files:**
- Create: `src/app/(main)/apps/ralli/_components/ralli-screenshot-gallery.tsx`

- [ ] **Step 1: 컴포넌트 구현**

`src/app/(main)/apps/ralli/_components/ralli-screenshot-gallery.tsx`:

```tsx
import Image from 'next/image';
import type { RalliImage } from '../_utils/ralli-content';

type Props = {
  screenshots: RalliImage[];
};

export function RalliScreenshotGallery({ screenshots }: Props) {
  const iosShots = screenshots.filter((s) => s.kind === 'ios');
  const watchShots = screenshots.filter((s) => s.kind === 'watch');

  return (
    <section className="border-t border-white/10 py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">See it in action</h2>

        <h3 className="mt-10 text-sm font-semibold uppercase tracking-wide text-white/50">
          iPhone
        </h3>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
          {iosShots.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="h-auto w-[180px] shrink-0 rounded-2xl"
              sizes="180px"
            />
          ))}
        </div>

        <h3 className="mt-10 text-sm font-semibold uppercase tracking-wide text-white/50">
          Apple Watch
        </h3>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
          {watchShots.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="h-auto w-[160px] shrink-0 rounded-2xl"
              sizes="160px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-screenshot-gallery.tsx"
git commit -m "feat: RalliScreenshotGallery — 스크린샷 갤러리"
```

---

### Task 7: 랜딩/지원 페이지 조합 (page.tsx)

다크 톤 컨테이너에 Hero·기능 섹션·갤러리·지원 섹션을 조합. 메타데이터 포함.

**Files:**
- Create: `src/app/(main)/apps/ralli/page.tsx`

- [ ] **Step 1: 페이지 구현**

`src/app/(main)/apps/ralli/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import { ralliMeta, ralliFeatures, ralliScreenshots } from './_utils/ralli-content';
import { RalliHero } from './_components/ralli-hero';
import { RalliFeatureSection } from './_components/ralli-feature-section';
import { RalliScreenshotGallery } from './_components/ralli-screenshot-gallery';
import { RalliSupport } from './_components/ralli-support';

export const metadata: Metadata = {
  title: `${ralliMeta.name} — Tennis Score | ${SITE_NAME}`,
  description: 'Ralli — a wrist-first tennis score & workout companion for Apple Watch and iPhone.',
};

export default function RalliPage() {
  return (
    <div className="bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Apps
        </Link>
      </div>

      <RalliHero
        name={ralliMeta.name}
        tagline={ralliMeta.tagline}
        subtitle={ralliMeta.subtitle}
        iconSrc={ralliMeta.iconSrc}
        appStoreUrl={ralliMeta.appStoreUrl}
      />

      {ralliFeatures.map((feature, index) => (
        <RalliFeatureSection key={feature.id} feature={feature} index={index} />
      ))}

      <RalliScreenshotGallery screenshots={ralliScreenshots} />

      <RalliSupport email={ralliMeta.supportEmail} />

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {ralliMeta.name}
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 개발 서버에서 렌더 확인**

Run: `npm run dev` 후 브라우저로 `http://localhost:3000/apps/ralli` 접속.
Expected: 다크 배경에 Hero·기능 4섹션·갤러리·지원 섹션이 표시되고, 검은 배경 스크린샷이 자연스럽게 녹아든다. "Coming soon to the App Store" 배지 노출. 이미지 모두 로드.

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(main)/apps/ralli/page.tsx"
git commit -m "feat: Ralli 랜딩·지원 페이지 조합"
```

---

### Task 8: 개인정보 처리방침 페이지

SwiftData + CloudKit 기준 영문 정적 텍스트.

**Files:**
- Create: `src/app/(main)/apps/ralli/privacy/page.tsx`

- [ ] **Step 1: 페이지 구현**

`src/app/(main)/apps/ralli/privacy/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import { ralliMeta } from '../_utils/ralli-content';

export const metadata: Metadata = {
  title: `Privacy Policy — ${ralliMeta.name} | ${SITE_NAME}`,
  description: 'Privacy Policy for the Ralli tennis score app.',
};

export default function RalliPrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/apps/ralli"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Ralli
      </Link>

      <article className="prose mt-8 max-w-none">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Effective date:</strong> May 28, 2026
        </p>
        <p>
          Ralli (&ldquo;the app&rdquo;) respects your privacy. This policy explains what data the
          app handles and how.
        </p>

        <h2>Data stored on your device and iCloud</h2>
        <p>
          Your match records (scores, sets, and dates) are stored on your device using SwiftData and
          synced to your personal, private iCloud account through Apple CloudKit so they stay in
          sync across your own devices. This data is managed by Apple, and the developer cannot
          access it.
        </p>

        <h2>HealthKit</h2>
        <p>
          With your permission, Ralli reads and writes workout sessions, heart rate, active energy
          (calories), and workout duration through Apple HealthKit, solely to record your tennis
          matches as workouts. HealthKit data is never used for advertising or marketing, and is
          never shared with third parties.
        </p>

        <h2>Data we do not collect</h2>
        <p>
          Ralli does not send any data to developer-operated servers. There are no analytics SDKs,
          no third-party tracking, no advertising, and no account sign-up. The app uses only your
          Apple ID-based iCloud.
        </p>

        <h2>Children</h2>
        <p>
          Ralli is not directed at children under 13 and does not knowingly collect personal
          information from them.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The effective date above will change
          accordingly.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={`mailto:${ralliMeta.supportEmail}`}>{ralliMeta.supportEmail}</a>.
        </p>
      </article>
    </div>
  );
}
```

> `.prose` 클래스는 기존 글 상세 스타일(`src/styles/prose.css`)을 재사용한다. 사이트 테마(라이트/다크)를 그대로 따른다 — 처리방침은 읽기 문서이므로 다크 고정이 불필요하다.

- [ ] **Step 2: 개발 서버에서 렌더 확인**

Run: `http://localhost:3000/apps/ralli/privacy` 접속.
Expected: 처리방침 본문 전체 표시, 상단 "Ralli" 뒤로가기 링크, 하단 Contact 이메일 mailto 동작.

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(main)/apps/ralli/privacy/page.tsx"
git commit -m "feat: Ralli 개인정보 처리방침 페이지"
```

---

### Task 9: E2E 테스트 (페이지·내비게이션)

**Files:**
- Create: `e2e/ralli.spec.ts`

- [ ] **Step 1: E2E 테스트 작성**

`e2e/ralli.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('랜딩 페이지가 핵심 요소를 렌더한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await expect(page.getByRole('heading', { name: 'Ralli', level: 1 })).toBeVisible();
  await expect(page.getByText('Tennis scores, right on your wrist.')).toBeVisible();
  await expect(page.getByText('Coming soon to the App Store')).toBeVisible();
  await expect(page.getByRole('link', { name: /qlrogo91lp@gmail.com/i })).toBeVisible();
});

test('개인정보 처리방침으로 이동한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL('/apps/ralli/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
});

test('Apps 목록에서 Ralli 카드로 진입하면 커스텀 페이지가 열린다', async ({ page }) => {
  await page.goto('/apps');

  await page.getByRole('link', { name: /Ralli/ }).click();
  await expect(page).toHaveURL('/apps/ralli');
  await expect(page.getByRole('heading', { name: 'Ralli', level: 1 })).toBeVisible();
});
```

- [ ] **Step 2: E2E 실행 (통과 확인)**

Run: `npm run test:e2e -- ralli`
Expected: 3개 테스트 모두 PASS

- [ ] **Step 3: 커밋**

```bash
git add e2e/ralli.spec.ts
git commit -m "test: Ralli 페이지·내비게이션 E2E"
```

---

### Task 10: 최종 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 단위 테스트**

Run: `npm run test:run`
Expected: 신규 테스트 포함 전부 PASS

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 에러 0

- [ ] **Step 3: 프로덕션 빌드 (정적 생성 확인)**

Run: `npm run build`
Expected: 성공. `/apps/ralli`, `/apps/ralli/privacy`가 정적(○ 또는 ●)으로 생성됨.

- [ ] **Step 4: 최종 시각 확인**

`/apps/ralli`, `/apps/ralli/privacy`를 데스크톱·모바일 뷰포트에서 확인: 이미지 로드, 반응형 레이아웃, mailto·privacy 링크 동작, 다크 배경에 스크린샷 자연스러움.

---

## Self-Review

**Spec coverage 점검:**
- 라우팅(정적 세그먼트 우선, apps-data 유지) → Task 1, 7 ✓
- 이미지 호스팅 `public/ralli/` → Task 1 ✓
- App Store 링크 상수 분기 → Task 1(상수), Task 2(분기) ✓
- 다크 테마 고정 → Task 7(`bg-black text-white`) ✓
- Hero / 기능 4섹션 / 갤러리 / 지원 / 푸터 → Task 4·5·6·3·7 ✓
- 톤 가이드(영문 카피, 부정 어휘 없음) → Task 1 콘텐츠 ✓
- 개인정보 처리방침(SwiftData+CloudKit, HealthKit, 비수집, Contact) → Task 8 ✓
- 메타데이터/SEO → Task 7·8 ✓
- 검증(build/lint/dev) → Task 10 ✓

**Placeholder scan:** 모든 코드 블록에 실제 구현·테스트 코드 포함. TBD/TODO 없음.

**Type consistency:** `RalliImage`(src/alt/kind/width/height), `RalliFeature`(id/heading/bullets/images), `ralliMeta`(name/tagline/subtitle/iconSrc/supportEmail/appStoreUrl) — Task 1 정의가 Task 4~9 사용처와 일치. `RalliCtaButton` props `appStoreUrl`, `RalliSupport` props `email` 일관.

**비범위(YAGNI):** 다국어·테마 토글·캐러셀 라이브러리·apps-data 스키마 확장 제외 — spec과 일치.
