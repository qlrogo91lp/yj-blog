# Ralli 랜딩 reduced-motion 접근성 결함 수정 Implementation Plan

> **완료: 2026-08-18.** Task 0~4 전부 subagent-driven-development로 실행 완료, 최종 전체 브랜치
> 리뷰(Critical 0건 · Important 1건 → fix wave 1회로 해소 · 재검토 클린)까지 마쳤다.
> 계획에 없던 발견: 최종 리뷰에서 `replay.area.tsx`가 `useNativeScroll = isMobile || isStatic`
> 별칭 뒤에 같은 결함 패턴을 숨기고 있었음을 찾았다 — 스펙 작성 시점의 정규식 조사가 리터럴
> `isStatic` 토큰만 찾아 놓친 것. 다른 4곳과 동일한 엘리먼트 타입 교체로 함께 고치고, 회귀 테스트와
> 함께 README §6·§7.1 사이의 자기모순도 해소했다. 상세 기록은 최종 커밋 히스토리 참고
> (`17a0345..e72da79`, `develop` 기준).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `prefers-reduced-motion`을 켠 사용자에게 `/apps/ralli` 히어로의 h1·부제·App Store CTA·스코어가 보이지 않는 결함을 고치고, 재발을 막는 회귀 테스트를 남긴다.

**Architecture:** 원인은 `style={isStatic ? undefined : {...}}` 패턴이다. hydration 첫 렌더가 애니메이션 경로를 타면서 framer-motion이 DOM에 인라인 스타일을 직접 기록하는데, 이후 `style`이 `undefined`가 되어도 React는 자기가 소유한 적 없는 그 스타일을 지우지 않는다. 해결은 `isStatic` 분기에서 **`motion.*`이 아닌 평범한 엘리먼트를 반환**해 React가 DOM 노드를 통째로 교체하게 만드는 것이다. 같은 파일의 `HeroLetter`와 공용 `Reveal`이 이미 쓰는 방식이라 새 패턴 도입이 아니다.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · framer-motion 12 · Tailwind CSS v4 · Vitest + Testing Library · Playwright

**Spec:** [`docs/superpowers/specs/2026-08-18-ralli-reduced-motion-fix-design.md`](../specs/2026-08-18-ralli-reduced-motion-fix-design.md)

## Global Constraints

- **동작 변경 금지 (애니메이션 경로)**: 이 작업은 `isStatic === true`일 때의 렌더 결과만 바꾼다. reduced-motion을 끈 일반 사용자에게는 시각적으로 완전히 동일해야 한다
- **코트 SVG(`hero.area.tsx` 내 `RalliCourtSvg` 래퍼)는 건드리지 않는다** — `isStatic`일 때 `undefined`가 아니라 `{ opacity: 0.5 }`라는 구체적 값을 넘기므로 이미 안전하다
- **`watch.area.tsx`의 `animate` 방식은 유지한다** — 항상 구체적 값을 넘기므로 안전하다. 엘리먼트 타입 교체가 필요 없다
- 코드 주석과 테스트 이름은 한국어
- Vitest는 `globals: true`라 `describe`/`it`/`expect`를 import하지 않는다. `next/image`는 반드시 `vi.mock`
- Tailwind v4 문법: 4배수 px는 숫자 유틸리티(`max-w-100`), CSS 변수는 `(--x)`, 그라디언트는 `bg-linear-*`
- 커밋은 gitmoji 사용, squash 금지
- 브랜치: `develop`에서 `fix/ralli-hero-reduced-motion` 생성

---

## Task 0: 브랜치 생성과 기준선 확인

**Files:** 없음

- [x] **Step 1: develop 최신화 후 브랜치 생성**

```bash
git checkout develop && git pull && git checkout -b fix/ralli-hero-reduced-motion
```

- [x] **Step 2: 기준선 테스트가 전부 통과하는지 확인**

Run: `npm run test:run`
Expected: PASS. 실패가 있으면 이 작업과 무관한 기존 문제이므로 먼저 보고할 것.

- [x] **Step 3: 결함을 직접 눈으로 확인한다 (수정 전 상태 기록)**

