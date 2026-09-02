# Ralli 랜딩 A 시안 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/apps/ralli`를 다크 · 스크롤 연동 몰입형 랜딩(A 시안)으로 전면 교체한다.

**Architecture:** 설계 문서 [`2026-08-12-ralli-landing-a-design.md`](../specs/2026-08-12-ralli-landing-a-design.md)를 따른다. 시안의 명령형 `rAF` 루프를 framer-motion의 `useScroll`/`useTransform`으로 재구성하고, 세로 구간 하나를 `_areas/*.area.tsx` 하나에 대응시킨다. 순수 함수(`_utils`)와 훅(`_hooks`)을 먼저 만들고, 재사용 조각(`_components`·`_actions`) → 영역(`_areas`) → 조립(`page.tsx`) 순으로 쌓는다. `(main)` 레이아웃과 공용 `Header`는 유지한다.

**Tech Stack:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript strict, Tailwind CSS v4, framer-motion 12.42.0 (기존 의존성), Vitest + @testing-library/react, Playwright

## Global Constraints

모든 태스크의 요구사항에 아래가 암묵적으로 포함된다.

- **Tailwind v4 문법 사용** — `max-w-[var(--x)]` ❌ → `max-w-(--x)` ✅ / `bg-gradient-to-*` ❌ → `bg-linear-to-*` ✅ / `aspect-[980/362]` ❌ → `aspect-980/362` ✅. 구문법도 경고 없이 컴파일되므로 자동 검출되지 않는다 (`.claude/rules/coding-conventions.md`).
- **커밋 메시지는 gitmoji 사용**. 예: `✨`, `♻️`, `🎨`, `✅`, `🔥`
- **컴포넌트 규칙** — 파일명 kebab-case, 함수명 PascalCase, props 타입은 `type Props = {}`, 조건부 클래스는 `cn()` (`@/lib/utils`)
- **Import 규칙** — React hook은 named import (`import { useState } from 'react'`). `React.useState`·`import * as React` 금지
- **lucide-react 아이콘은 `size` 속성으로 크기 지정** (`className="w-4 h-4"` 금지)
- **파일 확장자 규칙** — `_areas`·`_components`·`_actions`는 `.tsx`, `_utils`·`_hooks`는 `.ts`
- **네이밍** — `_areas`는 `*.area.tsx`, `_actions`는 `*.action.tsx`, `_hooks`는 `use*.ts` camelCase, `_utils`·`_components`는 kebab-case
- **정확한 색상값** (시안에서 그대로 옮김)
  - `--color-ralli-bg`: `#07100b`
  - `--color-ralli-fg`: `#f2f5f0`
  - `--color-ralli-lime`: `#c8ff3d`
  - `--color-ralli-green`: `#34c759`
- **정확한 상수값**
  - 히어로 글자 방향 계수: `[-1.7, -0.85, 0, 0.85, 1.7]`, 비산 폭 `58vw` (모바일 동일)
  - 스코어 시퀀스: `['0', '15', '30', '40', 'GAME']`, 진행도 계수 `5.2`
  - pin 스텝 계수: `3.02`
  - `useSpring` 설정: `{ stiffness: 90, damping: 22, restDelta: 0.0005 }`
  - 스탯 카운트업 목표값: `642` kcal / `148` bpm / `87` min
  - 마스크: `radial-gradient(ellipse 62% 74% at 50% 50%, #000 42%, transparent 84%)`
- **App Store URL**: `https://apps.apple.com/us/app/ralli/id6449350578`
- `ralliMeta`의 `name`·`iconSrc`·`subtitle`·`appStoreUrl`·`supportEmail` 키는 **삭제 금지** — `privacy/page.tsx`와 `ralli-json-ld.tsx`가 참조한다
- 각 태스크 종료 시 `npm run lint` 0 errors, `npm run test:run` 전체 통과 유지

## 시작 전: 브랜치 생성

스펙·플랜 문서는 `develop`에 커밋되어 있다. 여기서부터는 구현 코드이므로 브랜치를 만든다.

```bash
git checkout develop
git pull
git checkout -b feature/ralli-landing-a
```

## File Structure

| 파일                                    | 책임                                                         | 태스크 |
| --------------------------------------- | ------------------------------------------------------------ | ------ |
| `src/app/globals.css`                   | `@theme`에 ralli 색상 토큰 4종 등록                          | 1      |
| `src/styles/ralli.css`                  | 마스크 클래스 · 마퀴/bob keyframes · reduced-motion 무효화   | 1      |
| `_components/ralli-shot.tsx`            | 마스크 적용 `next/image` 래퍼. 모든 스크린샷의 단일 진입점   | 1      |
| `_utils/ralli-motion.ts`                | 순수 함수 — `clamp` · `mapRange` · `scoreAt` · `stepIndexAt` | 2      |
| `_utils/ralli-content.ts`               | 시안 카피 · 이미지 · 스탯 · 룰 칩 전량                       | 3      |
| `_hooks/useSectionProgress.ts`          | `useScroll` + `useSpring` + reduced-motion 판정              | 4      |
| `_hooks/useIsMobile.ts`                 | `matchMedia` 기반 뷰포트 판정 (Replay 갤러리 전용)           | 4      |
| `_actions/reveal.action.tsx`            | 범용 `whileInView` 래퍼                                      | 4      |
| `_components/ralli-section-label.tsx`   | `01 — ON THE COURT` 라벨                                     | 5      |
| `_components/ralli-marquee.tsx`         | CSS 무한 루프 마퀴                                           | 5      |
| `_components/ralli-court-svg.tsx`       | 히어로 코트 라인 SVG (정적 마크업)                           | 5      |
| `_areas/hero.area.tsx`                  | 280vh sticky 히어로 전체                                     | 6      |
| `_areas/watch.area.tsx`                 | 300vh pin 섹션 3-step                                        | 7      |
| `_areas/workout.area.tsx`               | 카운트업 스탯 + 이미지 2장                                   | 8      |
| `_areas/replay.area.tsx`                | 가로 드리프트 / 모바일 네이티브 스크롤                       | 9      |
| `_areas/rules.area.tsx`                 | 04 룰 칩 섹션                                                | 10     |
| `_actions/ralli-section-nav.action.tsx` | 앵커 pill 내비 + 모바일 하단 CTA 바                          | 11     |
| `_areas/final-cta.area.tsx`             | 최종 CTA (시안 푸터)                                         | 12     |
| `page.tsx`                              | 서버 컴포넌트 — metadata + 영역 조립                         | 13     |
| `e2e/ralli.spec.ts`                     | E2E 재작성 (기존 단언이 전부 깨진다)                         | 13     |

### `_areas`에 무엇이 들어가고 무엇이 안 들어가는가

`page-folder.md`에 신설된 `_areas` 규칙을 따른다 — **`page.tsx`가 직접 조립하는 세로 구간 하나**가 `*.area.tsx` 하나에 대응한다.

| 대상                           | 위치                                    | 이유                                                     |
| ------------------------------ | --------------------------------------- | -------------------------------------------------------- |
| 히어로 · 01~04 섹션 · 최종 CTA | `_areas/*.area.tsx`                     | 여러 조각을 묶어 화면 한 구간을 완성한다                 |
| 마퀴                           | `_components/ralli-marquee.tsx`         | 조각 하나로 끝나는 단일 위젯. `page.tsx`가 직접 렌더한다 |
| 앵커 내비 · 모바일 하단 CTA 바 | `_actions/ralli-section-nav.action.tsx` | 화면에 고정된 오버레이라 세로 구간이 아니다              |
| `Reveal` 래퍼                  | `_actions/reveal.action.tsx`            | 영역 여러 곳에서 재사용한다                              |

`_areas`에는 서버 데이터 페칭(`_queries`·`_services` 호출)과 전역 상태(zustand·tanstack-query)를 두지 않는다. 이 랜딩은 콘텐츠가 전부 `_utils/ralli-content.ts` 정적 import라 자연히 만족한다. Area가 갖는 상태는 스크롤 진행도와 활성 스텝 인덱스뿐이며 영역 밖으로 나가지 않는 뷰 로컬 상태다.

영역 파일 안에서만 쓰이는 하위 컴포넌트(`HeroLetter`, `StatCard`)는 **같은 파일 안에 private으로 둔다**. 둘 다 부모의 `progress` MotionValue나 뷰포트 상태에 묶여 있어 밖으로 빼면 재사용 가능한 것처럼 보이지만 실제로는 그렇지 않다.

영역 파일은 `_areas/` 한 단계 깊이라 `../_hooks`·`../_utils`·`../_components`·`../_actions` 상대 경로가 그대로 유효하다.

---

### Task 1: 스타일 토큰 · 마스크 · `RalliShot`

시안의 모든 스크린샷은 동일한 radial-gradient 마스크를 쓴다. 이 마스크를 40여 곳에 반복하지 않도록 단일 컴포넌트로 봉인하고, 색상 토큰을 먼저 등록한다.

**Files:**

- Create: `src/styles/ralli.css`
- Create: `src/app/(main)/apps/ralli/_components/ralli-shot.tsx`
- Modify: `src/app/globals.css`
- Test: `src/app/(main)/apps/ralli/_components/ralli-shot.test.tsx`

**Interfaces:**

- Consumes: `RalliImage` 타입 (기존 `_utils/ralli-content.ts`에 이미 존재)
- Produces: `RalliShot({ image, className?, sizes?, priority? })` — 모든 후속 섹션이 스크린샷 렌더에 사용한다. `.ralli-shot-mask` 클래스를 항상 적용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_components/ralli-shot.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import type { RalliImage } from '../_utils/ralli-content';
import { RalliShot } from './ralli-shot';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    sizes,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    sizes?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
    />
  ),
}));

const image: RalliImage = {
  src: '/ralli/watch-match-global.png',
  alt: 'Ralli match score on Apple Watch',
  kind: 'watch',
  width: 422,
  height: 514,
};

