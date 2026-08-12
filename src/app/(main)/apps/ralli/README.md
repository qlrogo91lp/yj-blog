# Ralli 랜딩 — 스크롤 애니메이션 구현 분석

`/apps/ralli`는 스크롤 위치에 따라 요소가 움직이는 몰입형 랜딩 페이지다. 이 문서는 **그게 어떻게 동작하는지**를 코드 기준으로 분해한다.

원본 시안은 프레임워크 없는 정적 HTML + 전역 `requestAnimationFrame` 루프였다. 매 프레임 모든 대상의 `getBoundingClientRect()`를 읽고 인라인 스타일을 직접 쓰는 명령형 코드였고, 이걸 framer-motion 기반 선언형 구조로 재구성한 결과가 현재 코드다. 그래서 이 문서는 "무엇을 왜 그렇게 바꿨는지"도 같이 다룬다.

---

## 0. 먼저 알아야 할 것 3가지

이 세 가지를 이해하면 나머지는 조립일 뿐이다.

1. **MotionValue는 React 리렌더를 우회한다** — 스크롤마다 60fps로 리렌더하지 않는 이유
2. **`sticky` + 큰 높이 = pin** — 화면이 "멈춘 채로" 애니메이션되는 착시의 정체
3. **`useScroll`의 `offset`** — 진행도 0과 1이 각각 언제인지 정하는 문법

---

## 1. 전체 구조

```
page.tsx                    Server Component. 영역을 세로로 나열만 한다
  ├── HeroArea              ─┐
  ├── RalliMarquee           │  'use client'
  ├── WatchArea              │  각자 스크롤 진행도를 직접 구독
  ├── WorkoutArea            │
  ├── ReplayArea             │
  ├── RulesArea              │
  └── FinalCtaArea          ─┘

_hooks/useSectionProgress   스크롤 진행도(0~1) 생산 — 3개 area가 사용
_hooks/useIsMobile          뷰포트 분기 — replay만 사용
_actions/reveal.action      등장 애니메이션 래퍼 — 4개 area가 사용
_utils/ralli-motion         진행도 → 값 변환 순수 함수 (테스트 대상)
_utils/ralli-content        카피·이미지 데이터 (애니메이션과 무관)
```

핵심 설계는 **진행도를 만드는 곳(hook)과 쓰는 곳(area)을 분리**한 것이다. area는 "지금 몇 % 스크롤됐는지"만 받아서 자기 요소에 어떻게 반영할지 결정한다.

그리고 **계산 로직은 순수 함수로 빼서 테스트**한다 ([_utils/ralli-motion.ts](_utils/ralli-motion.ts) — 11개 테스트). DOM도 스크롤도 필요 없는 순수 함수라 jsdom에서 경계값을 촘촘히 검증할 수 있다. 명령형 rAF 루프였다면 불가능했던 부분이다.

---

## 2. 원리 1 — MotionValue는 리렌더를 우회한다

가장 중요한 개념이다. 순진하게 만들면 이렇게 된다:

```tsx
// ❌ 이렇게 하면 스크롤 1px마다 컴포넌트 전체가 리렌더된다
const [scrollY, setScrollY] = useState(0);
useEffect(() => {
  const onScroll = () => setScrollY(window.scrollY);
  window.addEventListener('scroll', onScroll);
}, []);
return <div style={{ transform: `scale(${1 + scrollY / 1000})` }} />;
```

framer-motion의 `MotionValue`는 **React 상태가 아니다.** 값이 바뀌어도 리렌더가 발생하지 않고, framer-motion이 DOM 노드의 style을 직접 쓴다.

```tsx
// _areas/hero.area.tsx:55
const watchScale = useTransform(progress, [0, 0.84], [0.62, 1.2]);
//    ↑ MotionValue<number>. 이 값이 바뀌어도 HeroArea는 리렌더되지 않는다

<motion.div style={{ scale: watchScale }}>  // framer-motion이 DOM에 직접 write
```

`useTransform(source, inputRange, outputRange)`는 소스 MotionValue를 다른 범위로 매핑한 **새 MotionValue**를 만든다. 위 코드는 "진행도가 0→0.84로 갈 때 scale을 0.62→1.2로" 라는 뜻이다.

