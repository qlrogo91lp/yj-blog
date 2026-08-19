# Ralli 랜딩 reduced-motion 접근성 결함 수정 — 설계 문서

> 작성일: 2026-08-18
> 대상 라우트: `src/app/(main)/apps/ralli`
> 배경: [GolfCounter 랜딩 B안](2026-08-18-golf-counter-landing-b-design.md) 구현 중 발견된 결함이 이미 배포된 `/apps/ralli`에도 존재함을 실측으로 확인했다. `prefers-reduced-motion`을 켠 사용자에게 히어로의 h1·부제·App Store CTA·스코어가 **보이지 않는다.**

## 1. 결함의 메커니즘

### 1.1 왜 발생하는가

`useSectionProgress`가 반환하는 `isStatic`은 `prefersReducedMotion && mounted`이고, `mounted`는 [`apps/_hooks/useMounted.ts`](../../../src/app/\(main\)/apps/_hooks/useMounted.ts)의 `useSyncExternalStore`가 만든다. hydration mismatch를 피하려고 **서버·hydration 시점에는 항상 `false`** 를 반환한다.

따라서 reduced-motion 사용자도 **첫 렌더는 반드시 애니메이션 경로를 탄다.** 이때 framer-motion이 `motion.div`의 DOM 노드에 인라인 스타일을 **직접 기록**한다 — React의 style diffing을 우회하는 명령형 쓰기다.

hydration이 끝나면 `mounted`가 `true`가 되어 `isStatic`이 `true`로 바뀌고, `style={isStatic ? undefined : {...}}` 패턴에 의해 `style` prop이 `undefined`가 된다. 그런데 **React는 자기가 소유한 적 없는 인라인 스타일을 지우지 않는다.** framer-motion이 쓴 값이 그대로 DOM에 남는다.

```
1st render  isStatic=false → motion 경로 → framer-motion이 opacity:0 을 DOM에 직접 씀
             ↓ hydration 완료
2nd render  isStatic=true  → style={undefined} → React는 아무것도 안 지움
             ↓
결과        opacity:0 이 영구히 남음
```

### 1.2 실측 결과

`renderToString` → `hydrateRoot` 시퀀스를 `matchMedia`가 reduced-motion을 반환하도록 mock한 상태에서 재현해 DOM을 덤프했다. hydration 이후 **5개 요소에 stale 인라인 스타일이 잔존**한다.

| 요소 | 잔존 스타일 | 진행도 0에서의 원인값 | 영향 |
|---|---|---|---|
| 태그라인 블록 (`h1` + 부제 + **App Store CTA**) | `opacity:0; transform:translateY(40px)` | `copyOpacity` 구간이 `[0.14, …]`에서 시작 → 0 | 🔴 **콘텐츠 손실** |
| GAME POINT 스코어 | `opacity:0` | `scoreOpacity` 구간이 `[0.2, …]`에서 시작 → 0 | 🔴 **콘텐츠 손실** |
| 워치 스크린샷 | `opacity:1; transform:scale(0.62) rotate(-4deg)` | `watchScale` 0.62, `watchRotate` -4 | 🟡 62% 크기로 기울어져 렌더 |
| 배경 glow (`aria-hidden`) | `transform:scale(0.7)` | `glowScale` 0.7 | 🟢 장식, 미세한 차이 |
| 코트 SVG (`aria-hidden`) | `opacity:0.5; transform:perspective(900px) translateY(10vh) rotateX(56deg)` | `isStatic` 분기가 `{ opacity: 0.5 }`를 **명시적으로** 넘김 | 🟢 의도된 동작 |

**핵심**: 히어로의 주요 콘텐츠 두 블록과 이 페이지의 유일한 전환 동선(App Store 버튼)이 보이지 않는다.

### 1.3 코트 SVG는 왜 안전한가 — 판별 기준

코트 SVG(`hero.area.tsx:91`)는 `isStatic`일 때 `undefined`가 아니라 **구체적인 값 `{ opacity: 0.5 }`** 를 넘긴다. 이러면 framer-motion이 스타일 소유권을 계속 유지하며 값을 갱신하므로 stale 문제가 없다.

```tsx
// ❌ 결함 — undefined를 넘기면 framer-motion이 손을 떼고 이전 값이 남는다
style={isStatic ? undefined : { opacity: copyOpacity }}

// ✅ 안전 — 구체적 값을 넘기면 framer-motion이 계속 관리한다
style={isStatic ? { opacity: 0.5 } : { rotateX: courtRotateX, … }}

// ✅ 안전 — 엘리먼트 타입이 바뀌면 React가 노드를 교체해 stale 스타일이 따라오지 않는다
if (isStatic) return <div className={…}>{children}</div>;
return <motion.div style={{ … }}>{children}</motion.div>;
```

이 판별 기준은 향후 유사 코드를 리뷰할 때 그대로 쓸 수 있다.

## 2. 영향 범위 조사