임시 파일 `src/app/(main)/apps/ralli/_areas/__probe.test.tsx`를 만든다:

```tsx
import { act } from 'react';
import { type Root, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeAll(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (q: string) =>
      ({
        matches: q.includes('prefers-reduced-motion'),
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
});

describe('수정 전 결함 확인', () => {
  it('stale 인라인 스타일을 덤프한다', async () => {
    const c = document.createElement('div');
    c.innerHTML = renderToString(<HeroArea />);
    document.body.appendChild(c);
    let root: Root;
    await act(async () => {
      root = hydrateRoot(c, <HeroArea />);
    });

    [...c.querySelectorAll('[style]')]
      .filter((el) => el.getAttribute('style')?.trim())
      .forEach((el) => console.log(`style="${el.getAttribute('style')}"`));

    await act(async () => {
      root!.unmount();
    });
    c.remove();
  });
});
```

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/__probe.test.tsx"`

Expected: 아래 5줄이 출력된다. 이게 수정 전 기준점이다.

```
style="transform:scale(0.7)"                                          ← glow (장식)
style="opacity: 0.5; transform: perspective(900px) ..."               ← 코트 SVG (의도됨, 수정 안 함)
style="opacity:1;transform:scale(0.62) rotate(-4deg)"                 ← 워치 이미지
style="opacity:0"                                                     ← 스코어 (콘텐츠 손실)
style="opacity:0;transform:translateY(40px)"                          ← h1+부제+CTA (콘텐츠 손실)
```

- [x] **Step 4: 임시 파일 삭제**

```bash
rm "src/app/(main)/apps/ralli/_areas/__probe.test.tsx"
```

커밋하지 않는다. 이 확인의 결과는 Task 1의 회귀 테스트가 영구적으로 대체한다.

---

## Task 1: hero.area.tsx의 `isStatic` 분기를 평범한 엘리먼트로 교체

**Files:**
- Modify: `src/app/(main)/apps/ralli/_areas/hero.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx` (신규)

**Interfaces:**
- Consumes: `useSectionProgress(offset)` → `{ ref, progress, isStatic }` (기존), `scoreAt(progress)` → `RalliScore` (기존)
- Produces: 없음 (외부 인터페이스 변화 없음 — `HeroArea`의 props와 export는 그대로다)

- [x] **Step 1: 회귀 테스트를 먼저 작성한다 (실패 예정)**

`src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx`:

```tsx
import { act } from 'react';
import { type Root, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

/**
 * framer-motion은 reduced-motion 상태를 모듈 싱글턴에 캐시한다.
 * 일반 렌더가 한 번이라도 먼저 돌면 false로 굳어 static 분기에 진입할 수 없으므로,
 * 이 검증은 파일을 분리해 첫 렌더부터 reduced-motion으로 시작한다.
 */
beforeAll(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
});

/**
 * 실제 브라우저의 SSR → hydration 시퀀스를 재현한다.
 *
 * RTL의 render()는 createRoot를 쓰는데, createRoot는 useSyncExternalStore의
 * getServerSnapshot(= mounted:false)을 호출하지 않는다. 즉 mounted가 첫 렌더부터
 * true여서 "motion 경로가 먼저 마운트되고 → framer-motion이 인라인 스타일을 쓰고
 * → isStatic이 true로 뒤집힌다"는 결함 시퀀스가 재현되지 않는다.
 * renderToString + hydrateRoot만이 이 순서를 만든다.
 */
async function hydrateHero() {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<HeroArea />);
  document.body.appendChild(container);

  let root: Root;
  await act(async () => {
    root = hydrateRoot(container, <HeroArea />);
  });

  return {
    container,
    cleanup: async () => {
      await act(async () => {
        root!.unmount();
      });
      container.remove();
    },
  };
}

describe('HeroArea — reduced-motion hydration 회귀', () => {
  it('태그라인·CTA 블록에 stale 인라인 스타일이 남지 않는다', async () => {
    const { container, cleanup } = await hydrateHero();

    const copyBlock = container.querySelector('h1')?.closest('div');
    expect(copyBlock).toBeTruthy();
    expect(copyBlock?.style.opacity).toBe('');
    expect(copyBlock?.style.transform).toBe('');

    await cleanup();
  });

  it('스코어 블록에 stale 인라인 스타일이 남지 않는다', async () => {
    const { container, cleanup } = await hydrateHero();

    const scoreBlock = container
      .querySelector('[data-testid="ralli-hero-score"]')
      ?.closest('div');
    expect(scoreBlock).toBeTruthy();
    expect(scoreBlock?.style.opacity).toBe('');

    await cleanup();
  });

  it('워치 이미지 래퍼에 stale transform이 남지 않는다', async () => {
    const { container, cleanup } = await hydrateHero();

    const shot = container.querySelector('img[alt*="Apple Watch"]');
    const shotWrapper = shot?.closest('div');
    expect(shotWrapper).toBeTruthy();
    expect(shotWrapper?.style.transform).toBe('');

    await cleanup();
  });

  it('App Store CTA와 태그라인이 DOM에 존재한다', async () => {
    const { container, cleanup } = await hydrateHero();

    expect(container.querySelector('h1')?.textContent).toContain('right on your wrist.');
    expect(container.querySelector('a[href*="apps.apple.com"]')).toBeTruthy();

    await cleanup();
  });
});
```