### 문자열 단위와 다중 구간

```tsx
// 단위가 붙어도 된다 — 숫자 부분만 보간하고 단위는 유지한다
const y = useTransform(progress, [0, 0.84], ['0vh', '-6vh']);            // hero.area.tsx:29
const filter = useTransform(progress, [0, 0.84], ['blur(0px)', 'blur(3.5px)']);  // :32

// 구간을 여러 개 주면 "나타났다 사라지는" 곡선을 만들 수 있다
const copyOpacity = useTransform(progress, [0.14, 0.36, 0.86, 1], [0, 1, 1, 0]);  // :67
//                                          ↑페이드인   ↑유지  ↑페이드아웃
```

`copyOpacity`가 좋은 예다. 14%까지는 투명, 36%에 완전히 나타나고, 86%까지 유지되다가, 100%에서 다시 사라진다. rAF 루프로 짜면 if 분기가 잔뜩 필요한 걸 배열 두 개로 표현한다.

### 그런데 왜 hero의 대부분은 `0.84`에서 끝나는가

```tsx
useTransform(progress, [0, 0.84], ...)   // 글자·워치·코트·글로우 전부
useTransform(progress, [0.84, 1], [1, 0])  // watchOpacity — 여기서부터 퇴장
```

**0~0.84는 "연출", 0.84~1은 "퇴장"** 으로 구간을 나눈 것이다. 마지막 16%에서 워치와 카피가 사라지면서 다음 섹션으로 자연스럽게 넘어간다. 스크롤 애니메이션에서 흔히 쓰는 구성이다.

---

## 3. 원리 2 — sticky pin: 화면이 멈춘 것처럼 보이는 이유

hero와 watch 섹션은 스크롤해도 화면이 "그대로 멈춰 있고" 내부 요소만 변한다. 이 착시의 정체는 **CSS `position: sticky` 하나**다. JS는 관여하지 않는다.

```tsx
// _areas/hero.area.tsx:74-83
<div ref={ref} className="relative h-[180vh] md:h-[280vh]">   {/* ① 키 큰 껍데기 */}
  <div className="sticky top-14 h-[calc(100vh-3.5rem)]">      {/* ② 화면에 붙는 알맹이 */}
```

```
   스크롤 ↓                  화면(viewport)
                          ┌──────────────┐
 ┌──────────┐  ①280vh     │  ② sticky    │  ← 껍데기가 다 지나갈 때까지
 │          │             │   여기 고정   │     알맹이는 화면에 붙어있다
 │          │             └──────────────┘
 │ 껍데기    │
 │          │   이 구간(280vh - 100vh = 180vh)이
 │          │   "애니메이션에 쓸 수 있는 스크롤 예산"
 └──────────┘
```

- **①의 높이가 애니메이션 길이를 정한다.** 데스크톱 280vh면 화면 하나(100vh)를 뺀 **180vh만큼 스크롤하는 동안** 진행도가 0→1로 간다. 모바일은 180vh라 80vh만에 끝난다 — 모바일에서 같은 연출을 더 짧게 압축한 것이다.
- **`top-14`는 공용 Header 높이(56px)만큼 내린 것.** `h-[calc(100vh-3.5rem)]`도 같은 이유다. 안 그러면 콘텐츠가 헤더 뒤로 숨는다.

watch 섹션도 완전히 같은 구조다 (`h-[240vh] md:h-[300vh]`, [watch.area.tsx:24-32](_areas/watch.area.tsx)).

> **직접 확인해보기**: `h-[280vh]`를 `h-[500vh]`로 바꿔보면 같은 연출이 훨씬 느리게 흐른다. 애니메이션 속도는 duration이 아니라 **껍데기 높이**로 조절한다는 게 스크롤 애니메이션의 핵심 감각이다.

---

## 4. 원리 3 — `useScroll`의 offset 문법

진행도 0과 1이 각각 언제인지를 정하는 문법인데, 처음 보면 제일 헷갈린다.

```tsx
useScroll({ target: ref, offset: ['start start', 'end end'] })
//                                 ─┬─── ─┬───
//                    대상(target)의 어디  ┆  뷰포트의 어디
//                                        └ 이 둘이 만나는 순간이 기준점
```

이 프로젝트에서 쓰는 두 가지:

