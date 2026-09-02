# GolfCounter 랜딩 B 시안 적용 Implementation Plan

> **완료: 2026-08-18.** Task 0~10 전부 subagent-driven-development로 실행 완료, 최종 전체 브랜치
> 리뷰(Critical 0건 · Important 2건 → fix wave 1회로 전부 해소 · 재검토 클린)까지 마쳤다.
> 실행 중 발견·수정한 것: (1) 브리프의 `isStatic` 분기 패턴(`style={isStatic ? undefined : {...}}`)이
> reduced-motion 사용자에게 stale 인라인 스타일을 남기는 실제 접근성 버그였음을 발견해 전 area에
> plain-엘리먼트 패턴으로 수정, (2) 모바일 히어로 칩 겹침 3건(HOLES·TOTAL·reduced-motion 레이아웃)을
> 발견·수정하고 회귀 테스트로 고정, (3) `aria-hidden`이 wrapper에서 실제 `<img>`까지 전달 안 되는
> 문제를 `GolfShot`에 optional prop 추가로 해결. 상세 기록은 최종 커밋 히스토리 참고
> (`bdb0a02..284af30`, `develop` 기준 `0e322df9` 이후). ralli의 동일 `isStatic` 패턴 잠재 버그는
> 별도 task로 flag했다(이 플랜 범위 밖).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ralli 랜딩 시안 B(베이토 그리드형)의 레이아웃·모션 구조를 다크 테마로 뒤집어 `/apps/golf-counter` 랜딩을 만든다.

**Architecture:** A안(`/apps/ralli`)이 만든 framer-motion 모션 부품을 `apps/` 층으로 승격해 두 랜딩이 공유한다. 페이지는 Server Component `page.tsx`가 `_areas/*.area.tsx` 6개를 세로로 나열하는 구조이며, 스크롤 연동은 각 area가 `useSectionProgress`로 진행도를 직접 구독한다. 시안의 명령형 `requestAnimationFrame` 루프는 선언형 `useTransform`으로 대체하고, 그 과정에서 흡수되지 않는 계산만 `golf-motion.ts`에 순수 함수로 남겨 테스트한다.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · framer-motion 12 · Tailwind CSS v4 · Vitest + Testing Library · Playwright

**Spec:** [`docs/superpowers/specs/2026-08-18-golf-counter-landing-b-design.md`](../specs/2026-08-18-golf-counter-landing-b-design.md)

## Global Constraints

- **언어**: 랜딩 카피는 전부 영문. 코드 주석과 테스트 이름은 한국어 (기존 ralli 코드와 동일)
- **App Store URL**: `https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372` — 이 문자열은 `golfCounterMeta.appStoreUrl` **한 곳에만** 적고 나머지는 전부 참조한다
- **앱 표기명**: 랜딩·JSON-LD 모두 `GolfCounter` (스토어 표기명 `GolfCounter with Watch` 아님)
- **최소 버전 문구**: `Free · watchOS 9.0+`
- **테마**: 페이지 루트에 `dark` 클래스 강제. 색은 `--color-golf-*` 토큰만 사용
- **Tailwind v4 문법**: CSS 변수는 `max-w-(--x)`, 그라디언트는 `bg-linear-*`, spacing 스케일 속성의 4배수 px는 숫자 유틸리티(`max-w-205` = 820px). 상세는 `.claude/rules/coding-conventions.md`
- **Lucide 아이콘**: 크기는 `className`이 아닌 `size` 속성
- **파일 배치**: `.claude/rules/page-folder.md`의 dot-suffix 규칙 — `_areas/*.area.tsx`, `_actions/*.action.tsx`, `_components/` kebab-case, `_utils/` kebab-case
- **테스트**: Vitest는 `globals: true`라 `describe`/`it`/`expect`를 import하지 않는다. `next/image`는 반드시 `vi.mock`
- **커밋**: gitmoji 사용. squash 금지
- **브랜치**: `develop`에서 `feature/golf-counter-landing` 생성 후 작업

---

## Task 0: 브랜치 생성

**Files:** 없음

- [x] **Step 1: develop 최신화 후 브랜치 생성**

```bash
git checkout develop && git pull && git checkout -b feature/golf-counter-landing
```

- [x] **Step 2: 기준선 확인 — 현재 테스트가 전부 통과하는지**

Run: `npm run test:run`
Expected: PASS (실패가 있으면 이 작업과 무관한 기존 문제이므로 먼저 보고할 것)

---

## Task 1: 모션 인프라를 `apps/` 공용으로 승격

ralli 전용이던 훅·래퍼·순수 함수를 `apps/` 층으로 올려 golf-counter가 재사용할 수 있게 한다. **이 태스크는 동작을 바꾸지 않는다** — 기존 ralli 테스트 전량이 회귀 검증 역할을 한다.

**Files:**
- Create: `src/app/(main)/apps/_hooks/useMounted.ts`
- Create: `src/app/(main)/apps/_hooks/useSectionProgress.ts`
- Create: `src/app/(main)/apps/_hooks/useIsMobile.ts`
- Create: `src/app/(main)/apps/_actions/reveal.action.tsx`
- Create: `src/app/(main)/apps/_utils/landing-motion.ts`
- Test: `src/app/(main)/apps/_utils/landing-motion.test.ts`
- Test: `src/app/(main)/apps/_actions/reveal.test.tsx` (이동)
- Delete: `src/app/(main)/apps/ralli/_hooks/useSectionProgress.ts`, `useIsMobile.ts`
- Delete: `src/app/(main)/apps/ralli/_actions/reveal.action.tsx`, `reveal.test.tsx`
- Modify: `src/app/(main)/apps/ralli/_utils/ralli-motion.ts`, `ralli-motion.test.ts`
- Modify: `src/app/(main)/apps/ralli/_areas/{hero,watch,replay,workout,rules,final-cta}.area.tsx` (import 9줄)

**Interfaces:**
- Produces: `useMounted(): boolean` · `useSectionProgress(offset?, smooth?): { ref, progress, isStatic }` · `useIsMobile(query?): boolean` · `Reveal({ children, className?, delay? })` · `clamp(v,min,max)` · `mapRange(v,inMin,inMax,outMin,outMax)` · `stepIndexAt(progress, stepCount?)`

- [x] **Step 1: `landing-motion.test.ts`를 먼저 작성한다 (실패 예정)**

`src/app/(main)/apps/_utils/landing-motion.test.ts`:

```typescript
import { clamp, mapRange, stepIndexAt } from './landing-motion';

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

  // golf-counter Health pin이 2-step으로 사용한다 — 경계를 명시적으로 고정한다
  it('stepCount=2에서 진행도를 절반으로 가른다', () => {
    expect(stepIndexAt(0, 2)).toBe(0);
    expect(stepIndexAt(0.49, 2)).toBe(0);
    expect(stepIndexAt(0.5, 2)).toBe(1);
    expect(stepIndexAt(1, 2)).toBe(1);
  });

  it('음수 진행도는 첫 인덱스로 처리한다', () => {
    expect(stepIndexAt(-1, 2)).toBe(0);
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/_utils/landing-motion.test.ts`
Expected: FAIL — `Failed to resolve import "./landing-motion"`

- [x] **Step 3: `landing-motion.ts`를 만든다**

`src/app/(main)/apps/_utils/landing-motion.ts` — `ralli-motion.ts`에서 순수 수학·스텝 함수만 옮긴 것:

```typescript
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

/** 시안 원본: Math.min(2, Math.floor(p * 3.02)) */
export function stepIndexAt(progress: number, stepCount = 3): number {
  const index = Math.floor(clamp(progress, 0, 1) * (stepCount + 0.02));
  return Math.min(stepCount - 1, index);
}
```

- [x] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/_utils/landing-motion.test.ts`
Expected: PASS (8 tests)

- [x] **Step 5: `ralli-motion.ts`에서 옮겨간 함수를 제거하고 재export한다**

`src/app/(main)/apps/ralli/_utils/ralli-motion.ts` 전문을 아래로 교체한다. `clamp`를 재export하지 않고 import해서 쓰는 이유는, `scoreAt`이 여전히 필요로 하기 때문이다:

```typescript
import { clamp } from '../../_utils/landing-motion';

export const scoreSequence = ['0', '15', '30', '40', 'GAME'] as const;

export type RalliScore = (typeof scoreSequence)[number];

/** 시안 원본: seq[Math.min(seq.length - 1, Math.floor(p * 5.2))] */
export function scoreAt(progress: number): RalliScore {
  const index = Math.floor(clamp(progress, 0, 1) * 5.2);
  return scoreSequence[Math.min(scoreSequence.length - 1, index)];
}
```

- [x] **Step 6: `ralli-motion.test.ts`에서 옮겨간 테스트를 제거한다**

`src/app/(main)/apps/ralli/_utils/ralli-motion.test.ts` 전문을 아래로 교체한다 (`clamp`·`mapRange`·`stepIndexAt` describe 블록 삭제, `scoreAt`만 잔류):

```typescript
import { scoreAt } from './ralli-motion';

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
```

- [x] **Step 7: `useMounted.ts`를 만든다**

`useSectionProgress`와 `Reveal`에 각각 복제돼 있던 hydration 방어 3줄을 한 곳으로 모은다.

`src/app/(main)/apps/_hooks/useMounted.ts`:

```typescript
'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