- [x] **Step 2: 실패를 확인한다 — 이게 결함의 증거다**

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx"`

Expected: **FAIL 3건** (첫 3개 테스트). 실제 오류 메시지는 아래와 같아야 한다:

```
expected 'opacity:0' to be ''        ← 태그라인 블록
expected 'opacity:0' to be ''        ← 스코어 블록
expected 'scale(0.62) rotate(-4deg)' to be ''  ← 워치 래퍼
```

네 번째 테스트(DOM 존재 확인)는 통과한다 — 요소는 있고 `opacity:0`으로 안 보이는 것뿐이기 때문이다. **이 대비가 결함의 성격을 정확히 보여준다.**

- [x] **Step 3: 공유 마크업을 조각 컴포넌트로 추출한다**

`hero.area.tsx`의 `HeroLetter` 정의 **바로 아래**에 추가한다. 두 분기가 같은 내용을 중복하지 않게 하는 것이 목적이다:

```tsx
const GLOW_CLASS =
  'absolute size-[120vh] rounded-full bg-[radial-gradient(circle,rgba(200,255,61,0.16)_0%,rgba(52,199,89,0.06)_40%,transparent_68%)] blur-[10px]';
const WATCH_CLASS = 'relative z-3';
const SCORE_CLASS =
  'pointer-events-none absolute right-[max(6vw,32px)] top-[18%] z-4 text-right md:top-1/2';
const COPY_CLASS =
  'absolute bottom-[10vh] left-[max(6vw,32px)] right-[max(6vw,32px)] z-4 max-w-100 md:bottom-[14vh] md:right-auto';

function HeroWatchShot() {
  return (
    <RalliShot
      image={ralliHeroShot}
      priority
      sizes="(max-width: 768px) 44vh, 64vh"
      className="h-[44vh] max-h-140 md:h-[64vh]"
    />
  );
}

function HeroScore({ score }: { score: RalliScore }) {
  return (
    <>
      <p className="mb-1.5 text-xs font-bold tracking-[0.22em] text-ralli-fg/45">GAME POINT</p>
      <p
        data-testid="ralli-hero-score"
        className={cn(
          'font-extrabold leading-[0.85] tracking-[-0.05em] text-ralli-lime tabular-nums',
          score === 'GAME' ? 'text-[min(7vw,84px)]' : 'text-[min(11vw,132px)]',
        )}
      >
        {score}
      </p>
    </>
  );
}

function HeroCopy() {
  return (
    <>
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
        <span className="text-[13px] text-ralli-fg/40">{ralliMeta.platforms}</span>
      </div>
    </>
  );
}
```

- [x] **Step 4: glow를 엘리먼트 타입 분기로 바꾼다**

기존:

```tsx
        <motion.div
          aria-hidden="true"
          style={isStatic ? undefined : { scale: glowScale }}
          className="absolute size-[120vh] rounded-full bg-[radial-gradient(circle,rgba(200,255,61,0.16)_0%,rgba(52,199,89,0.06)_40%,transparent_68%)] blur-[10px]"
        />
```