| offset | 진행도 0 | 진행도 1 | 쓰는 곳 |
|---|---|---|---|
| `['start start', 'end end']` | 대상 **위쪽**이 화면 **위쪽**에 닿을 때 | 대상 **아래쪽**이 화면 **아래쪽**에 닿을 때 | hero, watch (pin) |
| `['start end', 'end start']` | 대상 위쪽이 화면 **아래쪽**에 닿을 때 (= 막 등장) | 대상 아래쪽이 화면 **위쪽**에 닿을 때 (= 완전히 퇴장) | replay (드리프트) |

두 번째가 왜 다른 값인지가 포인트다. pin 섹션은 "고정된 동안"만 진행도가 흐르면 되지만, replay 갤러리는 **화면에 보이는 내내** 조금씩 옆으로 흘러야 자연스럽다. 그래서 등장~퇴장 전 구간을 0~1로 잡는다.

```tsx
// _areas/replay.area.tsx:16-18
const { ref, progress } = useSectionProgress(['start end', 'end start'], false);
const driftX = useTransform(progress, [0, 1], ['0vw', '-55vw']);
```

### 스프링을 거는 이유와, 여기만 끄는 이유

[_hooks/useSectionProgress.ts:40-44](_hooks/useSectionProgress.ts)

```ts
const smoothed = useSpring(scrollYProgress, {
  stiffness: 90,
  damping: 22,
  restDelta: 0.0005,
});
```

원본 시안의 `this.sp += (raw - this.sp) * 0.11` (수동 lerp)를 대체한 부분이다. 스크롤 값을 그대로 쓰면 휠의 계단식 입력이 그대로 드러나 뚝뚝 끊긴다. 스프링이 한 박자 늦게 따라오면서 부드럽게 만든다.

감쇠비를 계산해보면 이 계수를 왜 골랐는지 보인다 (framer-motion 기본 `mass: 1`):

```
ζ = damping / (2√(stiffness × mass)) = 22 / (2√90) ≈ 1.16
```

**ζ > 1 = 과감쇠(overdamped)** — 목표를 넘어갔다 되돌아오는 출렁임(overshoot)이 없다. 진행도가 1을 넘지 않는다는 뜻이라, 뒤에 나올 `scoreAt`/`stepIndexAt`의 clamp는 안전망으로만 동작한다. UI 스크롤 연동에서는 보통 이렇게 과감쇠로 잡는다.

그런데 replay만 `smooth=false`로 **스프링을 끈다**. 긴 구간을 가로로 직접 매핑하는 연출이라, 스프링 지연이 "부드러움"이 아니라 "손가락을 안 따라오는 둔함"으로 읽히기 때문이다. 판단이 갈릴 수 있는 부분이니 `true`로 바꿔서 직접 비교해볼 만하다.

---

## 5. 네 가지 애니메이션 패턴

이 페이지의 모든 움직임은 아래 4개 중 하나다.

### 패턴 A — 진행도 → 연속적인 스타일 (`useTransform`)

가장 기본. 리렌더 없이 매 프레임 DOM에 직접 쓴다. hero의 글자 비산·워치 확대·코트 회전이 전부 이것.

```tsx
// _areas/hero.area.tsx:60-63 — 코트 SVG를 3D로 눕히기
const courtRotateX = useTransform(progress, [0, 0.84], [56, 36]);
// ...
<motion.div style={{ rotateX: courtRotateX, transformPerspective: 900 }}>
```

`transformPerspective`가 없으면 rotateX가 그냥 납작하게 눌린 것처럼 보인다. 원근값을 줘야 3D로 눕는다.

### 패턴 B — 진행도 → 이산적인 상태 (`useMotionValueEvent` + `useState`)

스코어 텍스트(`0→15→30→40→GAME`)나 활성 스텝 인덱스처럼 **값이 띄엄띄엄 바뀌는** 경우. 텍스트 내용은 style로 쓸 수 없으니 여기서는 어쩔 수 없이 React 상태를 쓴다.

```tsx
// _areas/hero.area.tsx:49-53
const [score, setScore] = useState<RalliScore>('0');
useMotionValueEvent(progress, 'change', (value) => {
  setScore(scoreAt(value));   // ← 순수 함수가 진행도를 스코어로 변환
});
```