/**
 * hydration이 끝났는지 여부.
 *
 * `prefers-reduced-motion` 같은 클라이언트 전용 값으로 **DOM 구조**를 바꾸면
 * 서버 렌더 결과와 클라이언트 첫 렌더가 달라져 hydration mismatch가 난다.
 * 서버·hydration 시점에는 항상 false를 반환해 양쪽을 일치시키고,
 * 마운트 후에만 true가 되어 실제 분기를 허용한다.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
```

- [x] **Step 8: `useSectionProgress.ts`를 `apps/_hooks/`로 옮긴다**

`src/app/(main)/apps/_hooks/useSectionProgress.ts` — 기존 ralli 버전에서 `subscribe`/`useSyncExternalStore`를 `useMounted`로 교체한 것:

```typescript
'use client';

import { useRef, type RefObject } from 'react';
import {
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
  type UseScrollOptions,
} from 'framer-motion';
import { useMounted } from './useMounted';

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
  smooth = true,
): SectionProgress {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
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
    isStatic: Boolean(prefersReducedMotion) && mounted,
  };
}
```

그리고 원본을 삭제한다:

```bash
git rm "src/app/(main)/apps/ralli/_hooks/useSectionProgress.ts"
```

- [x] **Step 9: `useIsMobile.ts`를 옮긴다**

`src/app/(main)/apps/_hooks/useIsMobile.ts` — 내용은 그대로, 주석만 두 랜딩을 포괄하도록 고친다:

```typescript
'use client';

import { useEffect, useState } from 'react';

/**
 * 뷰포트 분기. CSS로는 나눌 수 없는 경우에만 쓴다.
 * - ralli: replay 갤러리가 스크롤 연동 드리프트 / 네이티브 가로 스크롤을 분기
 * - golf-counter: hero의 stage 크기·칩 이동 벡터가 `useTransform` 출력 범위 값이라 CSS로 못 바꾼다
 */
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

```bash
git rm "src/app/(main)/apps/ralli/_hooks/useIsMobile.ts"
```

- [x] **Step 10: `reveal.action.tsx`를 옮긴다**

`src/app/(main)/apps/_actions/reveal.action.tsx` — `useMounted` 사용으로 교체:

```tsx
'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMounted } from '../_hooks/useMounted';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** 시안의 `[data-reveal]` 매 프레임 계산을 IntersectionObserver 1회 발화로 대체한다. */
export function Reveal({ children, className, delay = 0 }: Props) {
  const mounted = useMounted();
  const prefersReducedMotion = useReducedMotion();

  const isStatic = Boolean(prefersReducedMotion) && mounted;

  if (isStatic) {
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

- [x] **Step 11: `reveal.test.tsx`를 함께 옮긴다**

```bash
git mv "src/app/(main)/apps/ralli/_actions/reveal.test.tsx" "src/app/(main)/apps/_actions/reveal.test.tsx"
git rm "src/app/(main)/apps/ralli/_actions/reveal.action.tsx"
```

이 테스트는 `import { Reveal } from './reveal.action'`로 같은 폴더를 상대 참조하므로 **경로 수정이 필요 없다**. 파일을 옮기기만 하면 그대로 통과한다.

- [x] **Step 12: ralli area 9줄의 import 경로를 고친다**

파일별로 아래와 같이 바꾼다. `scoreAt`은 그대로 둔다.

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `_areas/hero.area.tsx` | `from '../_hooks/useSectionProgress'` | `from '../../_hooks/useSectionProgress'` |
| `_areas/watch.area.tsx` | `from '../_hooks/useSectionProgress'` | `from '../../_hooks/useSectionProgress'` |
| `_areas/watch.area.tsx` | `import { stepIndexAt } from '../_utils/ralli-motion'` | `import { stepIndexAt } from '../../_utils/landing-motion'` |
| `_areas/replay.area.tsx` | `from '../_hooks/useSectionProgress'` | `from '../../_hooks/useSectionProgress'` |
| `_areas/replay.area.tsx` | `from '../_hooks/useIsMobile'` | `from '../../_hooks/useIsMobile'` |
| `_areas/replay.area.tsx` | `from '../_actions/reveal.action'` | `from '../../_actions/reveal.action'` |
| `_areas/workout.area.tsx` | `from '../_actions/reveal.action'` | `from '../../_actions/reveal.action'` |
| `_areas/rules.area.tsx` | `from '../_actions/reveal.action'` | `from '../../_actions/reveal.action'` |
| `_areas/final-cta.area.tsx` | `from '../_actions/reveal.action'` | `from '../../_actions/reveal.action'` |

- [x] **Step 13: 빈 폴더 정리**

`ralli/_hooks/`와 `ralli/_actions/`가 비었으면 삭제한다.

```bash
rmdir "src/app/(main)/apps/ralli/_hooks" "src/app/(main)/apps/ralli/_actions" 2>/dev/null; true
```

- [x] **Step 14: 전체 검증 — ralli 회귀가 없는지 확인한다**

Run: `npm run test:run`
Expected: PASS. ralli area 테스트 6개가 이 모듈들을 `vi.mock`하지 않고 실제 구현을 쓰므로, 경로가 하나라도 틀리면 여기서 실패한다.

Run: `npm run lint`
Expected: 통과

Run: `npm run build`
Expected: 성공

- [x] **Step 15: 커밋**

```bash
git add -A
git commit -m "♻️ refactor: 랜딩 모션 인프라를 apps 공용으로 승격

useSectionProgress·useIsMobile·Reveal·clamp/mapRange/stepIndexAt을
apps/_hooks·_actions·_utils로 옮겨 두 랜딩이 공유하도록 한다.
useSectionProgress와 Reveal에 복제돼 있던 hydration 방어 로직은
useMounted 하나로 합쳤다. scoreAt은 테니스 전용이라 ralli에 남긴다.

동작 변경 없음 — 기존 ralli 테스트 전량이 회귀 검증한다."
```

---

## Task 2: 테마 토큰 + 콘텐츠 데이터

랜딩의 모든 카피·이미지·색을 데이터로 먼저 확정한다. 이후 area 태스크들은 이 파일만 참조하므로 문구가 코드에 흩어지지 않는다.

**Files:**
- Modify: `src/app/globals.css` (토큰 4개 추가)
- Modify: `src/app/(main)/apps/golf-counter/_utils/golf-counter-content.ts` (3줄 → 전체 콘텐츠)
- Modify: `src/app/(main)/apps/_utils/apps-data.ts` (`golf-counter.links`)
- Test: `src/app/(main)/apps/golf-counter/_utils/golf-counter-content.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `golfCounterMeta` · `golfHeroSection` · `golfCourseSection` · `golfHealthSection` · `golfAfterSection` · `golfHolesSection` · `golfFinalCta` · 타입 `GolfImage`·`GolfChip`·`GolfCard`·`GolfStep`

- [x] **Step 1: `globals.css`에 토큰을 추가한다**

`src/app/globals.css`의 `@theme` 블록에서 `--color-ralli-green: #34c759;` 바로 아래에 추가한다:

```css
  --color-golf-bg: #050a06;
  --color-golf-fg: #f1f5f1;
  --color-golf-green: #34c759;
  --color-golf-orange: #ff9f0a;
```

- [x] **Step 2: 콘텐츠 테스트를 먼저 작성한다 (실패 예정)**

`src/app/(main)/apps/golf-counter/_utils/golf-counter-content.test.ts`:

```typescript
import {
  golfAfterSection,
  golfCourseSection,
  golfHealthSection,
  golfHolesSection,
  golfCounterMeta,
} from './golf-counter-content';

describe('golfCounterMeta', () => {
  it('App Store URL은 us 스토어프론트를 가리킨다', () => {
    expect(golfCounterMeta.appStoreUrl).toBe(
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
    );
  });

  it('랜딩 표기명은 스토어 표기명이 아닌 GolfCounter다', () => {
    expect(golfCounterMeta.name).toBe('GolfCounter');
  });
});

describe('섹션 이미지', () => {
  it('모든 이미지 경로가 /golf-counter/ 아래를 가리킨다', () => {
    const images = [
      golfCourseSection.cards.map((card) => card.image),
      golfHealthSection.steps.map((step) => step.image),
      golfAfterSection.gallery,
      [golfHolesSection.image],
    ].flat();

    expect(images.length).toBeGreaterThan(0);
    images.forEach((image) => {
      expect(image.src.startsWith('/golf-counter/')).toBe(true);
    });
  });

  it('모든 이미지에 alt가 있다', () => {
    const images = [
      golfCourseSection.cards.map((card) => card.image),
      golfHealthSection.steps.map((step) => step.image),
      golfAfterSection.gallery,
      [golfHolesSection.image],
    ].flat();

    images.forEach((image) => {
      expect(image.alt.length).toBeGreaterThan(0);
    });
  });
});

describe('golfHealthSection', () => {
  it('스텝이 2개다 — pin 크로스페이드가 2-step으로 동작한다', () => {
    expect(golfHealthSection.steps).toHaveLength(2);
  });
});

describe('golfHolesSection', () => {
  it('활성 칩은 정확히 하나다', () => {
    const active = golfHolesSection.chips.filter((chip) => chip.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe('18 holes');
  });
});
```