교체:

```tsx
        {isStatic ? (
          <div aria-hidden="true" className={GLOW_CLASS} />
        ) : (
          <motion.div aria-hidden="true" style={{ scale: glowScale }} className={GLOW_CLASS} />
        )}
```

- [x] **Step 5: 워치 이미지를 엘리먼트 타입 분기로 바꾼다**

기존 (`RalliShot`을 감싼 `motion.div` 블록 전체):

```tsx
        <motion.div
          style={
            isStatic
              ? undefined
              : { scale: watchScale, rotate: watchRotate, y: watchY, opacity: watchOpacity }
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
```

교체:

```tsx
        {isStatic ? (
          <div className={WATCH_CLASS}>
            <HeroWatchShot />
          </div>
        ) : (
          <motion.div
            style={{ scale: watchScale, rotate: watchRotate, y: watchY, opacity: watchOpacity }}
            className={WATCH_CLASS}
          >
            <HeroWatchShot />
          </motion.div>
        )}
```

- [x] **Step 6: 스코어 블록을 엘리먼트 타입 분기로 바꾼다**

기존 `style={isStatic ? undefined : { opacity: scoreOpacity }}`를 가진 `motion.div` 블록 전체를 교체:

```tsx
        {isStatic ? (
          <div className={SCORE_CLASS}>
            <HeroScore score={score} />
          </div>
        ) : (
          <motion.div style={{ opacity: scoreOpacity }} className={SCORE_CLASS}>
            <HeroScore score={score} />
          </motion.div>
        )}
```

- [x] **Step 7: 태그라인·CTA 블록을 엘리먼트 타입 분기로 바꾼다**

기존 `style={isStatic ? undefined : { opacity: copyOpacity, y: copyY }}`를 가진 `motion.div` 블록 전체를 교체:

```tsx
        {isStatic ? (
          <div className={COPY_CLASS}>
            <HeroCopy />
          </div>
        ) : (
          <motion.div style={{ opacity: copyOpacity, y: copyY }} className={COPY_CLASS}>
            <HeroCopy />
          </motion.div>
        )}
```

- [x] **Step 8: 회귀 테스트가 통과하는지 확인한다**

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx"`
Expected: PASS (4 tests)

- [x] **Step 9: 테스트가 진짜로 결함을 잡는지 증명한다 (RED/GREEN)**

"테스트가 존재하고 통과한다"는 "테스트가 의미 있다"를 보장하지 않는다. 직접 확인한다.

Step 7에서 바꾼 태그라인 블록을 **일시적으로** 원래의 결함 패턴으로 되돌린다:

```tsx
        <motion.div
          style={isStatic ? undefined : { opacity: copyOpacity, y: copyY }}
          className={COPY_CLASS}
        >
          <HeroCopy />
        </motion.div>
```

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx"`
Expected: **FAIL** — `expected 'opacity:0' to be ''`

확인했으면 Step 7의 수정본으로 **되돌린다**. 다시 실행해 PASS를 확인한다.

이 RED/GREEN 증거를 보고서에 남긴다.

- [x] **Step 10: 기존 hero 테스트가 깨지지 않았는지 확인한다**

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/hero.area.test.tsx"`
Expected: PASS (4 tests) — 애니메이션 경로의 DOM 구조는 바뀌지 않았으므로 그대로 통과해야 한다.

- [x] **Step 11: 전체 검증**

Run: `npm run test:run`
Expected: PASS

Run: `npm run lint`
Expected: 통과 (`docs/design/ralli/support.js`의 기존 에러 2건은 이 작업과 무관하다)

Run: `npm run build`
Expected: 성공

- [x] **Step 12: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_areas/hero.area.tsx" "src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx"
git commit -m "🐛 fix: reduced-motion에서 히어로 태그라인·CTA·스코어가 안 보이던 문제 수정