`_areas/*.area.tsx` 6개 전체를 멀티라인 포맷까지 포함해 정규식으로 조사했다.

| 파일 | `style/animate={isStatic ? … undefined}` | 판정 |
|---|---|---|
| `hero.area.tsx` | **4건** (L86·L128·L144·L160) | 🔴 수정 대상 |
| `watch.area.tsx` | 0건 | ✅ `animate`에 항상 구체적 값을 넘긴다 |
| `workout.area.tsx` | 0건 | ✅ |
| `replay.area.tsx` | 0건 (오탐 — 아래 참고) | 🔴 수정 대상 (최종 통합 리뷰에서 발견) |
| `rules.area.tsx` | 0건 | ✅ |
| `final-cta.area.tsx` | 0건 | ✅ |

`Reveal`([`apps/_actions/reveal.action.tsx`](../../../src/app/\(main\)/apps/_actions/reveal.action.tsx))은 `isStatic`일 때 평범한 `<div>`를 반환하므로 안전하다. `HeroLetter`(`hero.area.tsx:36`)도 조기 반환으로 `<span>`을 렌더해 안전하다 — **이미 올바른 패턴이 같은 파일 안에 있었다.**

> GolfCounter 작업에서는 `health.area.tsx`가 `animate={isStatic ? undefined : {…}}`라는 변종을 갖고 있었다. ralli에는 이 변종이 없다.

> **이 표의 `replay.area.tsx` 판정은 틀렸었다.** 정규식이 리터럴 토큰 `isStatic ?`만 찾았는데, 실제 코드는 `const useNativeScroll = isMobile || isStatic;` 로 `isStatic`을 별칭 뒤에 숨겨서 썼고, 문제의 줄도 `style={useNativeScroll ? undefined : { x: driftX }}`라 `isStatic`이라는 글자가 아예 등장하지 않는다. `useNativeScroll`은 여전히 `isStatic` 값에 좌우되므로 같은 결함 시퀀스(§1)를 그대로 가진다 — 게다가 `isMobile`도 `useMounted`와 동일하게 "첫 렌더는 항상 `false`, `useEffect`에서 갱신"되는 훅이라, 이 결함은 reduced-motion 사용자만이 아니라 **모바일 사용자 전반**(새로고침 시 스크롤 위치가 남아있는 채로 hydration이 끝나는 경우 등)에도 잠재했다. 최종 통합 리뷰에서 발견되어 `replay.area.tsx`와 [README §7.1](../../../src/app/\(main\)/apps/ralli/README.md)·§6 함정 3을 함께 수정했다. **교훈**: 이런 조사는 리터럴 토큰이 아니라 "해당 변수의 데이터 흐름"을 따라가야 한다 — 정규식 grep은 별칭·파생값을 놓친다.

## 3. 수정 방침

### 3.1 hero.area.tsx — 엘리먼트 타입 교체

4곳 모두 `isStatic` 분기에서 **`motion.*`이 아닌 평범한 엘리먼트를 반환**하도록 바꾼다. React가 엘리먼트 타입 변경을 감지해 DOM 노드를 통째로 교체하므로 stale 인라인 스타일이 원천적으로 남을 수 없다.

이는 GolfCounter의 `hero.area.tsx`·`health.area.tsx`에서 이미 검증된 방식이고, 같은 파일의 `HeroLetter`와 공용 `Reveal`이 쓰는 방식과도 일치한다. 새로운 패턴을 도입하는 게 아니라 **기존 컨벤션으로 되돌리는 것**이다.

두 분기가 같은 마크업을 중복하지 않도록, 공유 콘텐츠는 조각 컴포넌트로 추출한다(GolfCounter가 `HeroHeadline`·`HeroStageLabel`·`HeroCta`로 처리한 방식).

**코트 SVG(L91)는 건드리지 않는다** — 1.3에서 확인한 대로 이미 안전하다.

### 3.2 watch.area.tsx — 접근성 2건

README의 "남아있는 개선 여지"에 이미 기록되어 있던 항목이다. 같은 접근성 주제이고 GolfCounter에서는 이미 처리한 내용이라 함께 해결해 두 랜딩의 패리티를 맞춘다.

| 항목 | 현재 | 수정 |
|---|---|---|
| 비활성 이미지가 스크린 리더에 노출 | `opacity: 0`으로만 숨김 → 3장 모두 읽힘 | `RalliShot`에 `ariaHidden` prop을 추가하고 `aria-hidden={index !== activeIndex}` 전달 |
| static에서 scale wobble | `opacity`만 `isStatic`을 반영하고 `scale`은 `activeIndex`를 계속 추종 | `scale`도 `isStatic` 분기에 포함 |

`RalliShot`의 prop 추가는 GolfCounter의 `GolfShot`이 같은 이유로 이미 도입한 것과 동일한 형태다(optional prop이라 기존 호출부 무영향).