- [x] **Step 3: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_utils/golf-counter-content.test.ts`
Expected: FAIL — `golfCourseSection` 등이 export되지 않음

- [x] **Step 4: `golf-counter-content.ts`를 전문 교체한다**

```typescript
export type GolfImageKind = 'ios' | 'watch';

export type GolfImage = {
  src: string;
  alt: string;
  kind: GolfImageKind;
  width: number;
  height: number;
};

const IOS_W = 1284;
const IOS_H = 2778;
const WATCH_W = 422;
const WATCH_H = 514;

function iosImage(src: string, alt: string): GolfImage {
  return { src, alt, kind: 'ios', width: IOS_W, height: IOS_H };
}

function watchImage(src: string, alt: string): GolfImage {
  return { src, alt, kind: 'watch', width: WATCH_W, height: WATCH_H };
}

export const golfCounterMeta = {
  name: 'GolfCounter',
  iconSrc: '/golf-counter/golf-counter.png',
  supportEmail: 'qlrogo91lp@gmail.com',
  appStoreUrl: 'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
  platformNote: 'Free · watchOS 9.0+',
  minimumOs: 'iOS 16.4, watchOS 9.0',
} as const;

export type GolfStatChip = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  tone: 'green' | 'orange' | 'fg';
};

export const golfHeroSection = {
  badge: 'Live on Apple Watch & iPhone',
  headingLines: ['Play the round.', 'Not your phone.'],
  body: 'GolfCounter counts strokes, putts, and calories from your wrist — then hands the whole round back to your iPhone.',
  shot: watchImage(
    '/golf-counter/watch-match-en.png',
    'GolfCounter hole score dial on Apple Watch',
  ),
  stageLabel: 'Hole 2 · Par 4 · +3',
  // 값은 전부 스크린샷에 실제로 찍힌 숫자다 (설계 문서 4.4)
  chips: [
    { id: 'total', label: 'TOTAL', value: '46', suffix: '+10', tone: 'green' },
    { id: 'holes', label: 'HOLES', value: '18', tone: 'fg' },
    { id: 'putts', label: 'PUTTS', value: '1.8', suffix: '/hole', tone: 'fg' },
    { id: 'best', label: 'BEST', value: '+9', tone: 'orange' },
  ] satisfies GolfStatChip[],
};

export type GolfCard = {
  id: string;
  title: string;
  body: string;
  image: GolfImage;
};

export const golfCourseSection = {
  id: 'course',
  label: 'ON THE COURSE',
  heading: 'Everything happens on your wrist.',
  body: 'No phone in your pocket. No paper scorecard. Just a tap per stroke.',
  cards: [
    {
      id: 'count',
      title: 'Tap to count',
      body: 'Pick 9 or 18 holes, tap once per stroke, and undo a miscount instantly.',
      image: iosImage(
        '/golf-counter/ios-watch-match-en.png',
        'GolfCounter stroke counter on Apple Watch',
      ),
    },
    {
      id: 'complication',
      title: 'One tap from the watch face',
      body: 'Add the complication and start a round before the first tee.',
      image: watchImage(
        '/golf-counter/watch-complication-en.png',
        'GolfCounter complication on the Apple Watch face',
      ),
    },
    {
      id: 'scorecard',
      title: 'The whole card on your wrist',
      body: 'Total strokes, over-par, and every hole — without reaching for your phone.',
      image: watchImage(
        '/golf-counter/watch-score-en.png',
        'GolfCounter scorecard on Apple Watch',
      ),
    },
  ] satisfies GolfCard[],
};

export type GolfStep = {
  id: string;
  title: string;
  body: string;
  image: GolfImage;
};

export const golfHealthSection = {
  id: 'health',
  label: 'HEALTH',
  heading: 'A round is a workout — logged automatically.',
  steps: [
    {
      id: 'session',
      title: 'Tied to a HealthKit session',
      body: 'Start a round, start a workout. Nothing extra to remember.',
      image: watchImage(
        '/golf-counter/watch-workout-en.png',
        'GolfCounter workout metrics on Apple Watch',
      ),
    },
    {
      id: 'sync',
      title: 'Calories, heart rate, round time',
      body: 'Tracked live on your wrist, then synced to your iPhone.',
      image: iosImage(
        '/golf-counter/connectivity-en.png',
        'GolfCounter on iPhone and Apple Watch together',
      ),
    },
  ] satisfies GolfStep[],
};

export const golfAfterSection = {
  id: 'after',
  label: 'AFTER THE ROUND',
  heading: 'Every round adds up.',
  body: 'Over-par trend, putts per hole, and score distribution — built from the rounds you already played.',
  gallery: [
    iosImage('/golf-counter/ios-stat-en.png', 'GolfCounter round statistics on iPhone'),
    iosImage(
      '/golf-counter/ios-watch-score-en.png',
      'GolfCounter full scorecard on Apple Watch',
    ),
  ],
};

export type GolfChip = {
  label: string;
  isActive: boolean;
};

export const golfHolesSection = {
  heading: 'Nine or eighteen. Your call.',
  body: 'Set the hole count before you tee off. GolfCounter handles par and over-par from there.',
  chips: [
    { label: '18 holes', isActive: true },
    { label: '9 holes', isActive: false },
  ] satisfies GolfChip[],
  image: watchImage(
    '/golf-counter/watch-home-en.png',
    'GolfCounter hole count selection on Apple Watch',
  ),
};

export const golfFinalCta = {
  heading: 'Ready for the first tee?',
  body: 'Free on the App Store for Apple Watch and iPhone.',
} as const;
```

- [x] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_utils/golf-counter-content.test.ts`
Expected: PASS (6 tests)

- [x] **Step 6: `apps-data.ts`의 `links`를 채운다**

URL 문자열을 두 곳에 적지 않기 위해 상수를 import한다. `src/app/(main)/apps/_utils/apps-data.ts` 상단에 추가:

```typescript
import { golfCounterMeta } from '../golf-counter/_utils/golf-counter-content';
```

그리고 `golf-counter` 항목의 `links: [],`를 아래로 바꾼다:

```typescript
    links: [{ label: 'App Store', url: golfCounterMeta.appStoreUrl }],
```

- [x] **Step 7: 기존 privacy 페이지가 깨지지 않았는지 확인한다**

`privacy/page.tsx`가 `golfCounterMeta`에서 `name`·`iconSrc`·`supportEmail`을 쓰고 있다. 세 필드를 모두 유지했으므로 통과해야 한다.

Run: `npm run test:run`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [x] **Step 8: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 콘텐츠 데이터와 다크 테마 토큰 추가

카피·이미지·칩 값을 golf-counter-content.ts에 모으고
--color-golf-* 토큰 4개를 추가한다. App Store URL은 이 파일
한 곳에만 두고 apps-data.ts가 참조한다.

hero 칩 값은 전부 스크린샷에 실제로 찍힌 숫자를 쓴다."
```

---

## Task 3: `golf-motion.ts` 순수 함수

시안 rAF 로직 중 `useTransform`으로 흡수되지 않는 계산만 순수 함수로 남긴다.

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_utils/golf-motion.ts`
- Test: `src/app/(main)/apps/golf-counter/_utils/golf-motion.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `chipRangeAt(index): [number, number]` · `CHIP_OFFSETS: { desktop, mobile }` · `stageRangeOf(isMobile): StageRange`

- [x] **Step 1: 테스트를 먼저 작성한다 (실패 예정)**

`src/app/(main)/apps/golf-counter/_utils/golf-motion.test.ts`:

```typescript
import { CHIP_OFFSETS, chipRangeAt, stageRangeOf } from './golf-motion';

describe('chipRangeAt', () => {
  it('첫 칩은 진행도 0.04에서 시작한다', () => {
    expect(chipRangeAt(0)).toEqual([0.04, 0.5]);
  });

  it('칩마다 0.045씩 시작이 밀린다 — 시차 등장', () => {
    expect(chipRangeAt(1)[0]).toBeCloseTo(0.085, 5);
    expect(chipRangeAt(2)[0]).toBeCloseTo(0.13, 5);
    expect(chipRangeAt(3)[0]).toBeCloseTo(0.175, 5);
  });

  it('모든 칩의 구간 폭은 0.46으로 같다', () => {
    [0, 1, 2, 3].forEach((index) => {
      const [start, end] = chipRangeAt(index);
      expect(end - start).toBeCloseTo(0.46, 5);
    });
  });

  it('마지막 칩도 진행도 1 안에서 끝난다', () => {
    expect(chipRangeAt(3)[1]).toBeLessThanOrEqual(1);
  });
});