콜백은 스크롤마다 호출되지만, `setState`에 **같은 값**을 넣으면 React가 리렌더를 생략한다. 결과적으로 실제 리렌더는 스코어가 바뀌는 4번뿐이다. 패턴 A로는 표현 못 하는 걸 최소 비용으로 처리하는 구조다.

변환 로직은 순수 함수로 분리되어 있다:

```ts
// _utils/ralli-motion.ts:22-25
export function scoreAt(progress: number): RalliScore {
  const index = Math.floor(clamp(progress, 0, 1) * 5.2);
  return scoreSequence[Math.min(scoreSequence.length - 1, index)];
}
```

**왜 5.2인가?** (시안에서 그대로 가져온 값이다) 항목이 5개인데 5.2를 곱하면 각 구간이 `1/5.2 = 19.2%`가 되고, 마지막 `GAME`만 남은 `23.1%`를 가져간다. 즉 **마지막 값이 20% 더 오래 머문다.** 클라이맥스를 좀 더 보여주려는 의도다. 5를 곱했다면 5개가 정확히 균등해진다.

`stepIndexAt`의 `3.02`도 같은 원리다 ([:28-31](_utils/ralli-motion.ts)).

### 패턴 C — 뷰포트 진입 시 1회 (`whileInView` / `useInView`)

스크롤 진행도와 무관하게 "보이면 한 번 실행"하는 것들. 원본 시안이 매 프레임 모든 `[data-reveal]`의 `getBoundingClientRect()`를 읽던 걸 **IntersectionObserver 1회 발화**로 대체한 부분이라, 성능 이득이 가장 큰 지점이다.

```tsx
// _actions/reveal.action.tsx:33-38
<motion.div
  initial={{ opacity: 0, y: 46 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-60px' }}   // ← once: 한 번 발화 후 관찰 해제
  transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1], delay }}
>
```

- `margin: '-60px'` — 관찰 영역을 60px 안쪽으로 줄인다. 화면에 걸치자마자가 아니라 **충분히 들어온 뒤** 발화시켜서 어색함을 줄인다.
- `delay`를 prop으로 받아 목록에 시차를 준다 — `delay={index * 0.08}` ([replay.area.tsx:58](_areas/replay.area.tsx)).

카운트업 스탯도 같은 계열이다:

```tsx
// _areas/workout.area.tsx:23-37
const isInView = useInView(ref, { once: true, margin: '-80px' });
useEffect(() => {
  if (!isInView) return;
  const controls = animate(0, stat.value, {
    duration: prefersReducedMotion ? 0 : 1.1,
    onUpdate: (value) => setDisplayed(Math.round(value)),
  });
  return () => controls.stop();   // ← 언마운트 시 정리 (필수)
}, [isInView, prefersReducedMotion, stat.value]);
```

여기는 **패턴 A를 못 쓰는 대표 사례**다. 숫자를 화면에 "글자"로 그려야 하는데 텍스트 내용은 style이 아니라서, `onUpdate`마다 `setState` → 프레임마다 리렌더가 실제로 일어난다. 카드 3장 × 1.1초라 감수한 트레이드오프다.

### 패턴 D — 스크롤과 무관한 CSS 애니메이션

마퀴와 스크롤 힌트의 위아래 흔들림은 **JS가 전혀 없다.** CSS `@keyframes`면 충분한 걸 굳이 JS로 만들지 않는 게 낫다.

```css
/* src/styles/ralli.css:6-13, 25-27 */
@keyframes ralli-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.ralli-marquee-track { animation: ralli-marquee 26s linear infinite; }
```

무한 루프의 트릭은 **같은 내용을 두 벌 렌더**하는 것이다:

```tsx
// _components/ralli-marquee.tsx:24-27
<div className="ralli-marquee-track flex w-max whitespace-nowrap">
  {track}
  {track}   {/* ← 사본. -50% 이동 = 정확히 한 벌 폭 → 이음매가 안 보인다 */}
</div>
```

`w-max`가 중요하다. 컨테이너 폭이 **두 벌의 합**이 되어야 `-50%`가 정확히 한 벌 폭과 일치한다. (초기 구현은 `w-[200%]` + 트랙 `w-1/2`였는데, `whitespace-nowrap` 때문에 트랙이 min-content 아래로 줄지 않아 1280px 미만에서 두 벌이 서로 겹쳐 깨졌다. 최종 리뷰에서 잡힌 실제 버그다.)