describe('RalliShot', () => {
  it('마스크 클래스를 항상 적용한다', () => {
    render(<RalliShot image={image} />);
    expect(screen.getByRole('img')).toHaveClass('ralli-shot-mask');
  });

  it('추가 className을 받아도 마스크 클래스를 유지한다', () => {
    render(<RalliShot image={image} className="h-[64vh]" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('ralli-shot-mask');
    expect(img).toHaveClass('h-[64vh]');
  });

  it('src·alt·intrinsic 크기를 그대로 전달한다', () => {
    render(<RalliShot image={image} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/ralli/watch-match-global.png');
    expect(img).toHaveAttribute('alt', 'Ralli match score on Apple Watch');
    expect(img).toHaveAttribute('width', '422');
    expect(img).toHaveAttribute('height', '514');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- ralli-shot
```

Expected: FAIL — `Failed to resolve import "./ralli-shot"`

- [ ] **Step 3: `src/styles/ralli.css` 생성**

```css
.ralli-shot-mask {
  -webkit-mask-image: radial-gradient(
    ellipse 62% 74% at 50% 50%,
    #000 42%,
    transparent 84%
  );
  mask-image: radial-gradient(
    ellipse 62% 74% at 50% 50%,
    #000 42%,
    transparent 84%
  );
}

@keyframes ralli-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes ralli-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.ralli-marquee-track {
  animation: ralli-marquee 26s linear infinite;
}

.ralli-bob {
  animation: ralli-bob 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ralli-marquee-track,
  .ralli-bob {
    animation: none;
  }
}
```

- [ ] **Step 4: `globals.css`에 토큰 등록 + import 추가**

파일 상단 `@theme inline {` 블록 **바로 앞**(4~6행 부근)에 별도 `@theme` 블록을 추가한다. 늦게 `@import`되는 파일 안의 `@theme`은 Tailwind가 유틸리티를 생성하기 전에 수집된다는 보장이 없으므로 반드시 여기에 둔다.

```css
@theme {
  --color-ralli-bg: #07100b;
  --color-ralli-fg: #f2f5f0;
  --color-ralli-lime: #c8ff3d;
  --color-ralli-green: #34c759;
}
```

파일 하단, 기존 `@import '../styles/highlight.css';` 다음 줄에 추가한다.

```css
@import '../styles/ralli.css';
```

- [ ] **Step 5: `ralli-shot.tsx` 구현**

```tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { RalliImage } from '../_utils/ralli-content';

type Props = {
  image: RalliImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function RalliShot({
  image,
  className,
  sizes,
  priority = false,
}: Props) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={
        sizes ??
        (image.kind === 'watch'
          ? '(max-width: 768px) 40vw, 26vw'
          : '(max-width: 768px) 60vw, 30vw')
      }
      priority={priority}
      className={cn('ralli-shot-mask w-auto object-contain', className)}
    />
  );
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- ralli-shot
```

Expected: PASS (3 tests)

- [ ] **Step 7: 토큰이 실제 유틸리티를 만드는지 확인**

```bash
npm run build
```

Expected: 빌드 성공. 실패 시 `@theme` 블록 위치를 `globals.css` 상단으로 옮겼는지 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add src/styles/ralli.css src/app/globals.css "src/app/(main)/apps/ralli/_components/ralli-shot.tsx" "src/app/(main)/apps/ralli/_components/ralli-shot.test.tsx"
git commit -m "🎨 Ralli 랜딩 색상 토큰·스크린샷 마스크 기반 추가"
```

---

### Task 2: 모션 순수 함수 `ralli-motion.ts`

시안이 rAF 루프 안에서 인라인으로 계산하던 값들을 순수 함수로 분리한다. 이 태스크가 유일하게 완전한 TDD가 가능한 지점이므로 경계값을 촘촘히 덮는다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_utils/ralli-motion.ts`
- Test: `src/app/(main)/apps/ralli/_utils/ralli-motion.test.ts`

**Interfaces:**

- Produces:
  - `clamp(value: number, min: number, max: number): number`
  - `mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number`
  - `scoreSequence: readonly ['0', '15', '30', '40', 'GAME']`
  - `RalliScore` = `(typeof scoreSequence)[number]`
  - `scoreAt(progress: number): RalliScore` — Task 6이 사용
  - `stepIndexAt(progress: number, stepCount?: number): number` — Task 7이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_utils/ralli-motion.test.ts`:

```ts
import { clamp, mapRange, scoreAt, stepIndexAt } from './ralli-motion';

describe('clamp', () => {
  it('범위 안의 값은 그대로 반환한다', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('범위를 벗어나면 경계값으로 자른다', () => {
    expect(clamp(-3, 0, 1)).toBe(0);
    expect(clamp(9, 0, 1)).toBe(1);
  });
});

describe('mapRange', () => {
  it('입력 범위를 출력 범위로 선형 변환한다', () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBe(50);
    expect(mapRange(0.25, 0, 1, 10, 20)).toBe(12.5);
  });

  it('입력이 범위를 벗어나면 출력도 잘린다', () => {
    expect(mapRange(-1, 0, 1, 0, 100)).toBe(0);
    expect(mapRange(2, 0, 1, 0, 100)).toBe(100);
  });

  it('입력 범위 폭이 0이면 outMin을 반환한다', () => {
    expect(mapRange(5, 3, 3, 7, 99)).toBe(7);
  });
});

describe('scoreAt', () => {
  it('진행도에 따라 테니스 스코어 시퀀스를 반환한다', () => {
    expect(scoreAt(0)).toBe('0');
    expect(scoreAt(0.1)).toBe('0');
    expect(scoreAt(0.2)).toBe('15');
    expect(scoreAt(0.4)).toBe('30');
    expect(scoreAt(0.6)).toBe('40');
    expect(scoreAt(0.8)).toBe('GAME');
  });

  it('진행도 1에서도 마지막 값을 넘지 않는다', () => {
    expect(scoreAt(1)).toBe('GAME');
    expect(scoreAt(1.5)).toBe('GAME');
  });

  it('음수 진행도는 첫 값으로 처리한다', () => {
    expect(scoreAt(-0.4)).toBe('0');
  });
});

describe('stepIndexAt', () => {
  it('진행도를 3구간 인덱스로 나눈다', () => {
    expect(stepIndexAt(0)).toBe(0);
    expect(stepIndexAt(0.3)).toBe(0);
    expect(stepIndexAt(0.4)).toBe(1);
    expect(stepIndexAt(0.7)).toBe(2);
  });

  it('진행도 1에서 마지막 인덱스를 넘지 않는다', () => {
    expect(stepIndexAt(1)).toBe(2);
    expect(stepIndexAt(2)).toBe(2);
  });

  it('stepCount를 바꿔도 마지막 인덱스를 넘지 않는다', () => {
    expect(stepIndexAt(1, 5)).toBe(4);
    expect(stepIndexAt(0, 5)).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- ralli-motion
```

Expected: FAIL — `Failed to resolve import "./ralli-motion"`

- [ ] **Step 3: 구현**

`src/app/(main)/apps/ralli/_utils/ralli-motion.ts`:

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

export const scoreSequence = ['0', '15', '30', '40', 'GAME'] as const;

export type RalliScore = (typeof scoreSequence)[number];

/** 시안 원본: seq[Math.min(seq.length - 1, Math.floor(p * 5.2))] */
export function scoreAt(progress: number): RalliScore {
  const index = Math.floor(clamp(progress, 0, 1) * 5.2);
  return scoreSequence[Math.min(scoreSequence.length - 1, index)];
}

/** 시안 원본: Math.min(2, Math.floor(p * 3.02)) */
export function stepIndexAt(progress: number, stepCount = 3): number {
  const index = Math.floor(clamp(progress, 0, 1) * (stepCount + 0.02));
  return Math.min(stepCount - 1, index);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- ralli-motion
```

Expected: PASS (11 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_utils/ralli-motion.ts" "src/app/(main)/apps/ralli/_utils/ralli-motion.test.ts"
git commit -m "✨ Ralli 스크롤 모션 순수 함수 추가"
```

---

### Task 3: 콘텐츠 재작성 `ralli-content.ts`

시안 카피를 전량 옮기고 섹션별 데이터 모델을 정의한다. 기존 `ralliFeatures`·`ralliScreenshots`는 제거하되 `ralliMeta`의 외부 참조 키는 보존한다.

**Files:**

- Modify: `src/app/(main)/apps/ralli/_utils/ralli-content.ts` (전면 재작성)
- Test: `src/app/(main)/apps/ralli/_utils/ralli-content.test.ts` (전면 재작성)

**Interfaces:**

- Produces: `ralliMeta` · `ralliNavLinks` · `ralliMarqueeItems` · `ralliHeroLetters` · `ralliHeroShot` · `ralliWatchSection` · `ralliWorkoutSection` · `ralliReplaySection` · `ralliRulesSection` · `ralliFinalCta`, 타입 `RalliImage` · `RalliStep` · `RalliStat` · `RalliNote`
- **삭제**: `ralliFeatures`, `ralliScreenshots`, `ralliMeta.tagline`, `RalliFeature` 타입
- **보존 필수**: `ralliMeta.name` · `.iconSrc` · `.subtitle` · `.appStoreUrl` · `.supportEmail`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_utils/ralli-content.test.ts` (기존 내용 전체 교체):

```ts
import {
  type RalliImage,
  ralliFinalCta,
  ralliHeroLetters,
  ralliHeroShot,
  ralliMeta,
  ralliNavLinks,
  ralliReplaySection,
  ralliRulesSection,
  ralliWatchSection,
  ralliWorkoutSection,
} from './ralli-content';

const allImages: RalliImage[] = [
  ralliHeroShot,
  ...ralliWatchSection.steps.map((s) => s.image),
  ...ralliWorkoutSection.images,
  ...ralliReplaySection.gallery,
  ...ralliRulesSection.images,
];

describe('ralli-content', () => {
  it('모든 이미지 src는 /ralli/ 경로이고 alt가 비어있지 않다', () => {
    for (const img of allImages) {
      expect(img.src.startsWith('/ralli/')).toBe(true);
      expect(img.alt.length).toBeGreaterThan(0);
    }
  });

  it('모든 이미지의 intrinsic 크기가 양수다', () => {
    for (const img of allImages) {
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
    }
  });

  it('외부 참조 키를 보존한다', () => {
    expect(ralliMeta.name).toBe('Ralli');
    expect(ralliMeta.iconSrc).toBe('/ralli/icon1.png');
    expect(ralliMeta.subtitle.length).toBeGreaterThan(0);
    expect(ralliMeta.appStoreUrl).toBe(
      'https://apps.apple.com/us/app/ralli/id6449350578'
    );
    expect(ralliMeta.supportEmail).toBe('qlrogo91lp@gmail.com');
  });

  it('섹션 라벨 넘버링이 01부터 04까지 연속한다', () => {
    const labels = [
      ralliWatchSection.label,
      ralliWorkoutSection.label,
      ralliReplaySection.label,
      ralliRulesSection.label,
    ];
    expect(labels.map((l) => l.slice(0, 2))).toEqual(['01', '02', '03', '04']);
  });

  it('앵커 내비 href가 실제 섹션 id와 일치한다', () => {
    const sectionIds = [
      ralliWatchSection.id,
      ralliWorkoutSection.id,
      ralliReplaySection.id,
    ];
    expect(ralliNavLinks.map((l) => l.href)).toEqual(
      sectionIds.map((id) => `#${id}`)
    );
  });

  it('히어로 글자는 RALLI 5자다', () => {
    expect(ralliHeroLetters.join('')).toBe('RALLI');
  });

  it('watch 섹션은 3스텝이고 각 스텝이 제목·본문·이미지를 갖는다', () => {
    expect(ralliWatchSection.steps).toHaveLength(3);
    for (const step of ralliWatchSection.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
      expect(step.image.src.length).toBeGreaterThan(0);
    }
  });

  it('workout 스탯은 3개이고 목표값이 양수다', () => {
    expect(ralliWorkoutSection.stats).toHaveLength(3);
    for (const stat of ralliWorkoutSection.stats) {
      expect(stat.value).toBeGreaterThan(0);
      expect(stat.unit.length).toBeGreaterThan(0);
    }
  });

  it('replay 갤러리는 5장, 설명 노트는 3개다', () => {
    expect(ralliReplaySection.gallery).toHaveLength(5);
    expect(ralliReplaySection.notes).toHaveLength(3);
  });

  it('룰 칩은 6개이고 첫 칩이 기본 강조 대상이다', () => {
    expect(ralliRulesSection.chips).toHaveLength(6);
    expect(ralliRulesSection.chips[0]).toBe('4 games');
  });

  it('최종 CTA 카피가 존재한다', () => {
    expect(ralliFinalCta.heading).toBe('Go win the next one.');
    expect(ralliFinalCta.body.length).toBeGreaterThan(0);
  });

  it('사용하지 않는 watch-home 자산을 참조하지 않는다', () => {
    expect(allImages.some((img) => img.src.includes('watch-home'))).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- ralli-content
```

Expected: FAIL — `ralliNavLinks` 등 미정의 export

- [ ] **Step 3: 구현**

`src/app/(main)/apps/ralli/_utils/ralli-content.ts` (전체 교체):

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
  taglineLines: ['Tennis scores,', 'right on your wrist.'],
  subtitle:
    'Score, track, and replay every match — without ever pulling out your phone.',
  platforms: 'Apple Watch · iPhone',
  iconSrc: '/ralli/icon1.png',
  supportEmail: 'qlrogo91lp@gmail.com',
  appStoreUrl: 'https://apps.apple.com/us/app/ralli/id6449350578',
} as const;

export const ralliHeroLetters = ['R', 'A', 'L', 'L', 'I'] as const;

export const ralliHeroShot = watchImage(
  '/ralli/watch-match-global.png',
  'Ralli match score on Apple Watch'
);

export const ralliMarqueeItems = [
  '15 — 0',
  'HEALTHKIT SYNCED',
  '40 — 30',
  'NO ADS',
  'DEUCE',
  'COMPLICATION READY',
  'TIEBREAK',
] as const;

export type RalliStep = {
  id: string;
  title: string;
  body: string;
  image: RalliImage;
};

export const ralliWatchSection = {
  id: 'watch',
  label: '01 — ON THE COURT',
  heading: 'All on your wrist.',
  steps: [
    {
      id: 'score',
      title: 'Score without your phone',
      body: 'Pick a format, tap to score, check results — entirely from Apple Watch.',
      image: watchImage(
        '/ralli/watch-match-global.png',
        'Ralli match score on Apple Watch'
      ),
    },
    {
      id: 'complication',
      title: 'One tap from your watch face',
      body: 'Add the complication and start a match the second you step on court.',
      image: watchImage(
        '/ralli/watch-complication-global.png',
        'Ralli complication on the Apple Watch face'
      ),
    },
    {
      id: 'live',
      title: 'Live on the Lock Screen',
      body: 'The current score stays visible in Dynamic Island and Live Activities.',
      image: iosImage(
        '/ralli/ios-live-global.png',
        'Ralli Live Activity on the iPhone Lock Screen'
      ),
    },
  ] satisfies RalliStep[],
};

export type RalliStatTone = 'lime' | 'green' | 'fg';

export type RalliStat = {
  id: string;
  value: number;
  unit: string;
  caption: string;
  tone: RalliStatTone;
};

export const ralliWorkoutSection = {
  id: 'workout',
  label: '02 — HEALTH',
  heading: 'A match is a workout — logged automatically.',
  body: 'Every match runs as a HealthKit workout session, so your rings close while you play.',
  stats: [
    {
      id: 'energy',
      value: 642,
      unit: 'kcal',
      caption: 'Active energy, tracked per match',
      tone: 'lime',
    },
    {
      id: 'heart-rate',
      value: 148,
      unit: 'bpm',
      caption: 'Average heart rate across sets',
      tone: 'green',
    },
    {
      id: 'court-time',
      value: 87,
      unit: 'min',
      caption: 'Court time, straight to Apple Fitness',
      tone: 'fg',
    },
  ] satisfies RalliStat[],
  images: [
    watchImage(
      '/ralli/watch-workout-global.png',
      'Ralli workout metrics on Apple Watch'
    ),
    iosImage(
      '/ralli/ios-workout-global.png',
      'Ralli workout metrics on iPhone'
    ),
  ],
};

export type RalliNote = {
  id: string;
  title: string;
  body: string;
};

export const ralliReplaySection = {
  id: 'iphone',
  label: '03 — REPLAY',
  heading: 'Every match, back on your iPhone.',
  gallery: [
    iosImage(
      '/ralli/ios-summary-global.png',
      'Ralli match summary stats on iPhone'
    ),
    iosImage('/ralli/ios-match-global.png', 'Ralli match score on iPhone'),
    iosImage(
      '/ralli/connectivity-global.png',
      'Ralli on iPhone and Apple Watch together'
    ),
    iosImage(
      '/ralli/ios-mode-global.png',
      'Ralli match format selection on iPhone'
    ),
    iosImage(
      '/ralli/ios-live-global.png',
      'Ralli Live Activity on the iPhone Lock Screen'
    ),
  ],
  notes: [
    {
      id: 'set-detail',
      title: 'Set-by-set detail',
      body: 'Scores, kcal, and workout time for every set you played.',
    },
    {
      id: 'calendar',
      title: 'A calendar that fills itself',
      body: 'Your tennis days stack up automatically, no logging required.',
    },
    {
      id: 'stats',
      title: 'Monthly & lifetime stats',
      body: "See how much you've actually played this season.",
    },
  ] satisfies RalliNote[],
};

export const ralliRulesSection = {
  id: 'rules',
  label: '04 — YOUR RULES',
  heading: 'Play by your own rules.',
  body: 'Club night, league, or a quick hit — start with the format you actually play.',
  chips: ['4 games', '5 games', '6 games', 'No-ad', 'No-tie', 'Tiebreak'],
  images: [
    watchImage(
      '/ralli/watch-mode-global.png',
      'Ralli match format on Apple Watch'
    ),
    iosImage(
      '/ralli/ios-mode-global.png',
      'Ralli match format selection on iPhone'
    ),
  ],
};

export const ralliNavLinks = [
  { href: `#${ralliWatchSection.id}`, label: 'Watch' },
  { href: `#${ralliWorkoutSection.id}`, label: 'Workout' },
  { href: `#${ralliReplaySection.id}`, label: 'iPhone' },
] as const;

export const ralliFinalCta = {
  heading: 'Go win the next one.',
  body: 'Free on the App Store for Apple Watch and iPhone.',
} as const;
```

> **`as const`와 `satisfies`를 섞지 않는다.** `satisfies RalliStep[]`가 붙은 배열을 가진 객체에 `as const`를 함께 걸면, const 어서션이 readonly 튜플을 만들어 `satisfies`의 mutable 배열 타입 검사와 충돌한다. 섹션 객체 네 개(`ralliWatchSection`·`ralliWorkoutSection`·`ralliReplaySection`·`ralliRulesSection`)는 `satisfies`만 쓰고 `as const`를 붙이지 않는다. 반면 `ralliMeta`·`ralliHeroLetters`·`ralliMarqueeItems`·`ralliNavLinks`·`ralliFinalCta`는 `satisfies` 없이 `as const`만 쓰므로 그대로 둔다.

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- ralli-content
```

Expected: PASS (12 tests)

- [ ] **Step 5: 기존 참조가 깨졌는지 확인**

```bash
npx tsc --noEmit
```

Expected: `page.tsx`에서 `ralliFeatures`·`ralliScreenshots`·`ralliMeta.tagline` 미존재 에러. **이는 예상된 결과이며 Task 13에서 해소된다.** 다른 파일(`privacy/page.tsx`, `ralli-json-ld.tsx`)에서는 에러가 나오면 안 된다 — 나온다면 `ralliMeta` 키 보존을 확인한다.

- [ ] **Step 6: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_utils/ralli-content.ts" "src/app/(main)/apps/ralli/_utils/ralli-content.test.ts"
git commit -m "♻️ Ralli 콘텐츠를 A 시안 카피·섹션 모델로 재작성"
```

---

### Task 4: 스크롤 훅과 `Reveal` 래퍼

모든 섹션이 공유하는 스크롤 진행도 훅과 등장 애니메이션 래퍼를 만든다. reduced-motion 판정을 여기 한 곳에 모아 각 섹션이 `isStatic` 불리언만 보게 한다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_hooks/useSectionProgress.ts`
- Create: `src/app/(main)/apps/ralli/_hooks/useIsMobile.ts`
- Create: `src/app/(main)/apps/ralli/_actions/reveal.action.tsx`
- Test: `src/app/(main)/apps/ralli/_actions/reveal.test.tsx`

**Interfaces:**

- Consumes: framer-motion `useScroll` · `useSpring` · `useReducedMotion` · `useInView`
- Produces:
  - `useSectionProgress(offset?, smooth?)` → `{ ref: RefObject<HTMLDivElement | null>; progress: MotionValue<number>; isStatic: boolean }` — Task 6~10, 12가 사용
  - `useIsMobile(query?)` → `boolean` — Task 9가 사용
  - `Reveal({ children, className?, delay? })` — Task 8, 9, 10, 12가 사용

`offset` 파라미터 타입은 framer-motion이 `ScrollOffset`을 export하지 않으므로 `UseScrollOptions['offset']`으로 받는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_actions/reveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Reveal } from './reveal.action';

describe('Reveal', () => {
  it('children을 렌더한다', () => {
    render(
      <Reveal>
        <p>등장 대상</p>
      </Reveal>
    );
    expect(screen.getByText('등장 대상')).toBeInTheDocument();
  });

  it('className을 전달한다', () => {
    render(
      <Reveal className="max-w-160">
        <p>본문</p>
      </Reveal>
    );
    expect(screen.getByText('본문').parentElement).toHaveClass('max-w-160');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- reveal
```

Expected: FAIL — `Failed to resolve import "./reveal.action"`

- [ ] **Step 3: `useSectionProgress.ts` 구현**

```ts
'use client';

import { type RefObject, useRef } from 'react';
import {
  type MotionValue,
  type UseScrollOptions,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';

type SectionProgress = {
  ref: RefObject<HTMLDivElement | null>;
  progress: MotionValue<number>;
  isStatic: boolean;
};

/**
 * 섹션 하나의 스크롤 진행도(0~1)를 반환한다.
 * 시안의 `prog(el) = -rect.top / (height - vh)` + 수동 lerp를 대체한다.
 */
export function useSectionProgress(
  offset: UseScrollOptions['offset'] = ['start start', 'end end'],
  smooth = true
): SectionProgress {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    restDelta: 0.0005,
  });

  return {
    ref,
    progress: smooth ? smoothed : scrollYProgress,
    isStatic: Boolean(prefersReducedMotion),
  };
}
```

> `useReducedMotion()`의 반환 타입은 `boolean | null`이므로 `Boolean()`으로 좁힌다.

- [ ] **Step 4: `useIsMobile.ts` 구현**

```ts
'use client';

import { useEffect, useState } from 'react';

/** Replay 갤러리가 스크롤 연동 드리프트와 네이티브 가로 스크롤을 분기하는 데 사용한다. */
export function useIsMobile(query = '(max-width: 767px)'): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);

    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
```

- [ ] **Step 5: `reveal.action.tsx` 구현**

```tsx
'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** 시안의 `[data-reveal]` 매 프레임 계산을 IntersectionObserver 1회 발화로 대체한다. */
export function Reveal({ children, className, delay = 0 }: Props) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- reveal
```

Expected: PASS (2 tests)

- [ ] **Step 7: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_hooks" "src/app/(main)/apps/ralli/_actions/reveal.action.tsx" "src/app/(main)/apps/ralli/_actions/reveal.test.tsx"
git commit -m "✨ Ralli 스크롤 진행도 훅과 Reveal 래퍼 추가"
```

---

### Task 5: 공용 순수 조각

섹션 라벨 · 마퀴 · 코트 SVG를 순수 컴포넌트로 만든다. 셋 다 클라이언트 로직이 없어 서버에서 렌더된다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_components/ralli-section-label.tsx`
- Create: `src/app/(main)/apps/ralli/_components/ralli-marquee.tsx`
- Create: `src/app/(main)/apps/ralli/_components/ralli-court-svg.tsx`
- Test: `src/app/(main)/apps/ralli/_components/ralli-marquee.test.tsx`

**Interfaces:**

- Consumes: `ralliMarqueeItems` (Task 3)
- Produces:
  - `RalliSectionLabel({ children })` — Task 7, 8, 9, 10이 사용
  - `RalliMarquee({ items })` — Task 13이 사용
  - `RalliCourtSvg({ className })` — Task 6이 `motion.div`로 감싼다

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/apps/ralli/_components/ralli-marquee.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { RalliMarquee } from './ralli-marquee';

describe('RalliMarquee', () => {
  it('끊김 없는 루프를 위해 항목을 두 벌 렌더한다', () => {
    render(<RalliMarquee items={['DEUCE', 'NO ADS']} />);
    expect(screen.getAllByText('DEUCE')).toHaveLength(2);
    expect(screen.getAllByText('NO ADS')).toHaveLength(2);
  });

  it('보조 정보이므로 스크린 리더에서 숨긴다', () => {
    const { container } = render(<RalliMarquee items={['DEUCE']} />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- ralli-marquee
```

Expected: FAIL — `Failed to resolve import "./ralli-marquee"`

- [ ] **Step 3: `ralli-section-label.tsx` 구현**

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

export function RalliSectionLabel({ children, className }: Props) {
  return (
    <p
      className={cn(
        'mb-3.5 text-[11px] font-bold tracking-[0.22em] text-ralli-lime',
        className
      )}
    >
      {children}
    </p>
  );
}
```

- [ ] **Step 4: `ralli-marquee.tsx` 구현**

```tsx
import { Fragment } from 'react';

type Props = {
  items: readonly string[];
};

export function RalliMarquee({ items }: Props) {
  const track = (
    <div className="flex w-1/2 flex-none gap-11 text-[13px] font-semibold tracking-[0.14em] text-ralli-fg/30">
      {items.map((item) => (
        <Fragment key={item}>
          <span>{item}</span>
          <span className="text-ralli-lime">•</span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="relative z-5 overflow-hidden border-t border-ralli-fg/7 bg-ralli-bg py-4.5"
    >
      <div className="ralli-marquee-track flex w-[200%] whitespace-nowrap">
        {track}
        {track}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: `ralli-court-svg.tsx` 구현**

```tsx
type Props = {
  className?: string;
};

export function RalliCourtSvg({ className }: Props) {
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={className}
    >
      <g fill="none" stroke="rgba(200,255,61,0.30)" strokeWidth="1.6">
        <path d="M120 560 L680 560 L560 200 L240 200 Z" />
        <path d="M170 420 L630 420" />
        <path d="M255 310 L545 310" />
        <path d="M400 200 L400 560" />
        <path d="M240 200 L560 200" />
      </g>
      <path
        d="M100 200 L700 200"
        stroke="rgba(242,245,240,0.28)"
        strokeWidth="2.5"
        strokeDasharray="4 7"
      />
    </svg>
  );
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm run test:run -- ralli-marquee
```

Expected: PASS (2 tests)

- [ ] **Step 7: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-section-label.tsx" "src/app/(main)/apps/ralli/_components/ralli-marquee.tsx" "src/app/(main)/apps/ralli/_components/ralli-court-svg.tsx" "src/app/(main)/apps/ralli/_components/ralli-marquee.test.tsx"
git commit -m "✨ Ralli 섹션 라벨·마퀴·코트 SVG 순수 컴포넌트 추가"
```

---

### Task 6: 히어로 영역 (`hero.area.tsx`)

시안에서 가장 복잡한 구간이다. `RALLI` 5글자 비산 · 워치 확대 · 코트 3D 회전 · 글로우 · 태그라인/스코어 등장 · 스코어 시퀀스 · 스크롤 힌트를 한 sticky 컨테이너에서 처리한다.

글자별 `useTransform`은 `.map()` 콜백 안에서 호출하면 `react-hooks/rules-of-hooks` 위반이므로, 글자 하나를 자식 컴포넌트(`HeroLetter`)로 분리해 각자 훅을 호출하게 한다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_areas/hero.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/hero.area.test.tsx`

**Interfaces:**

- Consumes: `useSectionProgress` (Task 4), `scoreAt` · `RalliScore` (Task 2), `ralliHeroLetters` · `ralliHeroShot` · `ralliMeta` (Task 3), `RalliCourtSvg` (Task 5), `RalliShot` (Task 1), `RalliCtaButton` (기존)
- Produces: `HeroArea()` — Task 13이 `page.tsx`에서 사용. props 없음(콘텐츠를 직접 import).

- [ ] **Step 1: 실패하는 테스트 작성**

jsdom에는 레이아웃이 없어 `useScroll`이 진행도를 만들지 못한다. 정적 구조와 접근성만 검증한다.

`src/app/(main)/apps/ralli/_areas/hero.area.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => <img src={src} alt={alt} className={className} />,
}));

describe('HeroArea', () => {
  it('h1으로 태그라인을 렌더한다', () => {
    render(<HeroArea />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Tennis scores,');
    expect(heading).toHaveTextContent('right on your wrist.');
  });

  it('App Store CTA를 렌더한다', () => {
    render(<HeroArea />);
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/ralli/id6449350578'
    );
  });

  it('장식용 RALLI 글자는 스크린 리더에서 숨긴다', () => {
    const { container } = render(<HeroArea />);
    expect(container.querySelector('[data-ralli-wordmark]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('초기 스코어는 0이다', () => {
    render(<HeroArea />);
    expect(screen.getByTestId('ralli-hero-score')).toHaveTextContent('0');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- hero.area
```

Expected: FAIL — `Failed to resolve import "./hero.area"`

- [ ] **Step 3: 구현**

```tsx
'use client';

import { useState } from 'react';
import {
  type MotionValue,
  motion,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { RalliCourtSvg } from '../_components/ralli-court-svg';
import { RalliCtaButton } from '../_components/ralli-cta-button';
import { RalliShot } from '../_components/ralli-shot';
import { useSectionProgress } from '../_hooks/useSectionProgress';
import {
  ralliHeroLetters,
  ralliHeroShot,
  ralliMeta,
} from '../_utils/ralli-content';
import { type RalliScore, scoreAt } from '../_utils/ralli-motion';

const LETTER_DIRECTIONS = [-1.7, -0.85, 0, 0.85, 1.7];
const LETTER_SPREAD_VW = 58;

const letterClassName =
  'text-[min(16.5vw,186px)] font-extrabold leading-[0.8] tracking-[-0.06em]';

type HeroLetterProps = {
  char: string;
  direction: number;
  progress: MotionValue<number>;
  isAccent: boolean;
  isStatic: boolean;
};

function HeroLetter({
  char,
  direction,
  progress,
  isAccent,
  isStatic,
}: HeroLetterProps) {
  const x = useTransform(
    progress,
    [0, 0.84],
    ['0vw', `${direction * LETTER_SPREAD_VW}vw`]
  );
  const y = useTransform(progress, [0, 0.84], ['0vh', '-6vh']);
  const scale = useTransform(progress, [0, 0.84], [1, 1.26]);
  const opacity = useTransform(progress, [0, 0.56], [1, 0]);
  const filter = useTransform(
    progress,
    [0, 0.84],
    ['blur(0px)', 'blur(3.5px)']
  );

  const className = cn(
    letterClassName,
    isAccent ? 'text-ralli-lime' : 'text-ralli-fg'
  );

  if (isStatic) {
    return <span className={className}>{char}</span>;
  }

  return (
    <motion.span style={{ x, y, scale, opacity, filter }} className={className}>
      {char}
    </motion.span>
  );
}

export function HeroArea() {
  const { ref, progress, isStatic } = useSectionProgress([
    'start start',
    'end end',
  ]);
  const [score, setScore] = useState<RalliScore>('0');

  useMotionValueEvent(progress, 'change', (value) => {
    setScore(scoreAt(value));
  });

  const watchScale = useTransform(progress, [0, 0.84], [0.62, 1.2]);
  const watchRotate = useTransform(progress, [0, 0.84], [-4, 0]);
  const watchY = useTransform(progress, [0, 0.84], ['0vh', '-4vh']);
  const watchOpacity = useTransform(progress, [0.84, 1], [1, 0]);

  const courtRotateX = useTransform(progress, [0, 0.84], [56, 36]);
  const courtY = useTransform(progress, [0, 0.84], ['10vh', '-20vh']);
  const courtScale = useTransform(progress, [0, 0.84], [1, 1.5]);
  const courtOpacity = useTransform(progress, [0, 0.84], [0.15, 0.65]);

  const glowScale = useTransform(progress, [0, 0.84], [0.7, 1.6]);

  const copyOpacity = useTransform(
    progress,
    [0.14, 0.36, 0.86, 1],
    [0, 1, 1, 0]
  );
  const copyY = useTransform(progress, [0.14, 0.36], [40, 0]);

  const scoreOpacity = useTransform(
    progress,
    [0.2, 0.4, 0.86, 1],
    [0, 1, 1, 0]
  );
  const hintOpacity = useTransform(progress, [0, 0.17], [1, 0]);

  return (
    <div
      ref={ref}
      className={cn('relative', isStatic ? 'h-auto' : 'h-[180vh] md:h-[280vh]')}
    >
      <div
        className={cn(
          'grid place-items-center overflow-hidden',
          isStatic
            ? 'relative min-h-[80vh] py-24'
            : 'sticky top-14 h-[calc(100vh-3.5rem)]'
        )}
      >
        <motion.div
          aria-hidden="true"
          style={isStatic ? undefined : { scale: glowScale }}
          className="absolute size-[120vh] rounded-full bg-[radial-gradient(circle,rgba(200,255,61,0.16)_0%,rgba(52,199,89,0.06)_40%,transparent_68%)] blur-[10px]"
        />

        <motion.div
          aria-hidden="true"
          style={
            isStatic
              ? { opacity: 0.5 }
              : {
                  rotateX: courtRotateX,
                  y: courtY,
                  scale: courtScale,
                  opacity: courtOpacity,
                  transformPerspective: 900,
                }
          }
          className="absolute w-[150%] max-w-400"
        >
          <RalliCourtSvg className="w-full" />
        </motion.div>

        <div
          data-ralli-wordmark
          aria-hidden="true"
          className="pointer-events-none absolute flex -translate-y-[20vh] items-center gap-[min(2vw,26px)]"
        >
          {ralliHeroLetters.map((char, index) => (
            <HeroLetter
              key={`${char}-${index}`}
              char={char}
              direction={LETTER_DIRECTIONS[index]}
              progress={progress}
              isAccent={index === ralliHeroLetters.length - 1}
              isStatic={isStatic}
            />
          ))}
        </div>

        <motion.div
          style={
            isStatic
              ? undefined
              : {
                  scale: watchScale,
                  rotate: watchRotate,
                  y: watchY,
                  opacity: watchOpacity,
                }
          }
          className="relative z-3"
        >
          <RalliShot
            image={ralliHeroShot}
            priority
            sizes="(max-width: 768px) 44vh, 64vh"
            className="h-[44vh] max-h-140 md:h-[64vh]"
          />
        </motion.div>

        <motion.div
          style={isStatic ? undefined : { opacity: scoreOpacity }}
          className="pointer-events-none absolute right-[max(6vw,32px)] top-[18%] z-4 text-right md:top-1/2"
        >
          <p className="mb-1.5 text-xs font-bold tracking-[0.22em] text-ralli-fg/45">
            GAME POINT
          </p>
          <p
            data-testid="ralli-hero-score"
            className={cn(
              'font-extrabold leading-[0.85] tracking-[-0.05em] text-ralli-lime tabular-nums',
              score === 'GAME'
                ? 'text-[min(7vw,84px)]'
                : 'text-[min(11vw,132px)]'
            )}
          >
            {score}
          </p>
        </motion.div>

        <motion.div
          style={isStatic ? undefined : { opacity: copyOpacity, y: copyY }}
          className="absolute bottom-[10vh] left-[max(6vw,32px)] right-[max(6vw,32px)] z-4 max-w-100 md:bottom-[14vh] md:right-auto"
        >
          <h1 className="mb-3 text-[clamp(26px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.035em] text-pretty">
            {ralliMeta.taglineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mb-5.5 max-w-85 text-base leading-normal text-ralli-fg/60">
            {ralliMeta.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <RalliCtaButton appStoreUrl={ralliMeta.appStoreUrl} />
            <span className="text-[13px] text-ralli-fg/40">
              {ralliMeta.platforms}
            </span>
          </div>
        </motion.div>

        {!isStatic && (
          <motion.div
            aria-hidden="true"
            style={{ opacity: hintOpacity }}
            className="ralli-bob absolute bottom-6.5 left-1/2 z-5 flex -translate-x-1/2 flex-col items-center gap-1.75"
          >
            <span className="text-[10.5px] font-bold tracking-[0.2em] text-ralli-fg/38">
              SCROLL
            </span>
            <span className="h-6.5 w-px bg-linear-to-b from-ralli-lime/90 to-transparent" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

`cn`을 사용하므로 파일 상단 import에 `import { cn } from '@/lib/utils';`를 추가한다.

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- hero.area
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/hero.area.tsx" "src/app/(main)/apps/ralli/_areas/hero.area.test.tsx"
git commit -m "✨ Ralli 히어로 스크롤 시퀀스 구현"
```

---

### Task 7: 01 On the court 영역 (`watch.area.tsx`)

300vh 동안 sticky 상태로 3개 스텝을 순회하며 이미지를 교체하고 해당 스텝 카드를 강조한다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_areas/watch.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/watch.area.test.tsx`

**Interfaces:**

- Consumes: `useSectionProgress` (Task 4), `stepIndexAt` (Task 2), `ralliWatchSection` (Task 3), `RalliSectionLabel` (Task 5), `RalliShot` (Task 1)
- Produces: `WatchArea()` — Task 13이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { render, screen } from '@testing-library/react';
import { WatchArea } from './watch.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('WatchArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<WatchArea />);
    expect(
      screen.getByRole('heading', { name: 'All on your wrist.' })
    ).toBeInTheDocument();
    expect(screen.getByText('01 — ON THE COURT')).toBeInTheDocument();
  });

  it('3개 스텝을 모두 렌더한다', () => {
    render(<WatchArea />);
    expect(screen.getByText('Score without your phone')).toBeInTheDocument();
    expect(
      screen.getByText('One tap from your watch face')
    ).toBeInTheDocument();
    expect(screen.getByText('Live on the Lock Screen')).toBeInTheDocument();
  });

  it('앵커 이동을 위해 섹션 id를 노출한다', () => {
    const { container } = render(<WatchArea />);
    expect(container.querySelector('#watch')).toBeInTheDocument();
  });

  it('초기 활성 스텝은 첫 번째다', () => {
    render(<WatchArea />);
    expect(screen.getByTestId('ralli-step-score')).toHaveAttribute(
      'data-active',
      'true'
    );
    expect(screen.getByTestId('ralli-step-live')).toHaveAttribute(
      'data-active',
      'false'
    );
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- watch.area
```

Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

```tsx
'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { useSectionProgress } from '../_hooks/useSectionProgress';
import { ralliWatchSection } from '../_utils/ralli-content';
import { stepIndexAt } from '../_utils/ralli-motion';

export function WatchArea() {
  const { ref, progress, isStatic } = useSectionProgress([
    'start start',
    'end end',
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(progress, 'change', (value) => {
    setActiveIndex(stepIndexAt(value, ralliWatchSection.steps.length));
  });

  return (
    <section
      id={ralliWatchSection.id}
      ref={ref}
      className={cn(
        'relative bg-ralli-bg',
        isStatic ? 'h-auto py-24' : 'h-[240vh] md:h-[300vh]'
      )}
    >
      <div
        className={cn(
          'grid items-center gap-10 px-[max(6vw,32px)]',
          isStatic
            ? 'relative grid-cols-1 md:grid-cols-2'
            : 'sticky top-14 h-[calc(100vh-3.5rem)] grid-cols-1 md:grid-cols-2'
        )}
      >
        <div className="max-w-120">
          <RalliSectionLabel>{ralliWatchSection.label}</RalliSectionLabel>
          <h2 className="mb-7.5 text-[clamp(30px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em] text-pretty">
            {ralliWatchSection.heading}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {ralliWatchSection.steps.map((step, index) => {
              const isActive = isStatic || index === activeIndex;
              return (
                <li
                  key={step.id}
                  data-testid={`ralli-step-${step.id}`}
                  data-active={isActive}
                  className={cn(
                    'rounded-2xl border px-4.5 py-4 transition-all duration-350',
                    isActive
                      ? 'border-ralli-lime/35 bg-ralli-lime/10 opacity-100'
                      : 'border-ralli-fg/8 bg-transparent opacity-40'
                  )}
                >
                  <p className="mb-1 text-[17px] font-semibold tracking-[-0.2px]">
                    {step.title}
                  </p>
                  <p className="text-[14.5px] leading-[1.45] text-ralli-fg/55">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative grid h-[42vh] place-items-center md:h-[78vh]">
          <div
            aria-hidden="true"
            className="absolute aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,rgba(52,199,89,0.16),transparent_66%)]"
          />
          {ralliWatchSection.steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="absolute"
              animate={{
                opacity: isStatic
                  ? index === 0
                    ? 1
                    : 0
                  : index === activeIndex
                    ? 1
                    : 0,
                scale: index === activeIndex ? 1 : 0.94,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <RalliShot
                image={step.image}
                className="max-h-[38vh] md:max-h-[58vh]"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- watch.area
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/watch.area.tsx" "src/app/(main)/apps/ralli/_areas/watch.area.test.tsx"
git commit -m "✨ Ralli 01 On the court pin 섹션 구현"
```

---

### Task 8: 02 Health 영역 (`workout.area.tsx`)

스탯 3장의 숫자를 뷰포트 진입 시 1회 카운트업하고, 워크아웃 이미지 2장을 배치한다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_areas/workout.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/workout.area.test.tsx`

**Interfaces:**

- Consumes: `ralliWorkoutSection` (Task 3), `Reveal` (Task 4), `RalliSectionLabel` (Task 5), `RalliShot` (Task 1)
- Produces: `WorkoutArea()` — Task 13이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { render, screen } from '@testing-library/react';
import { WorkoutArea } from './workout.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('WorkoutArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<WorkoutArea />);
    expect(
      screen.getByRole('heading', {
        name: 'A match is a workout — logged automatically.',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('02 — HEALTH')).toBeInTheDocument();
  });

  it('스탯 3개의 단위와 설명을 렌더한다', () => {
    render(<WorkoutArea />);
    expect(screen.getByText('kcal')).toBeInTheDocument();
    expect(screen.getByText('bpm')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(
      screen.getByText('Active energy, tracked per match')
    ).toBeInTheDocument();
  });

  it('앵커 이동을 위해 섹션 id를 노출한다', () => {
    const { container } = render(<WorkoutArea />);
    expect(container.querySelector('#workout')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- workout.area
```

Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Reveal } from '../_actions/reveal.action';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { type RalliStat, ralliWorkoutSection } from '../_utils/ralli-content';

const toneClassName: Record<RalliStat['tone'], string> = {
  lime: 'text-ralli-lime',
  green: 'text-ralli-green',
  fg: 'text-ralli-fg',
};

type StatCardProps = {
  stat: RalliStat;
};

function StatCard({ stat }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplayed(stat.value);
      return;
    }

    const controls = animate(0, stat.value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (value) => setDisplayed(Math.round(value)),
    });

    return () => controls.stop();
  }, [isInView, prefersReducedMotion, stat.value]);

  return (
    <div
      ref={ref}
      className="rounded-[22px] border border-ralli-fg/8 bg-ralli-fg/4 p-6.5"
    >
      <p className="flex items-baseline gap-1">
        <span
          className={cn(
            'text-[52px] font-extrabold tracking-[-0.04em] tabular-nums',
            toneClassName[stat.tone]
          )}
        >
          {displayed}
        </span>
        <span className="text-lg font-semibold text-ralli-fg/50">
          {stat.unit}
        </span>
      </p>
      <p className="mt-1.5 text-[14.5px] text-ralli-fg/55">{stat.caption}</p>
    </div>
  );
}

export function WorkoutArea() {
  return (
    <section
      id={ralliWorkoutSection.id}
      className="relative bg-linear-to-b from-ralli-bg via-[#0B1710] to-ralli-bg px-[max(6vw,32px)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-295">
        <Reveal className="mb-14 max-w-160">
          <RalliSectionLabel>{ralliWorkoutSection.label}</RalliSectionLabel>
          <h2 className="mb-3.5 text-[clamp(30px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em] text-pretty">
            {ralliWorkoutSection.heading}
          </h2>
          <p className="text-[17px] leading-normal text-ralli-fg/58">
            {ralliWorkoutSection.body}
          </p>
        </Reveal>

        <div className="mb-6 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {ralliWorkoutSection.stats.map((stat, index) => (
            <Reveal key={stat.id} delay={index * 0.08}>
              <StatCard stat={stat} />
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {ralliWorkoutSection.images.map((image) => (
            <Reveal key={image.src}>
              <div className="grid min-h-75 place-items-center rounded-[26px] border border-ralli-fg/8 bg-ralli-fg/4 p-8 md:min-h-100">
                <RalliShot image={image} className="max-h-85 max-w-full" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- workout.area
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/workout.area.tsx" "src/app/(main)/apps/ralli/_areas/workout.area.test.tsx"
git commit -m "✨ Ralli 02 Health 카운트업 스탯 섹션 구현"
```

---

### Task 9: 03 Replay 영역 (`replay.area.tsx`)

데스크톱은 스크롤 연동 가로 드리프트, 모바일은 네이티브 가로 스크롤 + `scroll-snap`. 두 방식이 같은 축에서 충돌하므로 `useIsMobile`로 분기하는 유일한 지점이다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_areas/replay.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/replay.area.test.tsx`

**Interfaces:**

- Consumes: `useSectionProgress` · `useIsMobile` (Task 4), `ralliReplaySection` (Task 3), `RalliSectionLabel` (Task 5), `RalliShot` (Task 1), `Reveal` (Task 4)
- Produces: `ReplayArea()` — Task 13이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

`matchMedia`는 jsdom에 없으므로 테스트에서 스텁한다.

```tsx
import { render, screen } from '@testing-library/react';
import { ReplayArea } from './replay.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('ReplayArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<ReplayArea />);
    expect(
      screen.getByRole('heading', { name: 'Every match, back on your iPhone.' })
    ).toBeInTheDocument();
    expect(screen.getByText('03 — REPLAY')).toBeInTheDocument();
  });

  it('갤러리 이미지 5장을 렌더한다', () => {
    render(<ReplayArea />);
    expect(screen.getAllByRole('img')).toHaveLength(5);
  });

  it('설명 노트 3개를 렌더한다', () => {
    render(<ReplayArea />);
    expect(screen.getByText('Set-by-set detail')).toBeInTheDocument();
    expect(
      screen.getByText('A calendar that fills itself')
    ).toBeInTheDocument();
    expect(screen.getByText('Monthly & lifetime stats')).toBeInTheDocument();
  });

  it('앵커 이동을 위해 섹션 id를 노출한다', () => {
    const { container } = render(<ReplayArea />);
    expect(container.querySelector('#iphone')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- replay.area
```

Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

```tsx
'use client';

import { motion, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Reveal } from '../_actions/reveal.action';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { useIsMobile } from '../_hooks/useIsMobile';
import { useSectionProgress } from '../_hooks/useSectionProgress';
import { ralliReplaySection } from '../_utils/ralli-content';

/** 데스크톱 드리프트 이동 거리. 갤러리 전체 폭에서 뷰포트를 뺀 만큼 왼쪽으로 민다. */
const DRIFT_VW = -55;

export function ReplayArea() {
  const { ref, progress, isStatic } = useSectionProgress(
    ['start end', 'end start'],
    false
  );
  const isMobile = useIsMobile();
  const driftX = useTransform(progress, [0, 1], ['0vw', `${DRIFT_VW}vw`]);

  const useNativeScroll = isMobile || isStatic;

  return (
    <section
      id={ralliReplaySection.id}
      ref={ref}
      className="relative overflow-hidden bg-ralli-bg py-24 md:py-28"
    >
      <Reveal className="mx-auto mb-13 max-w-295 px-[max(6vw,32px)]">
        <RalliSectionLabel>{ralliReplaySection.label}</RalliSectionLabel>
        <h2 className="max-w-155 text-[clamp(30px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em] text-pretty">
          {ralliReplaySection.heading}
        </h2>
      </Reveal>

      <div
        className={cn(
          useNativeScroll && 'snap-x snap-mandatory overflow-x-auto pb-4'
        )}
      >
        <motion.div
          style={useNativeScroll ? undefined : { x: driftX }}
          className="flex gap-5.5 px-[max(6vw,32px)]"
        >
          {ralliReplaySection.gallery.map((image) => (
            <div key={image.src} className="flex-none snap-center">
              <RalliShot
                image={image}
                sizes="(max-width: 768px) 55vw, 22vw"
                className="h-95 md:h-130"
              />
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mx-auto mt-13 grid max-w-295 grid-cols-1 gap-9 px-[max(6vw,32px)] md:grid-cols-3">
        {ralliReplaySection.notes.map((note, index) => (
          <Reveal key={note.id} delay={index * 0.08}>
            <p className="mb-1.25 text-[16.5px] font-semibold">{note.title}</p>
            <p className="text-[14.5px] leading-[1.45] text-ralli-fg/55">
              {note.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- replay.area
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/replay.area.tsx" "src/app/(main)/apps/ralli/_areas/replay.area.test.tsx"
git commit -m "✨ Ralli 03 Replay 갤러리 구현"
```

---

### Task 10: 04 Your rules 영역 (`rules.area.tsx`)

**Files:**

- Create: `src/app/(main)/apps/ralli/_areas/rules.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/rules.area.test.tsx`

**Interfaces:**

- Consumes: `ralliRulesSection` (Task 3), `Reveal` (Task 4), `RalliSectionLabel` (Task 5), `RalliShot` (Task 1)
- Produces: `RulesArea()` — Task 13이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { render, screen } from '@testing-library/react';
import { RulesArea } from './rules.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('RulesArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<RulesArea />);
    expect(
      screen.getByRole('heading', { name: 'Play by your own rules.' })
    ).toBeInTheDocument();
    expect(screen.getByText('04 — YOUR RULES')).toBeInTheDocument();
  });

  it('룰 칩 6개를 렌더한다', () => {
    render(<RulesArea />);
    for (const chip of [
      '4 games',
      '5 games',
      '6 games',
      'No-ad',
      'No-tie',
      'Tiebreak',
    ]) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }
  });

  it('첫 칩만 강조 스타일을 갖는다', () => {
    render(<RulesArea />);
    expect(screen.getByText('4 games')).toHaveClass('bg-ralli-lime');
    expect(screen.getByText('5 games')).not.toHaveClass('bg-ralli-lime');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- rules.area
```

Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

```tsx
'use client';

import { cn } from '@/lib/utils';
import { Reveal } from '../_actions/reveal.action';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { ralliRulesSection } from '../_utils/ralli-content';

export function RulesArea() {
  return (
    <section
      id={ralliRulesSection.id}
      className="bg-ralli-bg px-[max(6vw,32px)] pb-24 md:pb-32"
    >
      <div className="mx-auto grid max-w-295 grid-cols-1 items-center gap-12 rounded-[34px] border border-ralli-fg/9 bg-linear-150 from-ralli-lime/9 via-ralli-green/5 to-transparent p-7 md:grid-cols-2 md:p-14">
        <Reveal>
          <RalliSectionLabel>{ralliRulesSection.label}</RalliSectionLabel>
          <h2 className="mb-4 text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.04em] text-pretty">
            {ralliRulesSection.heading}
          </h2>
          <p className="mb-6.5 max-w-100 text-[16.5px] leading-normal text-ralli-fg/58">
            {ralliRulesSection.body}
          </p>
          <ul className="flex flex-wrap gap-2.25">
            {ralliRulesSection.chips.map((chip, index) => (
              <li
                key={chip}
                className={cn(
                  'rounded-full px-4 py-2.25 text-[13.5px]',
                  index === 0
                    ? 'bg-ralli-lime font-bold text-ralli-bg'
                    : 'border border-ralli-fg/10 bg-ralli-fg/7 font-semibold'
                )}
              >
                {chip}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="flex items-center justify-center gap-5">
          {ralliRulesSection.images.map((image) => (
            <RalliShot
              key={image.src}
              image={image}
              className={
                image.kind === 'watch' ? 'h-60 md:h-85' : 'h-70 md:h-100'
              }
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- rules.area
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/rules.area.tsx" "src/app/(main)/apps/ralli/_areas/rules.area.test.tsx"
git commit -m "✨ Ralli 04 Your rules 섹션 구현"
```

---

### Task 11: 섹션 내비 + 모바일 하단 CTA 바

데스크톱은 공용 Header 아래 pill 앵커 내비, 모바일은 하단 고정 CTA 바. 표시 분기는 Tailwind `md:` 클래스만으로 처리한다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_actions/ralli-section-nav.action.tsx`
- Test: `src/app/(main)/apps/ralli/_actions/ralli-section-nav.test.tsx`

**Interfaces:**

- Consumes: `ralliNavLinks` · `ralliMeta` (Task 3)
- Produces: `RalliSectionNavAction()` — Task 13이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { render, screen } from '@testing-library/react';
import { RalliSectionNavAction } from './ralli-section-nav.action';

describe('RalliSectionNavAction', () => {
  it('앵커 링크 3개를 렌더한다', () => {
    render(<RalliSectionNavAction />);
    expect(screen.getByRole('link', { name: 'Watch' })).toHaveAttribute(
      'href',
      '#watch'
    );
    expect(screen.getByRole('link', { name: 'Workout' })).toHaveAttribute(
      'href',
      '#workout'
    );
    expect(screen.getByRole('link', { name: 'iPhone' })).toHaveAttribute(
      'href',
      '#iphone'
    );
  });

  it('데스크톱 내비와 모바일 하단 바 양쪽에 App Store 링크를 둔다', () => {
    render(<RalliSectionNavAction />);
    const ctas = screen.getAllByRole('link', { name: /Ralli|App Store/i });
    for (const cta of ctas) {
      expect(cta).toHaveAttribute(
        'href',
        'https://apps.apple.com/us/app/ralli/id6449350578'
      );
    }
  });

  it('내비에 접근성 레이블을 부여한다', () => {
    render(<RalliSectionNavAction />);
    expect(
      screen.getByRole('navigation', { name: 'Ralli 섹션' })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- ralli-section-nav
```

Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

```tsx
'use client';

import { ralliMeta, ralliNavLinks } from '../_utils/ralli-content';

export function RalliSectionNavAction() {
  return (
    <>
      <nav
        aria-label="Ralli 섹션"
        className="fixed left-1/2 top-17.5 z-60 hidden -translate-x-1/2 items-center gap-4.5 rounded-full border border-ralli-fg/10 bg-[rgba(16,26,19,0.62)] py-2.25 pl-4.5 pr-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-3xl backdrop-saturate-150 md:flex"
      >
        <ul className="flex gap-4 text-[13px] font-medium text-ralli-fg/62">
          {ralliNavLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="transition-colors hover:text-ralli-fg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={ralliMeta.appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-ralli-lime px-4 py-2 text-[13px] font-bold tracking-[-0.2px] text-ralli-bg transition-colors hover:bg-ralli-lime/85"
        >
          Get Ralli
        </a>
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-60 border-t border-ralli-fg/10 bg-[rgba(7,16,11,0.88)] px-4 py-3 backdrop-blur-xl md:hidden">
        <a
          href={ralliMeta.appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-full bg-ralli-lime px-6 py-3.5 text-sm font-bold text-ralli-bg"
        >
          Download on the App Store
        </a>
      </div>
    </>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- ralli-section-nav
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_actions/ralli-section-nav.action.tsx" "src/app/(main)/apps/ralli/_actions/ralli-section-nav.test.tsx"
git commit -m "✨ Ralli 섹션 앵커 내비와 모바일 하단 CTA 바 추가"
```

---

### Task 12: 최종 CTA 영역 (`final-cta.area.tsx`)

시안 푸터를 최종 CTA 섹션으로 옮긴다. **`© 2026 YJlogs` 줄은 넣지 않는다** — 공용 `Footer`가 이미 렌더한다.

**Files:**

- Create: `src/app/(main)/apps/ralli/_areas/final-cta.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/final-cta.area.test.tsx`

**Interfaces:**

- Consumes: `ralliMeta` · `ralliFinalCta` (Task 3), `Reveal` (Task 4), `RalliCtaButton` (기존)
- Produces: `FinalCtaArea()` — Task 13이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { FinalCtaArea } from './final-cta.area';

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
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('FinalCtaArea', () => {
  it('최종 CTA 카피와 App Store 버튼을 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(
      screen.getByRole('heading', { name: 'Go win the next one.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/ralli/id6449350578'
    );
  });

  it('Privacy와 Support 링크를 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/apps/ralli/privacy');
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'href',
      'mailto:qlrogo91lp@gmail.com'
    );
  });

  it('공용 Footer와 중복되는 저작권 문구를 넣지 않는다', () => {
    render(<FinalCtaArea />);
    expect(screen.queryByText(/YJlogs/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- final-cta.area
```

Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '../_actions/reveal.action';
import { RalliCtaButton } from '../_components/ralli-cta-button';
import { ralliFinalCta, ralliMeta } from '../_utils/ralli-content';

export function FinalCtaArea() {
  return (
    <section className="bg-ralli-bg px-[max(6vw,32px)] pb-24 md:pb-15">
      <Reveal className="mx-auto max-w-295 border-t border-ralli-fg/8 py-14 text-center md:py-17">
        <Image
          src={ralliMeta.iconSrc}
          alt={`${ralliMeta.name} app icon`}
          width={88}
          height={88}
          className="mx-auto mb-5.5 rounded-[22px]"
        />
        <h2 className="mb-3.5 text-[clamp(30px,4.4vw,58px)] font-extrabold leading-none tracking-[-0.045em]">
          {ralliFinalCta.heading}
        </h2>
        <p className="mb-7 text-[16.5px] text-ralli-fg/55">
          {ralliFinalCta.body}
        </p>
        <RalliCtaButton appStoreUrl={ralliMeta.appStoreUrl} />
        <div className="mt-11 flex justify-center gap-5.5 text-[13.5px] text-ralli-fg/42">
          <Link
            href="/apps/ralli/privacy"
            className="transition-colors hover:text-ralli-fg"
          >
            Privacy Policy
          </Link>
          <a
            href={`mailto:${ralliMeta.supportEmail}`}
            className="transition-colors hover:text-ralli-fg"
          >
            Support
          </a>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- final-cta.area
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/final-cta.area.tsx" "src/app/(main)/apps/ralli/_areas/final-cta.area.test.tsx"
git commit -m "✨ Ralli 최종 CTA 섹션 구현"
```

---

### Task 13: `page.tsx` 조립 · 구 컴포넌트 제거 · E2E 재작성

모든 섹션을 조립하고 더 이상 쓰지 않는 파일을 지운다. 기존 E2E는 `h1`이 `Ralli`라고 단언하는데 새 `h1`은 태그라인이므로 전부 깨진다 — 재작성한다.

**Files:**

- Modify: `src/app/(main)/apps/ralli/page.tsx` (전면 재작성)
- Delete: `_components/ralli-hero.tsx` · `ralli-feature-section.tsx` · `ralli-screenshot-gallery.tsx` · `ralli-support.tsx` · `ralli-support.test.tsx`
- Modify: `e2e/ralli.spec.ts` (전면 재작성)

**Interfaces:**

- Consumes: Task 6~12의 모든 `*Action` 컴포넌트, `RalliMarquee` (Task 5), `RalliJsonLd` (기존), `ralliMarqueeItems` · `ralliMeta` (Task 3)

- [ ] **Step 1: `page.tsx` 재작성**

```tsx
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { RalliSectionNavAction } from './_actions/ralli-section-nav.action';
import { FinalCtaArea } from './_areas/final-cta.area';
import { HeroArea } from './_areas/hero.area';
import { ReplayArea } from './_areas/replay.area';
import { RulesArea } from './_areas/rules.area';
import { WatchArea } from './_areas/watch.area';
import { WorkoutArea } from './_areas/workout.area';
import { RalliJsonLd } from './_components/ralli-json-ld';
import { RalliMarquee } from './_components/ralli-marquee';
import { ralliMarqueeItems, ralliMeta } from './_utils/ralli-content';

export const metadata: Metadata = {
  title: `${ralliMeta.name} — Tennis Score | ${SITE_NAME}`,
  description: ralliMeta.subtitle,
  alternates: {
    canonical: '/apps/ralli',
  },
  openGraph: {
    title: `${ralliMeta.name} — Tennis Score`,
    description: ralliMeta.subtitle,
    url: '/apps/ralli',
    type: 'website',
    images: [
      {
        url: ralliMeta.iconSrc,
        width: 1024,
        height: 1024,
        alt: `${ralliMeta.name} app icon`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ralliMeta.name} — Tennis Score`,
    description: ralliMeta.subtitle,
    images: [ralliMeta.iconSrc],
  },
};

export default function RalliPage() {
  return (
    <div className="dark relative overflow-x-clip bg-ralli-bg text-ralli-fg">
      <RalliJsonLd />
      <RalliSectionNavAction />

      <HeroArea />
      <RalliMarquee items={ralliMarqueeItems} />
      <WatchArea />
      <WorkoutArea />
      <ReplayArea />
      <RulesArea />
      <FinalCtaArea />
    </div>
  );
}
```

- [ ] **Step 2: 구 컴포넌트 삭제**

```bash
git rm "src/app/(main)/apps/ralli/_components/ralli-hero.tsx" \
       "src/app/(main)/apps/ralli/_components/ralli-feature-section.tsx" \
       "src/app/(main)/apps/ralli/_components/ralli-screenshot-gallery.tsx" \
       "src/app/(main)/apps/ralli/_components/ralli-support.tsx" \
       "src/app/(main)/apps/ralli/_components/ralli-support.test.tsx"
```

- [ ] **Step 3: 타입·린트·단위 테스트 전체 확인**

```bash
npx tsc --noEmit && npm run lint && npm run test:run
```

Expected: 에러 0건, 전체 테스트 PASS. Task 3 Step 5에서 예상했던 `page.tsx` 타입 에러가 여기서 해소된다.

- [ ] **Step 4: E2E 재작성**

`e2e/ralli.spec.ts` (전체 교체):

```ts
import { expect, test } from '@playwright/test';

const APP_STORE_URL = 'https://apps.apple.com/us/app/ralli/id6449350578';

test('랜딩 페이지가 4개 섹션을 모두 렌더한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'right on your wrist.'
  );
  await expect(
    page.getByRole('heading', { name: 'All on your wrist.' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'A match is a workout — logged automatically.',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Every match, back on your iPhone.' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Play by your own rules.' })
  ).toBeVisible();
});

test('모든 App Store CTA가 동일한 URL을 가리킨다', async ({ page }) => {
  await page.goto('/apps/ralli');

  const ctas = page.locator(`a[href="${APP_STORE_URL}"]`);
  expect(await ctas.count()).toBeGreaterThanOrEqual(3);
});

test('앵커 내비로 섹션에 이동한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await page
    .getByRole('navigation', { name: 'Ralli 섹션' })
    .getByRole('link', { name: 'Workout' })
    .click();
  await expect(page).toHaveURL(/#workout$/);
  await expect(page.locator('#workout')).toBeInViewport();
});

test('개인정보 처리방침으로 이동한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL('/apps/ralli/privacy');
  await expect(
    page.getByRole('heading', { name: 'Privacy Policy', level: 1 })
  ).toBeVisible();
});

test('Apps 목록에서 Ralli 카드로 진입한다', async ({ page }) => {
  await page.goto('/apps');

  await page.getByRole('link', { name: /Ralli/ }).click();
  await expect(page).toHaveURL('/apps/ralli');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'right on your wrist.'
  );
});

test.describe('모바일', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('가로 스크롤이 발생하지 않는다', async ({ page }) => {
    await page.goto('/apps/ralli');
    await page.waitForLoadState('networkidle');

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflows).toBe(false);
  });

  test('하단 고정 CTA 바가 보인다', async ({ page }) => {
    await page.goto('/apps/ralli');

    await expect(
      page.getByRole('link', { name: 'Download on the App Store' }).last()
    ).toBeVisible();
  });
});

test.describe('reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('모션을 끈 상태에서도 모든 섹션이 보인다', async ({ page }) => {
    await page.goto('/apps/ralli');

    await expect(
      page.getByRole('heading', { name: 'All on your wrist.' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Play by your own rules.' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Go win the next one.' })
    ).toBeVisible();
  });
});
```

- [ ] **Step 5: E2E 실행**

```bash
npm run test:e2e
```

Expected: 전체 PASS. 모바일 가로 스크롤 테스트가 실패하면 어떤 섹션이 넘치는지 다음으로 확인한다.

```bash
npx playwright test --debug e2e/ralli.spec.ts
```

- [ ] **Step 6: 프로덕션 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공. `/apps/ralli`가 정적 페이지(`○`)로 표시되는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "♻️ Ralli 랜딩을 A 시안으로 교체하고 구 컴포넌트 제거"
```

- [ ] **Step 8: PR 생성**

```bash
git push -u origin feature/ralli-landing-a
gh pr create --base develop --title "✨ Ralli 랜딩 A 시안 적용" --body "$(cat <<'EOF'
## 요약
`/apps/ralli`를 다크 · 스크롤 연동 몰입형 랜딩(A 시안)으로 전면 교체했다.

- 설계 문서: `docs/superpowers/specs/2026-08-12-ralli-landing-a-design.md`
- 구현 계획: `docs/superpowers/plans/2026-08-12-ralli-landing-a.md`

## 주요 변경
- 시안의 명령형 rAF 루프를 framer-motion `useScroll`/`useTransform`으로 재구성
- 세로 구간 6개를 `_areas/*.area.tsx`로 분리 (신설 폴더 룰)
- 모바일 전용 레이아웃 + 하단 고정 CTA 바 추가 (시안에는 미디어 쿼리가 없었음)
- `prefers-reduced-motion` 정적 폴백 경로 추가
- 구 컴포넌트 5개 제거

## 검증
- `npm run test:run` 전체 통과
- `npm run test:e2e` 전체 통과 (모바일 가로 스크롤 회귀 가드 포함)
- `npm run build` 성공

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 구현 중 확정할 항목

설계 문서 §9의 4개 항목이다. 재검토하지 않으면 아래 기본값대로 진행되며, 위 태스크 코드는 모두 기본값을 전제로 작성되어 있다.

| #   | 항목                    | 기본값                                    | 변경 시 영향 태스크                                      |
| --- | ----------------------- | ----------------------------------------- | -------------------------------------------------------- |
| 1   | 폰트                    | Geist 유지 (별도 작업 없음)               | 변경 시 `layout.tsx`에 `next/font/google` 추가 + Task 13 |
| 2   | Watch 이미지            | 2x 재캡처 후 `WATCH_W`/`WATCH_H` 갱신     | Task 3 (`ralli-content.ts` 상수)                         |
| 3   | 모바일 CTA              | 하단 고정 바                              | Task 11                                                  |
| 4   | `watch-home-global.png` | 콘텐츠에서 제거 (파일은 `public/`에 존치) | Task 3                                                   |

1번은 Task 6 완료 직후 히어로를 실제로 띄워 두 폰트로 비교한 뒤 정한다. 2번은 재캡처 자산을 확보하면 `_utils/ralli-content.ts`의 `WATCH_W`/`WATCH_H`만 바꾸면 되고 나머지 코드는 영향받지 않는다.

## 사람이 직접 확인해야 할 항목

- 스크롤 시퀀스의 **체감 속도** — `280vh`/`300vh`와 `useSpring` 계수는 시안 값을 그대로 옮긴 것이라, 공용 Header가 붙은 상태에서 실제로 스크롤해보고 조정이 필요할 수 있다.
- 히어로 sticky가 `top-14`로 내려간 만큼 **글자·워치·스코어의 수직 정렬**이 시안과 미세하게 다를 수 있다.
- 설계 문서 §10 — 02 Health 섹션 스탯 수치(`642` kcal / `148` bpm / `87` min)가 시안 작성자의 예시값이다. 실제 앱 화면 수치를 알면 Task 3에서 교체한다.