useMounted가 첫 렌더에 false를 반환해 reduced-motion 사용자도 motion 경로를
한 번 타는데, framer-motion이 직접 쓴 인라인 스타일은 이후 style이 undefined가
되어도 지워지지 않는다. isStatic 분기에서 motion.* 대신 평범한 엘리먼트를
반환해 React가 DOM 노드를 교체하도록 바꿨다.

renderToString + hydrateRoot로 실제 hydration 시퀀스를 재현하는 회귀 테스트를
추가했다. RTL의 render()는 createRoot라 이 시퀀스를 재현하지 못한다."
```

---

## Task 2: watch.area.tsx 접근성 2건

README의 "남아있는 개선 여지"에 기록되어 있던 항목이다. Task 1과 파일도 성격도 다르므로 별도 커밋으로 분리한다.

**Files:**
- Modify: `src/app/(main)/apps/ralli/_components/ralli-shot.tsx`
- Modify: `src/app/(main)/apps/ralli/_areas/watch.area.tsx`
- Test: `src/app/(main)/apps/ralli/_areas/watch.area.test.tsx` (기존 파일에 케이스 추가)

**Interfaces:**
- Consumes: `RalliShot({ image, className?, sizes?, priority? })` (기존)
- Produces: `RalliShot({ image, className?, sizes?, priority?, ariaHidden? })` — `ariaHidden`은 optional이라 기존 호출부(`replay`·`rules`·`workout`·`hero` area) 전부 무영향

- [x] **Step 1: 테스트를 먼저 추가한다 (실패 예정)**

`src/app/(main)/apps/ralli/_areas/watch.area.test.tsx`의 마지막 `it` 블록 뒤, 닫는 `});` 앞에 추가한다.

기존 `vi.mock('next/image', ...)`는 `aria-hidden`을 전달하지 않으므로 **먼저 mock을 교체**한다:

```tsx
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    'aria-hidden': ariaHidden,
  }: {
    src: string;
    alt: string;
    'aria-hidden'?: boolean;
  }) => <img src={src} alt={alt} aria-hidden={ariaHidden} />,
}));
```

그리고 케이스를 추가한다:

```tsx
  it('비활성 이미지는 스크린 리더에서 숨긴다', () => {
    render(<WatchArea />);

    // 이미지 자신에 aria-hidden이 붙어야 한다 — 래퍼 div에 걸면 접근성 트리에서
    // img 요소 자체는 여전히 노출된다
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(ralliWatchSection.steps.length);
    expect(images[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(images[1]).toHaveAttribute('aria-hidden', 'true');
    expect(images[2]).toHaveAttribute('aria-hidden', 'true');
  });
```

파일 상단 import에 추가한다:

```tsx
import { ralliWatchSection } from '../_utils/ralli-content';
```

- [x] **Step 2: 실패를 확인한다**

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/watch.area.test.tsx"`
Expected: FAIL — `expected <img> to have attribute 'aria-hidden="true"'`

- [x] **Step 3: `RalliShot`에 `ariaHidden` prop을 추가한다**

`src/app/(main)/apps/ralli/_components/ralli-shot.tsx` 전문을 교체한다:

```tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { RalliImage } from '../_utils/ralli-content';

type Props = {
  image: RalliImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
  ariaHidden?: boolean;
};

export function RalliShot({ image, className, sizes, priority = false, ariaHidden }: Props) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes ?? (image.kind === 'watch' ? '(max-width: 768px) 40vw, 26vw' : '(max-width: 768px) 60vw, 30vw')}
      priority={priority}
      aria-hidden={ariaHidden}
      className={cn('ralli-shot-mask w-auto object-contain', className)}
    />
  );
}
```

`ariaHidden`을 넘기지 않으면 `undefined`가 되어 속성이 렌더되지 않는다 — 기존 호출부는 동작이 변하지 않는다.

- [x] **Step 4: watch.area.tsx의 이미지 루프를 고친다**

기존:

```tsx
          {ralliWatchSection.steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="absolute"
              animate={{
                opacity: isStatic ? (index === 0 ? 1 : 0) : index === activeIndex ? 1 : 0,
                scale: index === activeIndex ? 1 : 0.94,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <RalliShot image={step.image} className="max-h-[38vh] md:max-h-[58vh]" />
            </motion.div>
          ))}
```

교체 — "지금 보여줄 이미지"를 변수 하나로 뽑아 `opacity`·`scale`·`aria-hidden` 셋이 항상 같은 판단을 따르게 한다:

```tsx
          {ralliWatchSection.steps.map((step, index) => {
            // static일 때는 첫 장만 보여준다. scale도 이 판단을 따라야
            // 정적 모드에서 축소된 채로 남지 않는다.
            const isShown = isStatic ? index === 0 : index === activeIndex;
            return (
              <motion.div
                key={step.id}
                className="absolute"
                animate={{ opacity: isShown ? 1 : 0, scale: isShown ? 1 : 0.94 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <RalliShot
                  image={step.image}
                  ariaHidden={!isShown}
                  className="max-h-[38vh] md:max-h-[58vh]"
                />
              </motion.div>
            );
          })}
```

> `animate`에 항상 구체적 값을 넘기는 방식은 그대로 유지한다. 이 패턴은 framer-motion이 스타일 소유권을 계속 갖고 있어 Task 1이 고친 결함과 무관하다.

- [x] **Step 5: 통과를 확인한다**

Run: `npx vitest run "src/app/(main)/apps/ralli/_areas/watch.area.test.tsx"`
Expected: PASS (5 tests)

- [x] **Step 6: `RalliShot`을 쓰는 다른 area가 깨지지 않았는지 확인한다**

Run: `npm run test:run`
Expected: PASS. `replay`·`rules`·`workout`·`hero` area 테스트와 `ralli-shot.test.tsx`가 전부 통과해야 한다.

Run: `npm run lint && npm run build`
Expected: 통과

- [x] **Step 7: 커밋**

```bash
git add "src/app/(main)/apps/ralli/_components/ralli-shot.tsx" "src/app/(main)/apps/ralli/_areas/watch.area.tsx" "src/app/(main)/apps/ralli/_areas/watch.area.test.tsx"
git commit -m "♿️ fix: watch 섹션 비활성 이미지를 스크린 리더에서 숨기고 scale wobble 제거

비활성 이미지 3장이 opacity:0으로만 가려져 스크린 리더에는 전부 읽혔다.
RalliShot에 optional ariaHidden prop을 추가해 <img> 자신에 전달한다
(래퍼 div에 걸면 img 요소는 접근성 트리에 그대로 남는다).

scale이 isStatic을 반영하지 않아 정적 모드에서 축소된 채 남던 문제도
isShown 하나로 판단을 통일해 함께 고쳤다."
```

---

## Task 3: E2E reduced-motion 테스트 강화

**Files:**
- Modify: `e2e/ralli.spec.ts`

**Interfaces:**
- Consumes: Task 1·2의 수정 결과
- Produces: 없음

- [x] **Step 1: 기존 테스트가 왜 이 결함을 놓쳤는지 확인한다**

`e2e/ralli.spec.ts`에는 이미 `reduced-motion` describe 블록이 있고 통과하고 있었다. 놓친 이유는 두 가지다:

1. 히어로가 아닌 **다른 섹션의 제목만** 확인했다 (`All on your wrist.` 등)
2. **Playwright의 `toBeVisible()`은 `opacity:0`을 "보이지 않음"으로 판정하지 않는다.** 요소가 빈 bounding box가 아니고 `visibility:hidden`/`display:none`이 아니면 visible로 본다

따라서 새 테스트는 **계산된 `opacity`를 직접** 확인해야 한다. 그리고 stale 스타일은 **래퍼**에 붙으므로 조상의 `opacity`까지 누적해서 봐야 한다.

- [x] **Step 2: 포트 충돌을 확인한다**

```bash
lsof -i :3000
```

다른 프로젝트가 점유 중이면 정리한다. 이 저장소에서 반복되는 이슈다.

- [x] **Step 3: 기존 `reduced-motion` describe 블록에 케이스를 추가한다**

`e2e/ralli.spec.ts`의 `test.describe('reduced-motion', ...)` 블록 안, 기존 `test` 뒤에 추가한다:

```ts
  test('히어로 태그라인·CTA·스코어가 실제로 보인다', async ({ page }) => {
    await page.goto('/apps/ralli');

    // toBeVisible()은 opacity:0을 감지하지 못한다.
    // stale 스타일은 래퍼에 붙으므로 조상의 opacity까지 곱해 실효값을 구한다.
    const effectiveOpacity = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          let node: HTMLElement | null = el as HTMLElement;
          let acc = 1;
          while (node) {
            acc *= Number(getComputedStyle(node).opacity);
            node = node.parentElement;
          }
          return acc;
        });

    expect(await effectiveOpacity('h1')).toBeGreaterThan(0.9);
    expect(await effectiveOpacity(`a[href="${APP_STORE_URL}"]`)).toBeGreaterThan(0.9);
    expect(await effectiveOpacity('[data-testid="ralli-hero-score"]')).toBeGreaterThan(0.9);
  });

  test('히어로 워치 이미지가 축소되지 않는다', async ({ page }) => {
    await page.goto('/apps/ralli');

    const transform = await page
      .locator('img[alt*="Apple Watch"]')
      .first()
      .evaluate((el) => {
        const wrapper = el.closest('div');
        return wrapper ? getComputedStyle(wrapper).transform : '';
      });

    // 결함이 있으면 scale(0.62) rotate(-4deg)가 남는다
    expect(['none', '']).toContain(transform);
  });
```

- [x] **Step 4: E2E를 실행한다**

Run: `npm run test:e2e -- e2e/ralli.spec.ts`

Expected: 새로 추가한 2개 테스트 PASS.

> **알려진 기존 실패**: 같은 파일의 `모바일 › 가로 스크롤이 발생하지 않는다`는 사이트 전역 `min-w-100`(400px, `src/app/layout.tsx`) 때문에 **`develop`에서도 실패한다.** 이 작업의 회귀가 아니며 범위 밖이다. 실패하더라도 고치지 말고 그대로 둔다.

- [x] **Step 5: 커밋**

```bash
git add e2e/ralli.spec.ts
git commit -m "✅ test: reduced-motion 히어로 콘텐츠 가시성 E2E 추가

기존 reduced-motion 테스트는 히어로가 아닌 섹션 제목만 확인했고,
toBeVisible()이 opacity:0을 감지하지 못해 이 결함을 놓쳤다.
조상 opacity를 누적한 실효값과 래퍼 transform을 직접 단언한다."
```

---

## Task 4: README 갱신과 최종 검증

**Files:**
- Modify: `src/app/(main)/apps/ralli/README.md`

**Interfaces:**
- Consumes: Task 1·2의 수정 결과
- Produces: 없음

- [x] **Step 1: 7절 "reduced-motion 폴백 설계"에 판별 기준을 추가한다**

`## 7. reduced-motion 폴백 설계`(L375 부근)의 표 아래, `## 8`이 시작되기 전에 추가한다:

````markdown
### 7.1 `isStatic` 분기에서 하면 안 되는 것

`motion.*` 요소의 `style`/`animate`를 `undefined`로 토글하는 방식은 **동작하지 않는다.**

```tsx
// ❌ 결함 — reduced-motion 사용자에게 콘텐츠가 안 보인다
<motion.div style={isStatic ? undefined : { opacity: copyOpacity }}>
```

`useMounted`가 hydration mismatch를 피하려고 첫 렌더에 `false`를 반환하므로, reduced-motion 사용자도 **첫 렌더는 반드시 motion 경로를 탄다.** 그때 framer-motion이 인라인 스타일을 DOM에 직접 쓴다(React의 style diffing 밖에서 일어난다). 이후 `isStatic`이 `true`가 되어 `style`이 `undefined`가 되어도, React는 자기가 소유한 적 없는 그 스타일을 지우지 않는다.

안전한 방법은 두 가지다.

```tsx
// ✅ 엘리먼트 타입을 바꾼다 — React가 노드를 교체해 stale 스타일이 따라오지 않는다
if (isStatic) return <div className={CLASS}>{children}</div>;
return <motion.div style={{ opacity }} className={CLASS}>{children}</motion.div>;

// ✅ 구체적인 값을 넘긴다 — framer-motion이 소유권을 유지하며 값을 갱신한다
<motion.div animate={{ opacity: isShown ? 1 : 0 }} />
```

이 결함은 2026-08-18에 실제로 발견되어 수정됐다. 당시 히어로의 h1·부제·App Store CTA·스코어가 reduced-motion 사용자에게 보이지 않았다. 회귀 테스트는 [`_areas/hero.area.reduced-motion.test.tsx`](_areas/hero.area.reduced-motion.test.tsx)에 있다 — RTL의 `render()`(`createRoot`)로는 이 시퀀스를 재현할 수 없어 `renderToString` + `hydrateRoot`를 쓴다.
````

- [x] **Step 2: 10절 "남아있는 개선 여지"에서 해결된 2건을 제거한다**

`## 10. 남아있는 개선 여지`(L435 부근)에서 아래 두 항목을 **삭제**한다:

```markdown
- **watch 섹션의 비활성 이미지 3장이 `opacity: 0`으로만 숨겨져 있다** ([watch.area.tsx:67-79](_areas/watch.area.tsx)) — 스크린 리더에는 3장이 모두 노출된다. `aria-hidden={index !== activeIndex}`가 필요하다.
- **`isStatic`일 때 이미지의 `scale` wobble이 남는다** — 같은 위치에서 `opacity`만 `isStatic`을 반영하고 `scale`은 `activeIndex`를 계속 따라간다.
```

나머지 항목(`useSectionProgress`의 불필요한 스프링, 카운트업 리렌더, `LETTER_DIRECTIONS` 길이 미연동)은 **그대로 둔다** — 이번 범위가 아니다.

- [x] **Step 3: 파일 맵의 hero 줄 수를 갱신한다**

8절 파일 맵 표에서 `_areas/hero.area.tsx`의 라인 수를 실제 값으로 고친다.

```bash
wc -l "src/app/(main)/apps/ralli/_areas/hero.area.tsx"
```

출력된 숫자로 표의 값을 교체한다.

- [x] **Step 4: 링크가 실제 파일을 가리키는지 확인한다**

Step 1에서 추가한 `[_areas/hero.area.reduced-motion.test.tsx](_areas/hero.area.reduced-motion.test.tsx)`가 실재하는지 확인한다:

```bash
ls "src/app/(main)/apps/ralli/_areas/hero.area.reduced-motion.test.tsx"
```

- [x] **Step 5: 최종 검증 4종**

```bash
npm run lint && npm run test:run && npm run build && npm run test:e2e -- e2e/ralli.spec.ts
```

Expected: lint는 기존 무관 에러 2건만, 테스트·빌드 통과, E2E는 알려진 `min-w-100` 실패를 제외하고 통과.

- [x] **Step 6: 커밋**

```bash
git add "src/app/(main)/apps/ralli/README.md"
git commit -m "📝 docs: reduced-motion 분기 판별 기준 추가하고 해결된 이슈 정리

7.1절에 style/animate를 undefined로 토글하면 안 되는 이유와 안전한
두 가지 대안을 기록한다. 10절에서 이번에 해결된 watch 접근성 2건을 뺀다."
```

- [x] **Step 7: PR 생성**

```bash
git push -u origin fix/ralli-hero-reduced-motion
```

`develop`을 대상으로 PR을 만든다. squash 머지 금지 — `--no-ff` 머지 커밋을 남긴다.

---

## 완료 조건

- [x] reduced-motion에서 `/apps/ralli` 히어로의 h1·부제·App Store CTA·스코어가 보인다
- [x] 워치 이미지가 축소·회전되지 않고 정상 크기로 렌더된다
- [x] watch 섹션의 비활성 이미지가 스크린 리더에 노출되지 않는다
- [x] `hero.area.reduced-motion.test.tsx`가 결함 패턴을 되돌리면 **실패한다** (Task 1 Step 9에서 증명)
- [x] reduced-motion을 끈 일반 사용자에게는 시각적 변화가 없다 (기존 area 테스트 6개 통과로 확인)
- [x] `npm run lint` · `npm run test:run` · `npm run build` 통과
- [x] README 7.1절에 판별 기준이 기록되어 있다