---

## 6. 실제로 걸렸던 함정 4가지

### 함정 1 — `.map()` 안에서 훅을 호출할 수 없다

hero의 `RALLI` 5글자는 각자 다른 방향으로 날아가야 한다. 즉 글자마다 `useTransform`이 5개씩 필요하다. 그런데:

```tsx
// ❌ react-hooks/rules-of-hooks 위반. 훅은 반복문/조건문 안에서 호출 금지
{letters.map((char) => {
  const x = useTransform(...);   // 💥
})}
```

**해법: 글자 하나를 자식 컴포넌트로 분리한다.** 각 컴포넌트 인스턴스가 자기 훅을 최상위에서 호출하면 규칙 위반이 아니다.

```tsx
// _areas/hero.area.tsx:27-45
function HeroLetter({ char, direction, progress, isStatic }: HeroLetterProps) {
  const x = useTransform(progress, [0, 0.84], ['0vw', `${direction * 58}vw`]);
  // ... 나머지 4개도 여기서 최상위 호출
}
```

`progress`(MotionValue)를 prop으로 내려보내는 게 포인트다. MotionValue는 리렌더를 유발하지 않으니 자식에게 넘겨도 비용이 없다. **반복되는 스크롤 애니메이션 요소는 자식 컴포넌트로 분리한다** — 이 패턴은 계속 쓰인다.

참고로 `HeroLetter` 안의 `if (isStatic) return <span>` 조기 반환은 훅 **호출 뒤**에 온다. 훅 5개는 항상 실행되고 반환값만 달라지므로 규칙 위반이 아니다. 순서를 바꾸면 위반이 된다.

### 함정 2 — reduced-motion과 hydration mismatch

`prefers-reduced-motion`을 존중해 정적 폴백을 제공하는데, 여기서 SSR 문제가 터진다.

framer-motion의 `useReducedMotion()`은 **서버에서 `null`**(→ 애니메이션 켬)을 반환하지만 **클라이언트 첫 렌더에서는 실제 값**을 반환한다. 그런데 `isStatic`은 스타일 값이 아니라 **DOM 구조와 className을 바꾼다**(`<span>` vs `<motion.span>`, `h-auto` vs `h-[280vh]`, 스크롤 힌트 유무). 서버 HTML과 클라이언트 첫 렌더가 달라지니 hydration 에러가 난다.

**해법: 마운트 전에는 무조건 애니메이션 경로로 통일한다.**

```ts
// _hooks/useSectionProgress.ts:18-20, 33-37, 49
function subscribe() { return () => {}; }   // 알림 없음 — 스냅샷만 쓴다

const mounted = useSyncExternalStore(
  subscribe,
  () => true,    // getSnapshot — 클라이언트(hydration 이후)
  () => false,   // getServerSnapshot — 서버 + hydration 중
);
// ...
isStatic: Boolean(prefersReducedMotion) && mounted
```

서버와 hydration 시점에는 `mounted === false` → `isStatic === false` → 양쪽 렌더 결과가 일치한다. hydration이 끝나면 React가 스냅샷 차이를 감지해 한 번 리렌더하고, 그때부터 진짜 `prefersReducedMotion`이 반영된다.

`useState` + `useEffect`로도 같은 걸 만들 수 있지만 이 프로젝트 ESLint의 `react-hooks/set-state-in-effect`에 걸린다. `useSyncExternalStore` 버전은 [src/components/theme-toggle.tsx](../../../../components/theme-toggle.tsx)에 선례가 있다. `Reveal`도 동일 패턴이다 ([reveal.action.tsx:19-26](_actions/reveal.action.tsx)).

> **일반화**: 클라이언트에서만 알 수 있는 값(미디어 쿼리, localStorage, 디바이스 정보)으로 **DOM 구조**를 바꾸면 항상 이 문제가 생긴다. 스타일 값만 바꾸는 경우는 상대적으로 덜 위험하다.

### 함정 3 — 모바일에서 스크롤 축이 충돌한다