> **주의**: `aria-hidden`을 래퍼 `<div>`에 걸면 실제 `<img>`까지 전달되지 않는다. GolfCounter Task 7에서 확인된 함정이므로, 반드시 `RalliShot`을 통해 `<Image>`에 직접 전달해야 한다.

## 4. 회귀 테스트

### 4.1 왜 일반 렌더 테스트로는 못 잡는가

React Testing Library의 `render()`는 `createRoot`를 쓴다. `createRoot`는 `useSyncExternalStore`의 `getServerSnapshot`을 **호출하지 않으므로** `mounted`가 첫 렌더부터 `true`다. 즉 1.1의 2단계 시퀀스가 재현되지 않아, **결함이 있는 코드도 테스트를 통과한다.**

GolfCounter 작업에서 이 함정에 한 번 빠졌다가 리뷰에서 잡혔다. 같은 실수를 반복하지 않는다.

### 4.2 올바른 방식

`renderToString`(서버 렌더, `mounted=false`) → `hydrateRoot`(hydration 후 `mounted=true`로 전환)로 실제 시퀀스를 재현한다.

```
_areas/hero.area.reduced-motion.test.tsx  (신규)
```

- framer-motion은 reduced-motion 상태를 **모듈 싱글턴에 캐시**하므로, 일반 렌더가 먼저 도는 파일과 **반드시 분리**한다. 같은 파일에 두면 `false`로 굳어 static 분기 진입 자체가 불가능하다.
- `beforeAll`에서 `window.matchMedia`를 mock한다.
- 단언: hydration 이후 태그라인 블록·스코어 블록·워치 이미지에 `opacity:0`이나 stale `transform`이 남지 않을 것.

### 4.3 테스트가 실제로 결함을 잡는지 증명

테스트 작성 후 **결함 패턴을 일시적으로 되돌려 테스트가 실패하는지 확인**하고, 원복해 통과하는지 확인한다. 이 RED/GREEN 증거를 남긴다.

"테스트가 존재하고 통과한다"는 "테스트가 의미 있다"를 보장하지 않는다 — GolfCounter에서 실제로 무력한 테스트가 리뷰에 걸린 선례가 있다.

### 4.4 E2E

`e2e/ralli.spec.ts`에 reduced-motion 케이스를 추가한다.

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
```

App Store CTA와 h1이 실제로 **보이는지**(`toBeVisible()`) 단언한다. `toBeVisible()`은 `opacity:0`을 감지하지 못하므로, 계산된 `opacity`를 직접 확인하거나 `getBoundingClientRect()` 기반으로 판정한다.

> `e2e/ralli.spec.ts`에는 사이트 전역 `min-w-100`(400px) 때문에 실패 중인 모바일 가로 스크롤 테스트가 이미 있다. **이 작업의 회귀가 아니며 범위 밖이다** — `develop`에서도 동일하게 실패함을 별도 워크트리로 확인했다.

## 5. 문서 갱신

대상 파일: `src/app/(main)/apps/ralli/README.md`

- **10절 "남아있는 개선 여지"**(L435~)에서 해결된 2건(watch 비활성 이미지 `aria-hidden`, scale wobble)을 제거한다.
- **7절 "reduced-motion 폴백 설계"**(L375~)에 **1.3의 판별 기준**을 추가한다. 이 문서가 프로젝트의 스크롤 애니메이션 교본 역할을 하므로, 같은 함정을 반복하지 않으려면 여기에 남는 게 맞다.

## 6. 검증

`npm run lint` · `npm run test:run` · `npm run build` · `npm run test:e2e`

기존 ralli area 테스트 6개는 이 모듈들을 `vi.mock`하지 않고 실제 구현을 쓰므로 회귀 감지 역할을 한다.

## 7. 브랜치

CLAUDE.md 규칙에 따라 `develop`에서 `fix/ralli-hero-reduced-motion`을 만든다. 이미 배포된 페이지의 접근성 수정이라 GolfCounter 작업과 독립적으로 다룬다.

## 8. 범위 밖 (의도적 제외)

- **사이트 전역 `min-w-100`(400px)로 인한 모바일 10px 가로 스크롤** — `src/app/layout.tsx`. 홈 포함 전 페이지에 영향을 주는 별개 이슈이며 `develop`에 이미 존재한다.
- **`isStatic` 분기를 공용 헬퍼로 추상화** — 재발 방지에는 가장 강하지만 두 랜딩의 리팩터 범위가 커진다. 이번엔 판별 기준을 문서화하는 선에서 멈춘다.

## 참고

- 동일 결함을 먼저 발견·수정한 작업: [2026-08-18-golf-counter-landing-b-design.md](2026-08-18-golf-counter-landing-b-design.md)
- 참고 구현: `src/app/(main)/apps/golf-counter/_areas/hero.area.tsx`, `health.area.tsx`, `hero.area.reduced-motion.test.tsx`
- 스크롤 애니메이션 해설: [`src/app/(main)/apps/ralli/README.md`](../../../src/app/\(main\)/apps/ralli/README.md)