describe('CHIP_OFFSETS', () => {
  it('데스크톱·모바일 모두 칩 4개의 벡터를 갖는다', () => {
    expect(CHIP_OFFSETS.desktop).toHaveLength(4);
    expect(CHIP_OFFSETS.mobile).toHaveLength(4);
  });

  it('모바일은 세로 이동 위주다 — 좁은 화면에서 가로로 밀면 화면을 벗어난다', () => {
    CHIP_OFFSETS.mobile.forEach(([x, y]) => {
      expect(Math.abs(y)).toBeGreaterThan(Math.abs(x));
    });
  });

  it('데스크톱은 가로 이동이 살아 있다', () => {
    CHIP_OFFSETS.desktop.forEach(([x]) => {
      expect(Math.abs(x)).toBeGreaterThanOrEqual(14);
    });
  });
});

describe('stageRangeOf', () => {
  it('데스크톱 stage는 50vw에서 94vw로 커진다', () => {
    expect(stageRangeOf(false).width).toEqual(['50vw', '94vw']);
    expect(stageRangeOf(false).height).toEqual(['44vh', '86vh']);
  });

  it('모바일 stage는 처음부터 넓고 낮다', () => {
    expect(stageRangeOf(true).width).toEqual(['86vw', '96vw']);
    expect(stageRangeOf(true).height).toEqual(['32vh', '58vh']);
  });

  it('두 경우 모두 최종 translateY는 0이다 — 중앙에 안착한다', () => {
    expect(stageRangeOf(false).translateY[1]).toBe('0vh');
    expect(stageRangeOf(true).translateY[1]).toBe('0vh');
  });

  it('모서리는 40px에서 28px로 좁아진다', () => {
    expect(stageRangeOf(false).borderRadius).toEqual([40, 28]);
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_utils/golf-motion.test.ts`
Expected: FAIL — 모듈 없음

- [x] **Step 3: `golf-motion.ts`를 만든다**

```typescript
/**
 * 시안 B의 rAF 계산 중 framer-motion `useTransform`으로 흡수되지 않는 부분.
 * 이징(easeInOutQuad)과 값 보간은 `useTransform`이 처리하므로 여기 없다.
 */

/** 칩별 등장 구간. 시안 원본: t = clamp((p - 0.04 - i*0.045) / 0.46, 0, 1) */
export function chipRangeAt(index: number): [number, number] {
  const start = 0.04 + index * 0.045;
  return [start, start + 0.46];
}

/**
 * 칩이 흩어지는 [vw, vh] 벡터.
 * 시안 원본: mob ? [[-2,-11],[2,-13],[2,13],[-2,12]] : [[-16,-6],[16,-10],[14,12],[-14,10]]
 */
export const CHIP_OFFSETS = {
  desktop: [
    [-16, -6],
    [16, -10],
    [14, 12],
    [-14, 10],
  ],
  mobile: [
    [-2, -11],
    [2, -13],
    [2, 13],
    [-2, 12],
  ],
} as const;

export type StageRange = {
  width: [string, string];
  height: [string, string];
  translateY: [string, string];
  borderRadius: [number, number];
};

/**
 * hero stage의 시작·끝 크기.
 * 시안 원본: width = mob ? 86+e*10 : 50+e*44 (vw)
 *            height = mob ? 32+e*26 : 44+e*42 (vh)
 *            translateY = base - e*base (base = mob ? 19 : 16)
 *            borderRadius = 40 - e*12
 */
export function stageRangeOf(isMobile: boolean): StageRange {
  if (isMobile) {
    return {
      width: ['86vw', '96vw'],
      height: ['32vh', '58vh'],
      translateY: ['19vh', '0vh'],
      borderRadius: [40, 28],
    };
  }

  return {
    width: ['50vw', '94vw'],
    height: ['44vh', '86vh'],
    translateY: ['16vh', '0vh'],
    borderRadius: [40, 28],
  };
}
```

- [x] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_utils/golf-motion.test.ts`
Expected: PASS (11 tests)

- [x] **Step 5: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter hero 모션 순수 함수 추가

시안 rAF의 칩 시차 구간·이동 벡터·stage 크기 범위를
useTransform이 흡수하지 못하는 부분만 순수 함수로 남긴다."
```

---

## Task 4: 공용 컴포넌트 + 페이지 셸

이후 area 태스크들이 붙을 자리를 만든다. 이 태스크가 끝나면 `/apps/golf-counter`가 빈 다크 페이지로 렌더된다.

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_components/golf-shot.tsx`
- Create: `src/app/(main)/apps/golf-counter/_components/golf-stat-chip.tsx`
- Create: `src/app/(main)/apps/golf-counter/_components/golf-json-ld.tsx`
- Create: `src/app/(main)/apps/golf-counter/page.tsx`
- Test: `src/app/(main)/apps/golf-counter/_components/golf-stat-chip.test.tsx`

**Interfaces:**
- Consumes: `GolfImage`·`GolfStatChip`·`golfCounterMeta` (Task 2)
- Produces: `<GolfShot image className? sizes? priority? />` · `<GolfStatChip chip />` · `<GolfJsonLd />`

- [x] **Step 1: `golf-shot.tsx`를 만든다**

`ralli-shot.tsx`와 달리 마스크가 없다 — 설계 3.1에서 이미지 카드 색으로 이음매를 없앴기 때문이다.

```tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GolfImage } from '../_utils/golf-counter-content';

type Props = {
  image: GolfImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function GolfShot({ image, className, sizes, priority = false }: Props) {
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
      className={cn('w-auto object-contain', className)}
    />
  );
}
```

- [x] **Step 2: 칩 테스트를 작성한다 (실패 예정)**

`src/app/(main)/apps/golf-counter/_components/golf-stat-chip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { GolfStatChip } from './golf-stat-chip';

describe('GolfStatChip', () => {
  it('라벨과 값을 렌더한다', () => {
    render(<GolfStatChip chip={{ id: 'total', label: 'TOTAL', value: '46', tone: 'green' }} />);
    expect(screen.getByText('TOTAL')).toBeInTheDocument();
    expect(screen.getByText('46')).toBeInTheDocument();
  });

  it('suffix가 있으면 값 옆에 함께 렌더한다', () => {
    render(
      <GolfStatChip
        chip={{ id: 'putts', label: 'PUTTS', value: '1.8', suffix: '/hole', tone: 'fg' }}
      />,
    );
    expect(screen.getByText('/hole')).toBeInTheDocument();
  });

  it('suffix가 없으면 렌더하지 않는다', () => {
    const { container } = render(
      <GolfStatChip chip={{ id: 'holes', label: 'HOLES', value: '18', tone: 'fg' }} />,
    );
    expect(container.querySelectorAll('[data-chip-suffix]')).toHaveLength(0);
  });
});
```

- [x] **Step 3: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_components/golf-stat-chip.test.tsx`
Expected: FAIL — 모듈 없음

- [x] **Step 4: `golf-stat-chip.tsx`를 만든다**

시안의 라이트 유리 칩을 다크로 뒤집은 것이다 (설계 3.1 표).

```tsx
import { cn } from '@/lib/utils';
import type { GolfStatChip as GolfStatChipData } from '../_utils/golf-counter-content';

type Props = {
  chip: GolfStatChipData;
};

const toneClass = {
  green: 'text-golf-green',
  orange: 'text-golf-orange',
  fg: 'text-golf-fg',
} as const;

export function GolfStatChip({ chip }: Props) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/6 px-4.5 py-3.5 backdrop-blur-2xl">
      <div className="text-[11px] font-bold tracking-[0.14em] text-white/45">{chip.label}</div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-[30px] leading-[1.1] font-bold tracking-[-0.04em]',
            toneClass[chip.tone],
          )}
        >
          {chip.value}
        </span>
        {chip.suffix ? (
          <span data-chip-suffix className="text-sm text-white/45">
            {chip.suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
```

- [x] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_components/golf-stat-chip.test.tsx`
Expected: PASS (3 tests)

- [x] **Step 6: `golf-json-ld.tsx`를 만든다**

```tsx
import { golfCounterMeta } from '../_utils/golf-counter-content';

export function GolfJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: golfCounterMeta.name,
    applicationCategory: 'SportsApplication',
    operatingSystem: golfCounterMeta.minimumOs,
    url: golfCounterMeta.appStoreUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

- [x] **Step 7: `page.tsx` 셸을 만든다**

area는 아직 없다. 배경·메시 그라디언트·다크 강제만 세운다. 이후 태스크가 area를 하나씩 이 파일에 추가한다.

```tsx
import type { Metadata } from 'next';
import { GolfJsonLd } from './_components/golf-json-ld';
import { golfCounterMeta } from './_utils/golf-counter-content';

export const metadata: Metadata = {
  title: `${golfCounterMeta.name} — Golf scores, right on your wrist`,
  description:
    'Count strokes and putts from your Apple Watch, log the round as a HealthKit workout, and review every round on your iPhone.',
};

export default function GolfCounterPage() {
  return (
    <div className="dark relative bg-golf-bg text-golf-fg">
      <GolfJsonLd />
      {/* 메시 그라디언트. 시안은 rAF로 translateY(-scrollY * 0.04) 패럴랙스를 주지만,
          `fixed` 레이어면 같은 "배경이 거의 안 따라온다"는 인상을 JS 0줄로 얻는다.
          스크롤마다 프레임을 도는 구독을 하나 덜기 위한 의도적 단순화다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-1/4 left-1/4 size-[60vw] rounded-full bg-golf-green/12 blur-[120px]" />
        <div className="absolute top-1/2 -right-[16%] size-[50vw] rounded-full bg-golf-orange/8 blur-[140px]" />
      </div>
      <div className="relative z-[1]">{/* area가 여기에 순서대로 들어간다 */}</div>
    </div>
  );
}
```

- [x] **Step 8: 페이지가 렌더되는지 확인한다**

Run: `npm run build`
Expected: 성공. `/apps/golf-counter`가 라우트 목록에 나타난다.

- [x] **Step 9: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 페이지 셸과 공용 컴포넌트 추가

GolfShot(마스크 없는 next/image 래퍼)·GolfStatChip·GolfJsonLd와
다크 배경 + 메시 그라디언트 셸을 만든다. area는 이후 태스크에서 붙인다."
```

---

## Task 5: Hero area

가장 복잡한 area다. sticky pin 안에서 stage가 확대되고, 칩 4개가 시차를 두고 흩어지며, 헤드와 CTA가 페이드아웃한다.

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_areas/hero.area.tsx`
- Test: `src/app/(main)/apps/golf-counter/_areas/hero.area.test.tsx`
- Modify: `src/app/(main)/apps/golf-counter/page.tsx`

**Interfaces:**
- Consumes: `useSectionProgress`·`useIsMobile` (Task 1), `golfHeroSection`·`golfCounterMeta` (Task 2), `chipRangeAt`·`CHIP_OFFSETS`·`stageRangeOf` (Task 3), `GolfShot`·`GolfStatChip` (Task 4)
- Produces: `<HeroArea />`

- [x] **Step 1: 테스트를 먼저 작성한다 (실패 예정)**

`src/app/(main)/apps/golf-counter/_areas/hero.area.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('HeroArea', () => {
  it('배지와 두 줄 헤드라인을 렌더한다', () => {
    render(<HeroArea />);
    expect(screen.getByText('Live on Apple Watch & iPhone')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Play the round.Not your phone.',
    );
  });

  it('칩 4개를 모두 렌더한다', () => {
    render(<HeroArea />);
    ['TOTAL', 'HOLES', 'PUTTS', 'BEST'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('App Store CTA가 실제 URL을 가리킨다', () => {
    render(<HeroArea />);
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
    );
  });

  it('최소 버전 문구를 노출한다', () => {
    render(<HeroArea />);
    expect(screen.getByText('Free · watchOS 9.0+')).toBeInTheDocument();
  });

  it('stage 라벨이 hero 이미지에 찍힌 값과 일치한다', () => {
    render(<HeroArea />);
    expect(screen.getByText('Hole 2 · Par 4 · +3')).toBeInTheDocument();
  });

  it('hero 워치 이미지를 alt와 함께 렌더한다', () => {
    render(<HeroArea />);
    expect(
      screen.getByAltText('GolfCounter hole score dial on Apple Watch'),
    ).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/hero.area.test.tsx`
Expected: FAIL — 모듈 없음

- [x] **Step 3: `hero.area.tsx`를 만든다**

칩은 각자 `useTransform`이 필요하므로 **자식 컴포넌트로 분리**한다 — `.map()` 안에서 훅을 호출하면 `react-hooks/rules-of-hooks` 위반이다.

```tsx
'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useSectionProgress } from '../../_hooks/useSectionProgress';
import { useIsMobile } from '../../_hooks/useIsMobile';
import { GolfShot } from '../_components/golf-shot';
import { GolfStatChip } from '../_components/golf-stat-chip';
import {
  golfCounterMeta,
  golfHeroSection,
  type GolfStatChip as GolfStatChipData,
} from '../_utils/golf-counter-content';
import { CHIP_OFFSETS, chipRangeAt, stageRangeOf } from '../_utils/golf-motion';

const CHIP_POSITION = [
  'left-3 top-[27vh] md:left-[9vw] md:top-[34vh]',
  'right-3 top-[23vh] md:right-[8vw] md:top-[30vh]',
  'right-3 bottom-[27vh] md:right-[13vw] md:bottom-[20vh]',
  'left-3 bottom-[30vh] md:left-[11vw] md:bottom-[23vh]',
] as const;

type ChipProps = {
  chip: GolfStatChipData;
  index: number;
  progress: MotionValue<number>;
  isMobile: boolean;
  isStatic: boolean;
};

function HeroChip({ chip, index, progress, isMobile, isStatic }: ChipProps) {
  const [start, end] = chipRangeAt(index);
  const offsets = isMobile ? CHIP_OFFSETS.mobile : CHIP_OFFSETS.desktop;
  const [dx, dy] = offsets[index];

  const x = useTransform(progress, [start, end], ['0vw', `${dx}vw`]);
  const y = useTransform(progress, [start, end], ['0vh', `${dy}vh`]);
  const scale = useTransform(progress, [start, end], [1, 0.9]);
  const rotate = useTransform(progress, [start, end], [0, (index % 2 ? 1 : -1) * 2.5]);
  // 시안 원본: opacity = clamp(1 - max(0, p - 0.66) * 3.4, 0, 1)
  const opacity = useTransform(progress, [0.66, 0.9541], [1, 0]);

  if (isStatic) {
    return (
      <div className={`absolute z-[5] ${CHIP_POSITION[index]}`}>
        <GolfStatChip chip={chip} />
      </div>
    );
  }

  return (
    <motion.div
      className={`absolute z-[5] ${CHIP_POSITION[index]}`}
      style={{ x, y, scale, rotate, opacity }}
    >
      <GolfStatChip chip={chip} />
    </motion.div>
  );
}

export function HeroArea() {
  const { ref, progress, isStatic } = useSectionProgress();
  const isMobile = useIsMobile();
  const stage = stageRangeOf(isMobile);

  const stageWidth = useTransform(progress, [0, 0.75], stage.width);
  const stageHeight = useTransform(progress, [0, 0.75], stage.height);
  const stageY = useTransform(progress, [0, 0.75], stage.translateY);
  const stageRadius = useTransform(progress, [0, 0.75], stage.borderRadius);

  // 시안 원본: head opacity = clamp(1 - max(0, p - 0.16) * 2.6, 0, 1) → 0.5446에서 0
  const headOpacity = useTransform(progress, [0.16, 0.5446], [1, 0]);
  const headY = useTransform(progress, [0, 0.75], ['0vh', '-9vh']);
  const headScale = useTransform(progress, [0, 0.75], [1, 0.97]);

  // 시안 원본: cta opacity = clamp(1 - max(0, p - 0.12) * 3, 0, 1) → 0.4533에서 0
  const ctaOpacity = useTransform(progress, [0.12, 0.4533], [1, 0]);
  const ctaY = useTransform(progress, [0, 0.75], ['0vh', '6vh']);

  // 시안 원본: stagelabel opacity = clamp((p - 0.45) / 0.2, 0, 1)
  const labelOpacity = useTransform(progress, [0.45, 0.65], [0, 1]);

  return (
    <div
      ref={ref}
      className={isStatic ? 'relative h-auto' : 'relative h-[210vh] md:h-[300vh]'}
    >
      <div
        className={
          isStatic
            ? 'flex flex-col items-center gap-10 px-6 py-16'
            : 'sticky top-14 grid h-[calc(100vh-3.5rem)] place-items-center overflow-hidden'
        }
      >
        <motion.div
          className={isStatic ? 'text-center' : 'absolute top-[6vh] right-0 left-0 z-[4] px-6 text-center'}
          style={isStatic ? undefined : { opacity: headOpacity, y: headY, scale: headScale }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-xl">
            <span className="size-1.75 rounded-full bg-golf-green" />
            {golfHeroSection.badge}
          </div>
          <h1 className="mb-3 text-[clamp(30px,4.8vw,64px)] leading-[0.98] font-bold tracking-[-0.045em] text-balance">
            {golfHeroSection.headingLines[0]}
            <br />
            {golfHeroSection.headingLines[1]}
          </h1>
          <p className="mx-auto max-w-115 text-[17px] leading-[1.45] text-white/55">
            {golfHeroSection.body}
          </p>
        </motion.div>

        <motion.div
          className="relative z-[2] grid max-w-205 place-items-center overflow-hidden border border-white/8 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
          style={
            isStatic
              ? { width: '86vw', height: '44vh', borderRadius: 32 }
              : {
                  width: stageWidth,
                  height: stageHeight,
                  y: stageY,
                  borderRadius: stageRadius,
                }
          }
        >
          {/* 워치 원본이 422×514라 stage를 따라 무한정 키우면 뿌옇게 렌더된다 (설계 5절).
              max-h로 상한을 걸어 min(stage × 0.84, 44vh) 효과를 낸다. */}
          <GolfShot
            image={golfHeroSection.shot}
            priority
            sizes="(max-width: 768px) 60vw, 40vw"
            className="max-h-[44vh]"
          />
          <motion.div
            className="absolute bottom-5 left-6 flex items-center gap-2.5 rounded-full border border-white/14 bg-white/8 px-3.5 py-2 text-[12.5px] font-semibold backdrop-blur-xl"
            style={isStatic ? undefined : { opacity: labelOpacity }}
          >
            <span className="size-1.75 rounded-full bg-golf-orange" />
            {golfHeroSection.stageLabel}
          </motion.div>
        </motion.div>

        {golfHeroSection.chips.map((chip, index) => (
          <HeroChip
            key={chip.id}
            chip={chip}
            index={index}
            progress={progress}
            isMobile={isMobile}
            isStatic={isStatic}
          />
        ))}

        <motion.div
          className={
            isStatic
              ? 'flex flex-col items-center gap-3'
              : 'absolute right-0 bottom-[5vh] left-0 z-[6] flex flex-col flex-wrap items-center justify-center gap-3 px-5 md:bottom-[7vh] md:flex-row'
          }
          style={isStatic ? undefined : { opacity: ctaOpacity, y: ctaY }}
        >
          <a
            href={golfCounterMeta.appStoreUrl}
            className="inline-flex rounded-full bg-golf-green px-6.5 py-3.75 text-[15.5px] font-semibold text-black shadow-[0_12px_34px_rgba(52,199,89,0.32)]"
          >
            Download on the App Store
          </a>
          <span className="text-[13.5px] text-white/55">{golfCounterMeta.platformNote}</span>
        </motion.div>
      </div>
    </div>
  );
}
```

- [x] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/hero.area.test.tsx`
Expected: PASS (6 tests)

- [x] **Step 5: `page.tsx`에 붙인다**

import를 추가하고, 주석 자리를 `<HeroArea />`로 바꾼다:

```tsx
import { HeroArea } from './_areas/hero.area';
```

```tsx
      <div className="relative z-[1]">
        <HeroArea />
      </div>
```

- [x] **Step 6: 브라우저에서 확인한다**

`preview_start`로 dev 서버를 띄우고 `/apps/golf-counter`로 이동해 아래를 눈으로 확인한다:

- 스크롤에 따라 stage가 커지며 칩 4개가 시차를 두고 바깥으로 흩어지는가
- 헤드라인과 CTA가 페이드아웃하는가
- stage 라벨이 스크롤 중반(45~65%)에 나타나는가
- 워치 이미지가 뿌옇지 않은가 (`max-h-[44vh]` 상한이 동작하는가)
- 콘솔 에러가 없는가 (`read_console_messages`)

- [x] **Step 7: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 hero 영역 추가

sticky pin 안에서 stage가 확대되고 칩 4개가 시차를 두고 흩어진다.
칩은 각자 useTransform이 필요해 자식 컴포넌트로 분리했다.
워치 이미지는 원본 해상도(422x514) 한계로 max-h 44vh 상한을 건다."
```

---

## Task 6: On the course area (베이토 그리드)

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_areas/course.area.tsx`
- Test: `src/app/(main)/apps/golf-counter/_areas/course.area.test.tsx`
- Modify: `src/app/(main)/apps/golf-counter/page.tsx`

**Interfaces:**
- Consumes: `Reveal` (Task 1), `golfCourseSection` (Task 2), `GolfShot` (Task 4)
- Produces: `<CourseArea />`

- [x] **Step 1: 테스트를 먼저 작성한다 (실패 예정)**

```tsx
import { render, screen } from '@testing-library/react';
import { CourseArea } from './course.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('CourseArea', () => {
  it('섹션 라벨과 제목을 렌더한다', () => {
    render(<CourseArea />);
    expect(screen.getByText('ON THE COURSE')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Everything happens on your wrist.' }),
    ).toBeInTheDocument();
  });

  it('카드 3장의 제목을 모두 렌더한다', () => {
    render(<CourseArea />);
    expect(screen.getByText('Tap to count')).toBeInTheDocument();
    expect(screen.getByText('One tap from the watch face')).toBeInTheDocument();
    expect(screen.getByText('The whole card on your wrist')).toBeInTheDocument();
  });

  it('카드 이미지 3장을 alt와 함께 렌더한다', () => {
    render(<CourseArea />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('섹션 id를 노출한다', () => {
    const { container } = render(<CourseArea />);
    expect(container.querySelector('#course')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/course.area.test.tsx`
Expected: FAIL — 모듈 없음

- [x] **Step 3: `course.area.tsx`를 만든다**

시안의 `1.25fr 1fr` 베이토를 그대로 옮긴다. 첫 카드가 `grid-row: span 2`로 세로로 길다.

```tsx
import { Reveal } from '../../_actions/reveal.action';
import { GolfShot } from '../_components/golf-shot';
import { golfCourseSection } from '../_utils/golf-counter-content';

export function CourseArea() {
  const [tall, ...rest] = golfCourseSection.cards;

  return (
    <section id={golfCourseSection.id} className="px-5 py-16 md:px-[max(6vw,28px)] md:py-28">
      <div className="mx-auto max-w-280">
        <Reveal className="mb-11 max-w-150">
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-golf-green">
            {golfCourseSection.label}
          </div>
          <h2 className="mb-3 text-[clamp(28px,3.8vw,48px)] leading-[1.04] font-bold tracking-[-0.04em] text-pretty">
            {golfCourseSection.heading}
          </h2>
          <p className="text-[17px] leading-[1.5] text-white/55">{golfCourseSection.body}</p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-[1.25fr_1fr] md:gap-4">
          <Reveal className="md:row-span-2">
            <div className="relative grid h-full min-h-100 place-items-center overflow-hidden rounded-[34px] border border-white/8 bg-black p-9 md:min-h-130">
              <GolfShot
                image={tall.image}
                sizes="(max-width: 768px) 70vw, 34vw"
                className="max-h-100"
              />
              <div className="absolute bottom-7 left-7.5">
                <div className="mb-1 text-[19px] font-semibold tracking-[-0.3px]">
                  {tall.title}
                </div>
                <div className="max-w-70 text-[14.5px] text-white/55">{tall.body}</div>
              </div>
            </div>
          </Reveal>

          {rest.map((card, index) => (
            <Reveal key={card.id} delay={(index + 1) * 0.08}>
              <div className="flex min-h-63 flex-col justify-between rounded-[34px] border border-white/10 bg-white/6 p-7.5 backdrop-blur-2xl">
                <div className="text-[19px] font-semibold tracking-[-0.3px]">{card.title}</div>
                <p className="mt-2 mb-4.5 text-[14.5px] leading-[1.45] text-white/55">
                  {card.body}
                </p>
                <div className="grid flex-1 place-items-center overflow-hidden rounded-[22px] border border-white/8 bg-black p-3.5">
                  <GolfShot
                    image={card.image}
                    sizes="(max-width: 768px) 40vw, 20vw"
                    className="max-h-37.5"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [x] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/course.area.test.tsx`
Expected: PASS (4 tests)

- [x] **Step 5: `page.tsx`에 붙인다**

`<HeroArea />` 아래에 `<CourseArea />`를 추가하고 import를 더한다.

- [x] **Step 6: 브라우저에서 확인한다**

데스크톱에서 tall 카드가 오른쪽 카드 2장 높이를 함께 차지하는지, 모바일(`resize_window` preset `mobile`)에서 1컬럼으로 접히는지 확인한다.

- [x] **Step 7: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 On the course 베이토 그리드 추가"
```

---

## Task 7: Health area (pin 2-step)

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_areas/health.area.tsx`
- Test: `src/app/(main)/apps/golf-counter/_areas/health.area.test.tsx`
- Modify: `src/app/(main)/apps/golf-counter/page.tsx`

**Interfaces:**
- Consumes: `useSectionProgress` (Task 1), `stepIndexAt` (Task 1), `golfHealthSection` (Task 2), `GolfShot` (Task 4)
- Produces: `<HealthArea />`

- [x] **Step 1: 테스트를 먼저 작성한다 (실패 예정)**

```tsx
import { render, screen } from '@testing-library/react';
import { HealthArea } from './health.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('HealthArea', () => {
  it('섹션 라벨과 제목을 렌더한다', () => {
    render(<HealthArea />);
    expect(screen.getByText('HEALTH')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A round is a workout — logged automatically.' }),
    ).toBeInTheDocument();
  });

  it('스텝 2개를 모두 렌더한다', () => {
    render(<HealthArea />);
    expect(screen.getByText('Tied to a HealthKit session')).toBeInTheDocument();
    expect(screen.getByText('Calories, heart rate, round time')).toBeInTheDocument();
  });

  it('초기 활성 스텝은 첫 번째다', () => {
    render(<HealthArea />);
    expect(screen.getByTestId('golf-step-session')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('golf-step-sync')).toHaveAttribute('data-active', 'false');
  });

  it('비활성 이미지는 스크린 리더에서 숨긴다', () => {
    render(<HealthArea />);
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(2);
    expect(images[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('섹션 id를 노출한다', () => {
    const { container } = render(<HealthArea />);
    expect(container.querySelector('#health')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/health.area.test.tsx`
Expected: FAIL — 모듈 없음

- [x] **Step 3: `health.area.tsx`를 만든다**

`stepIndexAt(value, 2)`로 2-step을 만든다. A안 README가 지적한 미해결 이슈(비활성 이미지가 스크린 리더에 노출됨)를 여기서는 처음부터 `aria-hidden`으로 처리한다.

```tsx
'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { useSectionProgress } from '../../_hooks/useSectionProgress';
import { stepIndexAt } from '../../_utils/landing-motion';
import { GolfShot } from '../_components/golf-shot';
import { golfHealthSection } from '../_utils/golf-counter-content';

const STEP_COUNT = golfHealthSection.steps.length;

export function HealthArea() {
  const { ref, progress, isStatic } = useSectionProgress();
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(progress, 'change', (value) => {
    setActiveIndex(stepIndexAt(value, STEP_COUNT));
  });

  return (
    <div
      ref={ref}
      id={golfHealthSection.id}
      className={isStatic ? 'relative h-auto' : 'relative h-[170vh] md:h-[280vh]'}
    >
      <div
        className={
          isStatic
            ? 'mx-auto grid max-w-325 gap-5 px-5 py-16'
            : 'sticky top-14 mx-auto grid h-[calc(100vh-3.5rem)] max-w-325 grid-cols-1 content-center items-center gap-5 px-5 md:grid-cols-2 md:gap-12 md:px-[max(6vw,28px)]'
        }
      >
        <div>
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-golf-orange">
            {golfHealthSection.label}
          </div>
          <h2 className="mb-5 text-[clamp(28px,3.8vw,48px)] leading-[1.04] font-bold tracking-[-0.04em] text-pretty">
            {golfHealthSection.heading}
          </h2>
          <div className="flex max-w-115 flex-col gap-2.5">
            {golfHealthSection.steps.map((step, index) => {
              const isActive = isStatic || index === activeIndex;
              return (
                <div
                  key={step.id}
                  data-testid={`golf-step-${step.id}`}
                  data-active={isActive}
                  className={`rounded-[20px] border px-4.5 py-4 transition-all duration-350 ${
                    isActive
                      ? 'border-white/20 bg-white/8 opacity-100'
                      : 'border-white/10 bg-transparent opacity-45'
                  }`}
                >
                  <div className="mb-1 text-[16.5px] font-semibold tracking-[-0.2px]">
                    {step.title}
                  </div>
                  <div className="text-[14.5px] leading-[1.45] text-white/55">{step.body}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={
            isStatic
              ? 'relative grid h-[38vh] place-items-center overflow-hidden rounded-[28px] border border-white/8 bg-black'
              : 'relative grid h-[38vh] place-items-center overflow-hidden rounded-[28px] border border-white/8 bg-black md:h-[74vh] md:rounded-[40px]'
          }
        >
          {golfHealthSection.steps.map((step, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.div
                key={step.id}
                className="absolute grid place-items-center"
                aria-hidden={!isActive}
                animate={
                  isStatic
                    ? undefined
                    : { opacity: isActive ? 1 : 0, y: isActive ? 0 : 18, scale: isActive ? 1 : 0.96 }
                }
                transition={{ duration: 0.4, ease: [0.2, 0.9, 0.3, 1] }}
              >
                <GolfShot
                  image={step.image}
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className={step.image.kind === 'watch' ? 'max-h-[44vh]' : 'max-h-[70vh]'}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [x] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/health.area.test.tsx`
Expected: PASS (5 tests)

- [x] **Step 5: `page.tsx`에 붙인다**

- [x] **Step 6: 브라우저에서 확인한다**

스크롤 진행도 50%를 지날 때 이미지와 활성 스텝 카드가 동시에 바뀌는지 확인한다. reduced-motion을 켜고(DevTools → Rendering → Emulate CSS prefers-reduced-motion) 껍데기가 `h-auto`로 접히는지도 본다.

- [x] **Step 7: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 Health pin 2-step 영역 추가

stepIndexAt(value, 2)로 2단 크로스페이드를 만든다.
비활성 이미지는 aria-hidden으로 스크린 리더에서 숨긴다."
```

---

## Task 8: After the round + Holes area

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_areas/after-round.area.tsx`
- Create: `src/app/(main)/apps/golf-counter/_areas/holes.area.tsx`
- Test: `src/app/(main)/apps/golf-counter/_areas/after-round.area.test.tsx`
- Test: `src/app/(main)/apps/golf-counter/_areas/holes.area.test.tsx`
- Modify: `src/app/(main)/apps/golf-counter/page.tsx`

**Interfaces:**
- Consumes: `Reveal` (Task 1), `golfAfterSection`·`golfHolesSection` (Task 2), `GolfShot` (Task 4)
- Produces: `<AfterRoundArea />` · `<HolesArea />`

- [x] **Step 1: 두 테스트를 먼저 작성한다 (실패 예정)**

`after-round.area.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { AfterRoundArea } from './after-round.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('AfterRoundArea', () => {
  it('섹션 라벨과 제목을 렌더한다', () => {
    render(<AfterRoundArea />);
    expect(screen.getByText('AFTER THE ROUND')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Every round adds up.' })).toBeInTheDocument();
  });

  it('갤러리 이미지 2장을 렌더한다', () => {
    render(<AfterRoundArea />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('섹션 id를 노출한다', () => {
    const { container } = render(<AfterRoundArea />);
    expect(container.querySelector('#after')).toBeInTheDocument();
  });
});
```

`holes.area.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { HolesArea } from './holes.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('HolesArea', () => {
  it('제목과 설명을 렌더한다', () => {
    render(<HolesArea />);
    expect(
      screen.getByRole('heading', { name: 'Nine or eighteen. Your call.' }),
    ).toBeInTheDocument();
  });

  it('홀 수 칩 2개를 렌더한다', () => {
    render(<HolesArea />);
    expect(screen.getByText('18 holes')).toBeInTheDocument();
    expect(screen.getByText('9 holes')).toBeInTheDocument();
  });

  it('활성 칩만 data-active가 true다', () => {
    render(<HolesArea />);
    expect(screen.getByText('18 holes')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('9 holes')).toHaveAttribute('data-active', 'false');
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/after-round.area.test.tsx src/app/\(main\)/apps/golf-counter/_areas/holes.area.test.tsx`
Expected: FAIL — 모듈 없음

- [x] **Step 3: `after-round.area.tsx`를 만든다**

```tsx
import { Reveal } from '../../_actions/reveal.action';
import { GolfShot } from '../_components/golf-shot';
import { golfAfterSection } from '../_utils/golf-counter-content';

export function AfterRoundArea() {
  return (
    <section id={golfAfterSection.id} className="px-5 py-16 md:px-[max(6vw,28px)] md:pb-28">
      <div className="mx-auto max-w-280">
        <Reveal className="mb-10 max-w-150">
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-golf-green">
            {golfAfterSection.label}
          </div>
          <h2 className="mb-3 text-[clamp(28px,3.8vw,48px)] leading-[1.04] font-bold tracking-[-0.04em] text-pretty">
            {golfAfterSection.heading}
          </h2>
          <p className="text-[17px] leading-[1.5] text-white/55">{golfAfterSection.body}</p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {golfAfterSection.gallery.map((image, index) => (
            <Reveal key={image.src} delay={index * 0.08}>
              <div className="grid min-h-105 place-items-center rounded-[34px] border border-white/8 bg-black p-7">
                <GolfShot
                  image={image}
                  sizes="(max-width: 768px) 70vw, 34vw"
                  className="max-h-85"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [x] **Step 4: `holes.area.tsx`를 만든다**

```tsx
import { Reveal } from '../../_actions/reveal.action';
import { GolfShot } from '../_components/golf-shot';
import { golfHolesSection } from '../_utils/golf-counter-content';

export function HolesArea() {
  return (
    <section className="px-5 pb-16 md:px-[max(6vw,28px)] md:pb-28">
      <div className="mx-auto max-w-280">
        <Reveal>
          <div className="grid items-center gap-6 rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl md:grid-cols-2 md:gap-10 md:p-9">
            <div>
              <h3 className="mb-2.5 text-[clamp(22px,2.6vw,32px)] leading-[1.1] font-bold tracking-[-0.03em]">
                {golfHolesSection.heading}
              </h3>
              <p className="mb-5 max-w-95 text-[15.5px] leading-[1.5] text-white/55">
                {golfHolesSection.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {golfHolesSection.chips.map((chip) => (
                  <span
                    key={chip.label}
                    data-active={chip.isActive}
                    className={`rounded-full px-3.75 py-2 text-[13px] font-semibold ${
                      chip.isActive ? 'bg-golf-green text-black' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid min-h-70 place-items-center rounded-[26px] border border-white/8 bg-black p-5.5">
              <GolfShot
                image={golfHolesSection.image}
                sizes="(max-width: 768px) 50vw, 24vw"
                className="max-h-50"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [x] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/after-round.area.test.tsx src/app/\(main\)/apps/golf-counter/_areas/holes.area.test.tsx`
Expected: PASS (6 tests)

- [x] **Step 6: `page.tsx`에 붙인다**

- [x] **Step 7: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 After the round·Holes 영역 추가"
```

---

## Task 9: Final CTA area + 페이지 완성

**Files:**
- Create: `src/app/(main)/apps/golf-counter/_areas/final-cta.area.tsx`
- Test: `src/app/(main)/apps/golf-counter/_areas/final-cta.area.test.tsx`
- Modify: `src/app/(main)/apps/golf-counter/page.tsx`

**Interfaces:**
- Consumes: `Reveal` (Task 1), `golfFinalCta`·`golfCounterMeta` (Task 2), `GolfShot` 미사용 — 아이콘은 `next/image` 직접 사용
- Produces: `<FinalCtaArea />`

- [x] **Step 1: 테스트를 먼저 작성한다 (실패 예정)**

```tsx
import { render, screen } from '@testing-library/react';
import { FinalCtaArea } from './final-cta.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('FinalCtaArea', () => {
  it('최종 CTA 제목과 설명을 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByRole('heading', { name: 'Ready for the first tee?' })).toBeInTheDocument();
    expect(
      screen.getByText('Free on the App Store for Apple Watch and iPhone.'),
    ).toBeInTheDocument();
  });

  it('App Store CTA가 실제 URL을 가리킨다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
    );
  });

  it('privacy와 support 링크를 노출한다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/apps/golf-counter/privacy',
    );
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'href',
      'mailto:qlrogo91lp@gmail.com',
    );
  });

  it('앱 아이콘을 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByAltText('GolfCounter app icon')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/final-cta.area.test.tsx`
Expected: FAIL — 모듈 없음

- [x] **Step 3: `final-cta.area.tsx`를 만든다**

시안 푸터의 `© 2026 YJlogs`는 넣지 않는다 — 공용 `Footer`가 이미 렌더한다 (설계 2절).

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '../../_actions/reveal.action';
import { golfCounterMeta, golfFinalCta } from '../_utils/golf-counter-content';

export function FinalCtaArea() {
  return (
    <section className="px-5 pb-14 md:px-[max(6vw,28px)]">
      <Reveal className="mx-auto max-w-280">
        <div className="rounded-[40px] border border-white/10 bg-white/6 px-8 py-16 text-center backdrop-blur-3xl">
          <Image
            src={golfCounterMeta.iconSrc}
            alt={`${golfCounterMeta.name} app icon`}
            width={84}
            height={84}
            className="mx-auto mb-5 rounded-[21px] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          />
          <h2 className="mb-3 text-[clamp(28px,4vw,52px)] leading-none font-bold tracking-[-0.045em]">
            {golfFinalCta.heading}
          </h2>
          <p className="mb-6.5 text-[16.5px] text-white/55">{golfFinalCta.body}</p>
          <a
            href={golfCounterMeta.appStoreUrl}
            className="inline-flex rounded-full bg-golf-green px-7.5 py-4 text-base font-semibold text-black shadow-[0_14px_40px_rgba(52,199,89,0.3)]"
          >
            Download on the App Store
          </a>
          <div className="mt-10 flex justify-center gap-5 text-[13.5px] text-white/45">
            <Link href="/apps/golf-counter/privacy">Privacy Policy</Link>
            <a href={`mailto:${golfCounterMeta.supportEmail}`}>Support</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
```

- [x] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/app/\(main\)/apps/golf-counter/_areas/final-cta.area.test.tsx`
Expected: PASS (4 tests)

- [x] **Step 5: `page.tsx`를 완성한다**

area 6개가 모두 들어간 최종 형태:

```tsx
import type { Metadata } from 'next';
import { AfterRoundArea } from './_areas/after-round.area';
import { CourseArea } from './_areas/course.area';
import { FinalCtaArea } from './_areas/final-cta.area';
import { HealthArea } from './_areas/health.area';
import { HeroArea } from './_areas/hero.area';
import { HolesArea } from './_areas/holes.area';
import { GolfJsonLd } from './_components/golf-json-ld';
import { golfCounterMeta } from './_utils/golf-counter-content';

export const metadata: Metadata = {
  title: `${golfCounterMeta.name} — Golf scores, right on your wrist`,
  description:
    'Count strokes and putts from your Apple Watch, log the round as a HealthKit workout, and review every round on your iPhone.',
};

export default function GolfCounterPage() {
  return (
    <div className="dark relative bg-golf-bg text-golf-fg">
      <GolfJsonLd />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 size-[60vw] rounded-full bg-golf-green/12 blur-[120px]" />
        <div className="absolute top-1/2 -right-[16%] size-[50vw] rounded-full bg-golf-orange/8 blur-[140px]" />
      </div>
      <div className="relative z-[1]">
        <HeroArea />
        <CourseArea />
        <HealthArea />
        <AfterRoundArea />
        <HolesArea />
        <FinalCtaArea />
      </div>
    </div>
  );
}
```

- [x] **Step 6: 전체 검증**

Run: `npm run test:run`
Expected: PASS

Run: `npm run lint`
Expected: 통과

Run: `npm run build`
Expected: 성공

- [x] **Step 7: 커밋**

```bash
git add -A
git commit -m "✨ feat: GolfCounter 랜딩 최종 CTA 추가하고 페이지 조립

area 6개를 page.tsx에 순서대로 나열해 랜딩을 완성한다.
시안 푸터의 저작권 문구는 공용 Footer와 중복이라 넣지 않는다."
```

---

## Task 10: E2E 테스트 + 최종 점검

**Files:**
- Create: `e2e/golf-counter.spec.ts`

**Interfaces:**
- Consumes: 완성된 `/apps/golf-counter` 페이지

- [x] **Step 1: 포트 충돌을 먼저 확인한다**

3000 포트가 다른 프로젝트에 물려 있으면 Playwright의 `webServer`가 엉뚱한 앱에 붙는다.

```bash
lsof -i :3000
```

점유 중이면 해당 프로세스를 정리하거나 종료한 뒤 진행한다.

- [x] **Step 2: E2E 스펙을 작성한다**

`e2e/golf-counter.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('GolfCounter 랜딩', () => {
  test('히어로가 렌더되고 App Store CTA가 동작한다', async ({ page }) => {
    await page.goto('/apps/golf-counter');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Play the round.');
    await expect(page.getByText('Live on Apple Watch & iPhone')).toBeVisible();

    const cta = page.getByRole('link', { name: /Download on the App Store/i }).first();
    await expect(cta).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
    );
  });

  test('스크롤하면 모든 섹션이 나타난다', async ({ page }) => {
    await page.goto('/apps/golf-counter');

    await expect(
      page.getByRole('heading', { name: 'Everything happens on your wrist.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'A round is a workout — logged automatically.' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Every round adds up.' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Nine or eighteen. Your call.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ready for the first tee?' }),
    ).toBeVisible();
  });

  test('privacy 링크로 이동한다', async ({ page }) => {
    await page.goto('/apps/golf-counter');
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL('/apps/golf-counter/privacy');
  });

  test('reduced-motion에서 pin 섹션이 접혀 페이지가 짧아진다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/apps/golf-counter');

    const height = await page.evaluate(() => document.body.scrollHeight);
    // pin 껍데기(300vh + 280vh)가 접히면 전체 높이가 크게 줄어든다
    expect(height).toBeLessThan(8000);
  });
});
```

- [x] **Step 3: E2E를 실행한다**

Run: `npm run test:e2e`
Expected: PASS (4 tests)

- [x] **Step 4: 모바일 뷰포트를 직접 확인한다**

`resize_window` preset `mobile`로 바꾸고 페이지를 새로고침한 뒤 확인한다:

- hero 칩 4개가 화면 밖으로 나가지 않는가 (세로 위주 이동 벡터가 적용됐는가)
- 베이토·2열 갤러리·룰 카드가 모두 1컬럼으로 접히는가
- health pin 패널이 `38vh`로 낮아지는가
- 가로 스크롤이 생기지 않는가

- [x] **Step 5: 최종 검증 4종**

```bash
npm run lint && npm run test:run && npm run build && npm run test:e2e
```

Expected: 전부 통과

- [x] **Step 6: 커밋**

```bash
git add -A
git commit -m "✅ test: GolfCounter 랜딩 E2E 테스트 추가"
```

- [x] **Step 7: plan 문서에 완료 기록을 남긴다**

이 파일 상단에 완료 일자와 결과 요약을 추가한다 (CLAUDE.md의 Plan 파일 실행 규칙).

- [x] **Step 8: PR 생성**

```bash
git push -u origin feature/golf-counter-landing
```

`develop`을 대상으로 PR을 만든다. squash 머지 금지 — `--no-ff` 머지 커밋을 남긴다.

---

## 완료 조건

- [x] `/apps/golf-counter`가 B안 레이아웃 · 다크 테마로 렌더된다
- [x] `/apps/ralli`가 이전과 동일하게 동작한다 (모션 인프라 이동에 따른 회귀 없음)
- [x] `npm run lint` · `npm run test:run` · `npm run build` · `npm run test:e2e` 전부 통과
- [x] reduced-motion에서 pin 섹션이 접히고 모든 콘텐츠가 최종 상태로 보인다
- [x] 모바일에서 가로 스크롤이 발생하지 않는다
- [x] App Store URL이 `golfCounterMeta.appStoreUrl` 한 곳에만 존재한다