replay 갤러리는 데스크톱에서 세로 스크롤에 연동해 가로로 흐른다. 그런데 모바일에서 이러면 **손가락으로 가로 스와이프하려는 동작과 충돌**한다. 그래서 여기만 뷰포트로 분기한다.

```tsx
// _areas/replay.area.tsx:20, 37-41
const useNativeScroll = isMobile || isStatic;

<div className={cn(useNativeScroll && 'snap-x snap-mandatory overflow-x-auto pb-4')}>
  <motion.div style={useNativeScroll ? undefined : { x: driftX }}>
```

모바일이면 CSS 네이티브 가로 스크롤 + `scroll-snap`, 데스크톱이면 스크롤 연동 드리프트. **둘을 동시에 켜면 안 되므로** 클래스와 style이 정확히 배타적으로 적용된다.

`useIsMobile`은 초기값이 `false`고 `useEffect`에서 갱신되므로 SSR에서 안전하다 ([useIsMobile.ts:7-16](_hooks/useIsMobile.ts)).

### 함정 4 — `animate()`는 정리(cleanup)해야 한다

`useEffect`에서 시작한 애니메이션은 언마운트 시 반드시 멈춰야 한다. 안 그러면 사라진 컴포넌트에 `setState`를 호출한다.

```tsx
const controls = animate(0, stat.value, { onUpdate: ... });
return () => controls.stop();   // ← 이게 없으면 누수
```

같은 이유로 `IntersectionObserver`도 `observer.disconnect()`가 필요하다.

---

## 7. reduced-motion 폴백 설계

접근성 대응이 단순히 "애니메이션 끄기"가 아니라는 게 드러나는 부분이다.

| 레이어 | 처리 방식 |
|---|---|
| CSS 애니메이션 (마퀴·bob) | `@media (prefers-reduced-motion: reduce) { animation: none }` ([ralli.css:33-38](../../../../styles/ralli.css)) |
| 스크롤 연동 (hero·watch·replay) | `isStatic`으로 **레이아웃 자체를 바꾼다** — pin 해제, 높이 `h-auto` |
| 등장 애니메이션 (Reveal) | `motion.div` 대신 평범한 `div` 반환 |
| 카운트업 | `duration: 0` — 값은 즉시 최종값 |

**pin 섹션은 모션만 꺼서는 안 된다.** 진행도가 흐르지 않는데 껍데기가 280vh로 남아있으면 빈 화면을 한참 스크롤하게 된다. 그래서 `h-auto`로 접고 sticky도 해제한다.

같은 이유로 hero의 장식 워드마크는 정적 경로에서 **아예 렌더하지 않는다**:

```tsx
// _areas/hero.area.tsx:108
{!isStatic && (
  <div data-ralli-wordmark aria-hidden="true" ...>
```

애니메이션 경로에서는 글자들이 84% 지점에 화면 밖으로 날아가면서 정리되는데, 정적 경로에는 그 "날아감"이 없으니 워치·스코어·카피 위에 그대로 겹쳐 남는다. 장식(`aria-hidden`)이라 제거해도 정보 손실이 없다. — 이것도 최종 통합 리뷰에서 발견된 실제 버그였다.

---

## 8. 파일 맵

| 파일 | 역할 | 라인 |
|---|---|---|
| [_utils/ralli-motion.ts](_utils/ralli-motion.ts) | `clamp`·`mapRange`·`scoreAt`·`stepIndexAt` 순수 함수 | 31 |
| [_hooks/useSectionProgress.ts](_hooks/useSectionProgress.ts) | `useScroll` + `useSpring` + reduced-motion 판정 | 51 |
| [_hooks/useIsMobile.ts](_hooks/useIsMobile.ts) | `matchMedia` 기반 뷰포트 분기 | 19 |
| [_actions/reveal.action.tsx](_actions/reveal.action.tsx) | `whileInView` 등장 래퍼 | 43 |
| [_areas/hero.area.tsx](_areas/hero.area.tsx) | 패턴 A+B 총집합. 가장 복잡 | 194 |
| [_areas/watch.area.tsx](_areas/watch.area.tsx) | pin 3-step 크로스페이드 | 84 |
| [_areas/workout.area.tsx](_areas/workout.area.tsx) | 카운트업 스탯 | 95 |
| [_areas/replay.area.tsx](_areas/replay.area.tsx) | 가로 드리프트 / 모바일 분기 | 66 |
| [_areas/rules.area.tsx](_areas/rules.area.tsx) | `Reveal`만 사용 (스크롤 연동 없음) | 50 |
| [_areas/final-cta.area.tsx](_areas/final-cta.area.tsx) | `Reveal`만 사용 | 39 |
| [src/styles/ralli.css](../../../../styles/ralli.css) | 마스크 · 마퀴/bob keyframes | 38 |

읽는 순서 추천: **`ralli-motion.ts` → `useSectionProgress.ts` → `watch.area.tsx`(가장 단순한 pin) → `hero.area.tsx`(종합)**

---

## 9. 직접 실험해볼 것들

이해도를 확인하려면 값을 바꿔보고 예상과 맞는지 보면 된다.

1. **`hero.area.tsx:76`의 `h-[280vh]` → `h-[500vh]`** — 연출이 느려지는가? (스크롤 예산 개념)
2. **`useSectionProgress`의 `damping: 22` → `5`** — 출렁임(overshoot)이 생기는가? ζ가 1 아래로 내려간다
3. **`replay.area.tsx:16`의 `false` → `true`** — 갤러리에 스프링을 걸면 둔해지는가?
4. **`ralli-motion.ts`의 `5.2` → `5`** — GAME이 머무는 시간이 다른 스코어와 같아지는가?
5. **`reveal.action.tsx`의 `once: true` → `false`** — 위아래로 스크롤할 때마다 재발화하는가?
6. **DevTools에서 reduced-motion 켜기** (Rendering → Emulate CSS prefers-reduced-motion) — 레이아웃이 접히는가?
7. **React DevTools Profiler로 스크롤 중 리렌더 확인** — hero는 스코어가 바뀔 때만 리렌더되는가? (MotionValue의 핵심 이득 확인)

---

## 10. 남아있는 개선 여지

정직하게 적어둔다. 공부용으로 손대볼 만한 지점들이다.

- **`useSectionProgress`는 `smooth=false`여도 스프링을 만든다** ([:40](_hooks/useSectionProgress.ts)) — replay에서 아무도 구독하지 않는 스프링이 스크롤마다 프레임을 돈다. 조건부 생성은 훅 규칙 때문에 간단치 않아 남겨둔 상태.
- **카운트업이 프레임마다 리렌더한다** — framer-motion은 `<motion.span>{motionValue}</motion.span>` 형태로 MotionValue를 자식으로 렌더하면 리렌더 없이 textContent를 갱신할 수 있다. 패턴 A로 옮길 수 있는 여지가 있다.
- **watch 섹션의 비활성 이미지 3장이 `opacity: 0`으로만 숨겨져 있다** ([watch.area.tsx:67-79](_areas/watch.area.tsx)) — 스크린 리더에는 3장이 모두 노출된다. `aria-hidden={index !== activeIndex}`가 필요하다.
- **`isStatic`일 때 이미지의 `scale` wobble이 남는다** — 같은 위치에서 `opacity`만 `isStatic`을 반영하고 `scale`은 `activeIndex`를 계속 따라간다.
- **`LETTER_DIRECTIONS`와 `ralliHeroLetters`의 길이가 타입으로 묶여있지 않다** ([hero.area.tsx:13](_areas/hero.area.tsx)) — 둘 다 5개라 지금은 안전하지만, 한쪽만 바뀌면 `direction`이 `undefined` → `NaN`이 되어 조용히 깨진다.

---

## 참고

- 설계 문서: [docs/superpowers/specs/2026-08-12-ralli-landing-a-design.md](../../../../../docs/superpowers/specs/2026-08-12-ralli-landing-a-design.md) — 왜 framer-motion을 골랐는지, CSS Scroll-driven Animation을 왜 안 썼는지(Safari 26 미만 폴백), 시안 rAF 로직 ↔ framer-motion 대응표
- 구현 계획: [docs/superpowers/plans/2026-08-12-ralli-landing-a.md](../../../../../docs/superpowers/plans/2026-08-12-ralli-landing-a.md)
- framer-motion 공식 문서: [Scroll animations](https://motion.dev/docs/react-scroll-animations)
