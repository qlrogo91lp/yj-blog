# Ralli 랜딩 A 시안 적용 — 설계 문서

> 작성일: 2026-08-12
> 대상 라우트: `src/app/(main)/apps/ralli`
> 시안: [`docs/design/ralli/Ralli Landing A.dc.html`](../../design/ralli/Ralli%20Landing%20A.dc.html)
> 배경: 앱 랜딩 시안 A(다크 · 스크롤 연동 몰입형)를 확정하고 기존 `/apps/ralli` 페이지를 전면 교체한다. 시안은 프레임워크 없는 정적 HTML + 명령형 `requestAnimationFrame` 루프로 작성되어 있어, React·Next.js 구조와 프로젝트 컨벤션에 맞게 재구성해야 한다.

## 1. 현재 상태와 격차

기존 `/apps/ralli`는 아이콘 + 태그라인 히어로, 기능 4블록(`RalliFeatureSection`), 스크린샷 가로 스크롤, 지원 이메일 섹션으로 구성된 정적 페이지다. 애니메이션은 없다.

시안 A는 성격이 다르다.

| 구간            | 시안 A 구성                                                       | 스크롤 길이    |
| --------------- | ----------------------------------------------------------------- | -------------- |
| Hero            | `RALLI` 5글자 비산 + 워치 확대 + 코트 SVG 3D 회전 + 스코어 시퀀스 | `280vh` sticky |
| 마퀴            | 텍스트 무한 루프                                                  | CSS only       |
| 01 On the court | 3-step 이미지 크로스페이드 + 스텝 카드 하이라이트                 | `300vh` sticky |
| 02 Health       | 카운트업 스탯 3장 + 이미지 2장                                    | 일반 흐름      |
| 03 Replay       | 스크롤 연동 가로 드리프트 갤러리                                  | 일반 흐름      |
| 04 Your rules   | 룰 칩 + 이미지 2장                                                | 일반 흐름      |
| Footer          | 아이콘 + 최종 CTA + 링크                                          | 일반 흐름      |

즉 **기존 컴포넌트 4개는 재사용 대상이 아니라 교체 대상**이다. 유지되는 것은 `ralli-cta-button.tsx`, `ralli-json-ld.tsx`, `ralli-content.ts`(카피 재작성), `privacy/page.tsx`뿐이다.

### 1.1 시안이 답하지 않은 것

시안을 그대로 옮기면 세 가지가 깨진다. 설계에서 각각 결론을 낸다.

1. **레이아웃 중복** — 시안은 자체 fixed pill 내비와 자체 푸터를 갖는다. `/apps/ralli`는 `(main)` 레이아웃 소속이라 공용 `Header`·`Footer`를 이미 받는다.
2. **모바일 대응 부재** — 시안의 미디어 쿼리는 **0개**다. 전 구간이 `grid-template-columns: 1fr 1fr` 등 데스크톱 고정이다.
3. **자산 해상도** — Watch 스크린샷 원본이 시안의 표시 크기를 감당하지 못한다 (5.1).

## 2. 레이아웃 통합 방침

`(main)` 레이아웃에 그대로 남기고 공용 `Header`를 유지한다. `Header`는 이미 `sticky top-0 z-50`에 자체 `dark` 클래스와 `bg-black/80 backdrop-blur`를 갖고 있어 시안의 `#07100B` 배경과 정합한다.

| 시안 요소                                           | 처리                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| fixed pill 내비 (`Ralli` 워드마크 + 앵커 3개 + CTA) | 워드마크 제거, **섹션 앵커 서브 내비**로 축소. 공용 Header 아래 `top-17.5`에 fixed            |
| 시안 푸터                                           | **최종 CTA 섹션**으로 렌더. 아이콘 · "Go win the next one." · CTA · Privacy/Support 링크 유지 |
| 시안 푸터의 `© 2026 YJlogs`                         | **제거**. 공용 `Footer`가 이미 동일 문구를 렌더하므로 중복                                    |
| 기존 `page.tsx`의 `← Apps` 백링크                   | **제거**. 공용 Header의 `NavLinks`에 `Apps`가 이미 있다                                       |

Hero의 sticky 컨테이너는 `top-0 h-screen` 대신 **`top-14 h-[calc(100vh-3.5rem)]`** 로 둔다. 공용 Header 높이(`h-14` = 56px)만큼 내려 콘텐츠가 헤더 뒤로 숨지 않게 한다.

## 3. 애니메이션 구현 방식

### 3.1 선택: framer-motion `useScroll` + `useTransform`

시안은 전역 `rAF` 루프 하나가 매 프레임 모든 대상의 `getBoundingClientRect()`를 읽고 인라인 스타일을 직접 쓴다. 세 가지 대안을 비교했다.

| 방식                                     | 장점                                                                    | 채택하지 않은 이유                                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **framer-motion**                        | 이미 의존성에 있음, 선언형, MotionValue가 리렌더를 우회해 DOM에 직접 씀 | — **채택**                                                                                                                   |
| CSS Scroll-driven (`animation-timeline`) | JS 0줄, 네이티브                                                        | Safari 26 미만에서 전부 정적으로 폴백. Apple 앱 랜딩에서 감수하기 어렵다. 스코어 텍스트 교체(`0→15→30→40→GAME`)는 CSS로 불가 |
| 커스텀 `rAF` 훅으로 시안 로직 포팅       | 충실도 100%                                                             | 명령형 DOM 조작이라 테스트 불가에 가깝고, "순수 컴포넌트 + props" 컨벤션과 어긋남                                            |

framer-motion 12는 이미 `src/components/nav/nav-links.tsx`(공용 Header)에서 사용 중이다. Header는 모든 페이지에 렌더되므로 **번들 추가 비용은 사실상 0**이다. 이 사실이 선택을 결정했다.

### 3.2 시안 로직 → framer-motion 대응표

| 시안 로직                                       | 대응                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `this.sp += (raw - this.sp) * 0.11` (수동 lerp) | `useSpring(scrollYProgress, { stiffness, damping })`                       |
| `prog(el)` = `-rect.top / (height - vh)`        | `useScroll({ target, offset: ['start start', 'end end'] })`                |
| 글자 5개 비산 (`dir * le * 58vw`)               | 글자별 `useTransform` → `motion.span`                                      |
| 워치 `scale` · `rotate` · `opacity`             | `useTransform` 3개 → `motion.img`                                          |
| 코트 SVG `rotateX(56→36deg)`                    | `useTransform` + `motion.svg` (`transformPerspective: 900`)                |
| 스코어 `0→15→30→40→GAME`                        | `useMotionValueEvent` + `useState` (값이 바뀔 때만 리렌더)                 |
| pin 섹션 3-step 인덱스                          | `useMotionValueEvent` → `stepIndexAt(p)` → `AnimatePresence` 크로스페이드  |
| 갤러리 가로 드리프트                            | `useScroll({ offset: ['start end', 'end start'] })` → `useTransform` → `x` |
| `[data-reveal]` 매 프레임 계산                  | `<Reveal>` 래퍼의 `whileInView` + `viewport={{ once: true }}`              |
| `data-count` 카운트업                           | `animate(0, to, { onUpdate })` — 1회 발화 보장 내장                        |
| 마퀴 · scroll hint bob                          | CSS `@keyframes` 그대로 (JS 불필요)                                        |

핵심 이득은 `viewport={{ once: true }}` 다. 시안은 매 프레임 모든 `[data-reveal]`의 `getBoundingClientRect()`를 읽어 레이아웃을 강제 계산한다. framer-motion은 `IntersectionObserver`로 처리하고 1회 발화 후 관찰을 해제한다.

## 4. 파일 구조

```
src/app/(main)/apps/ralli/
├── page.tsx                          ✏️  Server Component — 영역 조립 + metadata
├── _utils/
│   ├── ralli-content.ts              ✏️  시안 카피로 재작성 (섹션 라벨·헤딩·스탯·룰 칩)
│   ├── ralli-content.test.ts         ✏️  확장
│   └── ralli-motion.ts               ✨  순수 함수 — clamp, mapRange, scoreAt, stepIndexAt
├── _hooks/
│   ├── useSectionProgress.ts         ✨  useScroll + useSpring 공통 셋업 + reduced-motion 분기
│   └── useIsMobile.ts                ✨  matchMedia — Replay 갤러리 전용 (6.2 참조)
├── _components/                      순수 — props만 받아 렌더
│   ├── ralli-shot.tsx                ✨  마스크 적용 next/image 래퍼 (모든 스크린샷 공통)
│   ├── ralli-section-label.tsx       ✨  "01 — ON THE COURT"
│   ├── ralli-court-svg.tsx           ✨  히어로 코트 라인
│   ├── ralli-marquee.tsx             ✨  CSS keyframes만 쓰므로 순수
│   ├── ralli-cta-button.tsx          ♻️  유지
│   ├── ralli-cta-button.test.tsx     ♻️  유지
│   └── ralli-json-ld.tsx             ♻️  유지
├── _actions/                         재사용 인터랙션 조각
│   ├── ralli-section-nav.action.tsx  ✨  pill 앵커 내비 + 모바일 하단 CTA 바 (고정 오버레이)
│   └── reveal.action.tsx             ✨  범용 whileInView 래퍼
├── _areas/                           page.tsx가 조립하는 세로 구간
│   ├── hero.area.tsx                 ✨  280vh sticky 히어로
│   ├── watch.area.tsx                ✨  01 — 300vh pin 섹션 (3-step 크로스페이드)
│   ├── workout.area.tsx              ✨  02 — 카운트업 스탯 + 이미지 2장
│   ├── replay.area.tsx               ✨  03 — 가로 드리프트 갤러리
│   ├── rules.area.tsx                ✨  04 — YOUR RULES
│   └── final-cta.area.tsx            ✨  시안 푸터 = 최종 CTA
└── privacy/page.tsx                  ♻️  그대로

🗑️  ralli-hero.tsx · ralli-feature-section.tsx · ralli-screenshot-gallery.tsx
    ralli-support.tsx · ralli-support.test.tsx
```

`ralli-support.tsx`는 지원 이메일과 Privacy 링크만 담고 있어 시안 푸터의 `Privacy Policy · Support` 링크로 완전히 흡수된다.

### 4.1 폴더 배치 근거 — `_areas` 신설

이 랜딩은 세로로 길고 구간이 명확히 나뉜다. 각 구간을 `_actions`에 넣으면 `_actions`의 정의("form 전송·zustand 상태·input/button 액션 등 클라이언트 로직이 필요한 컴포넌트")와 어긋난다 — 이 구간들의 공통점은 인터랙션이 아니라 **페이지에서 차지하는 세로 위치**다.

그래서 `page-folder.md`에 `_areas/*.area.tsx` 역할을 신설했다. 기존 dot-suffix 컨벤션(`*.action.tsx`, `*.handler.tsx`)과 폴더↔suffix 짝 규칙을 그대로 따른다.

| 대상                      | 위치                                    | 이유                                     |
| ------------------------- | --------------------------------------- | ---------------------------------------- |
| 히어로 · 01~04 · 최종 CTA | `_areas/*.area.tsx`                     | 여러 조각을 묶어 화면 한 구간을 완성한다 |
| 마퀴                      | `_components/ralli-marquee.tsx`         | 조각 하나로 끝나는 단일 위젯             |
| 앵커 내비 · 하단 CTA 바   | `_actions/ralli-section-nav.action.tsx` | 고정 오버레이라 세로 구간이 아니다       |
| `Reveal` 래퍼             | `_actions/reveal.action.tsx`            | 영역 여러 곳에서 재사용한다              |

`_areas`에는 **서버 데이터 페칭과 전역 상태를 두지 않는다**는 제약이 붙는다. 이 랜딩은 이를 자연히 만족한다 — 콘텐츠가 전부 `_utils/ralli-content.ts` 정적 모듈 import이고, `_queries`·`_services` 호출이나 zustand·tanstack-query 구독이 한 곳도 없다. 각 Area가 갖는 상태는 스크롤 진행도와 활성 스텝 인덱스뿐이며 영역 밖으로 나가지 않는 뷰 로컬 상태다.

영역 안의 마크업과 모션을 순수/모션 2층으로 다시 쪼개지는 않는다. 히어로의 글자 비산처럼 **마크업 자체가 애니메이션 단위**인 구간이 많아 분리하면 오히려 추적이 어려워진다. 영역 파일 안에서만 쓰이는 하위 컴포넌트(`HeroLetter`, `StatCard`)는 부모의 `progress` MotionValue에 묶여 있어 재사용 가능하지 않으므로 같은 파일 안에 private으로 둔다. 실제로 재사용되는 조각(`RalliShot`, `RalliSectionLabel`, `RalliMarquee`, `RalliCourtSvg`)만 `_components`로 뽑는다.

`page.tsx`는 서버 컴포넌트를 유지하고 중간 `*PageAction` 래퍼 없이 Area를 순서대로 나열한다. `page.tsx`를 읽는 것만으로 페이지의 세로 구성이 드러나야 한다. 카피는 `ralli-content.ts`에서 읽으므로 Area 컴포넌트도 콘텐츠를 하드코딩하지 않는다.

## 5. 이미지 자산

시안은 모든 스크린샷에 `object-fit: contain` + radial-gradient 마스크(가장자리 페이드)를 적용해 배경에 녹여낸다. 따라서 **원본을 크롭하면 안 된다** — 마스크가 화면 내용을 잘라먹는다. 원본 비율 그대로 사용하는 것이 전제다.

### 5.1 Watch 스크린샷 해상도 부족

| 자산          | 원본      | 시안 표시 크기                             | 2x DPR 요구 | 판정        |
| ------------- | --------- | ------------------------------------------ | ----------- | ----------- |
| `watch-*.png` | 422×514   | Hero `64vh`(최대 560px), pin 섹션 약 520px | 약 1120px   | ⚠️ **부족** |
| `ios-*.png`   | 1284×2778 | 520px                                      | 1040px      | ✅ 충분     |

Watch 스크린샷을 화면 절반 크기로 확대하는 시안 특성상 현재 자산으로는 뿌옇게 렌더된다. 해결책은 두 가지이며 **2x 재캡처를 우선**한다 (Apple Watch Ultra 49mm 시뮬레이터 → 820×1004px).

재캡처가 불가하면 **데스크톱** 표시 크기를 `64vh → 44vh`로 낮춰 회피한다. 6절의 모바일 `44vh`와 수치가 같지만 성격이 다르다 — 모바일은 스코어·태그라인 자리를 확보하려는 레이아웃 결정이고, 이쪽은 해상도 부족을 덮으려는 폴백이다. 재캡처에 성공하면 데스크톱은 `64vh`를 유지하고 모바일만 `44vh`가 된다.

### 5.2 그 외

- 시안은 `https://yjlogs.com/ralli/...` 절대 URL을 쓰지만, 실제 구현은 `/ralli/...` 로컬 경로 + `next/image`를 유지한다. 히어로 워치 이미지만 `priority`.
- `ralli-content.ts`가 이미 `width`/`height`를 보유하므로 `RalliShot`이 이를 받아 `sizes`를 지정한다.
- `watch-home-global.png`는 시안 어느 구간에도 등장하지 않는다. `ralli-content.ts`에서 제거한다.

## 6. 모바일 레이아웃

`md`(768px) 단일 분기로 간다. 시안이 데스크톱 레이아웃 하나뿐이라 2단 분기로 충분하다.

| 섹션                | 데스크톱 (시안)           | 모바일                                              |
| ------------------- | ------------------------- | --------------------------------------------------- |
| Hero                | `280vh` sticky            | `180vh` — 스와이프는 체감 스크롤 거리가 길다        |
| └ 글자 비산         | `±58vw`                   | **동일** (아래 참조)                                |
| └ 워치 이미지       | `64vh`                    | `44vh` — 스코어·태그라인 자리 확보                  |
| └ 스코어 / 태그라인 | 좌우 절대배치             | 세로 스택 (스코어 상단 → 워치 → 카피 하단)          |
| 01 Pin 섹션         | `300vh`, `1fr 1fr`        | `240vh`, 이미지 상단 + 스텝 카드 하단               |
| 02 Workout 스탯     | `repeat(3,1fr)`           | 1컬럼 스택, 이미지 2장도 세로                       |
| 03 Replay 갤러리    | 스크롤 연동 가로 드리프트 | `overflow-x:auto` + `scroll-snap`, 높이 `520→380px` |
| 04 Rules            | `1fr 1fr`, `padding:56px` | 1컬럼, `padding:28px`                               |
| 최종 CTA            | 중앙 정렬                 | 그대로 (`clamp()`가 이미 처리)                      |

글자 비산 폭은 데스크톱과 동일한 `±58vw`를 쓴다. 390px 기준으로 최외곽 글자(`dir=1.7`)는 `98.6vw`(385px)라 이미 화면 밖으로 나가고, 내측 글자(`dir=0.85`)는 `49.3vw`(192px)로 완전히 이탈하진 않지만 **`opacity`가 `p=0.56`에서 0에 도달**하는 반면 x 이동은 `p=0.84`까지 이어지므로 그 시점엔 보이지 않는다. 값을 키울 실익이 없고, 뷰포트 분기용 훅 하나를 덜 수 있다.

**섹션 앵커 내비**는 모바일에서 `Watch/Workout/iPhone` + `Get Ralli`를 한 줄에 넣기 좁다. 앵커를 숨기고 **하단 고정 CTA 바**로 대체한다. 상단 공용 Header와 겹치지 않고, 앱 랜딩 전환 동선으로도 낫다.

### 6.2 뷰포트 분기 수단

대부분의 모바일 대응은 Tailwind `md:` 클래스로 처리한다 — 섹션 높이(`h-[180vh] md:h-[280vh]`), 그리드 컬럼, 내비/하단 바 표시 여부(`hidden md:flex` / `flex md:hidden`) 모두 CSS만으로 충분하다.

JS 분기가 필요한 곳은 **03 Replay 갤러리 한 곳뿐**이다. 데스크톱은 스크롤 연동 `transform: translateX`로 드리프트시키고 모바일은 네이티브 `overflow-x` 스크롤을 쓰는데, 두 방식이 같은 축에서 충돌하므로 CSS로 분기할 수 없다. 이 한 곳을 위해 `_hooks/useIsMobile.ts`(`matchMedia` 기반)를 둔다.

### 6.1 `prefers-reduced-motion`은 별개 축

모바일은 애니메이션을 유지하되 값만 줄이는 반면, reduced-motion은 **sticky 시퀀스 자체를 해제**한다.

- sticky 컨테이너 높이를 `280vh`/`300vh` → `auto`로 바꾼다
- 모든 모션 요소를 최종 상태(글자 원위치, 워치 확대 완료, 스텝 전부 표시)로 렌더한다
- 카운트업은 최종 숫자를 즉시 표시한다

각 Area는 `useSectionProgress`가 반환하는 `isStatic` 분기 하나를 갖는다. 즉 분기는 **뷰포트(`md`) × reduced-motion 2축**이며 서로 독립이다.

## 7. 스타일 토큰 · 마스크

시안 팔레트는 프로젝트 shadcn 토큰과 완전히 별개다. 다만 **선언 위치를 두 곳으로 나눈다**.

```css
/* src/app/globals.css — 파일 상단 @theme inline 블록 옆에 추가 */
@theme {
  --color-ralli-bg: #07100b;
  --color-ralli-fg: #f2f5f0;
  --color-ralli-lime: #c8ff3d;
  --color-ralli-green: #34c759;
}
```

```css
/* src/styles/ralli.css — globals.css 하단에서 @import */
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
```

`@theme`를 `ralli.css`에 두지 않는 이유는, `globals.css`가 `prose.css`·`highlight.css`를 **파일 하단(146~147행)에서** `@import`하기 때문이다. 일반 CSS 규칙은 이 순서로도 동작하지만 `@theme`은 Tailwind가 유틸리티를 생성하기 전에 수집해야 하므로 늦은 `@import` 안에 두면 처리가 보장되지 않는다. 토큰만 `globals.css`에 두고 나머지는 기존 패턴대로 분리한다.

`@theme`에 `--color-*`로 등록하면 Tailwind v4가 `bg-ralli-lime` / `text-ralli-fg` 유틸리티를 자동 생성한다. 임의값 `bg-[#C8FF3D]`를 40여 곳에 반복하는 것보다 낫고, 무엇보다 **알파 수식자**를 쓸 수 있다 — 시안은 `rgba(242,245,240, α)`를 `0.04`부터 `0.62`까지 16종 사용하는데, 이를 `text-ralli-fg/55`처럼 표현할 수 있다. 순수 CSS 변수(`text-(--ralli-fg)`)로는 알파 수식자가 동작하지 않아 이 방식이 필요하다.

마스크는 `ellipse 62% 74%` 커스텀 지오메트리라 Tailwind v4.1의 `mask-radial-*` 유틸리티보다 CSS 클래스가 읽기 쉽다. `RalliShot` 컴포넌트가 항상 이 클래스를 붙이므로 개별 사용처에서 신경 쓸 필요가 없다.

마퀴(`rl-marq`)와 scroll hint bob(`rl-bob`) `@keyframes`도 이 파일에 둔다.

Tailwind v4 문법을 지킨다 — 그라디언트는 `bg-linear-to-*`(v3의 `bg-gradient-to-*` 아님), CSS 변수 참조는 `max-w-(--x)` shorthand를 쓴다.

### 7.1 테마

프로젝트는 `next-themes`를 쓰지만 이 페이지는 `#07100B` 다크 고정이다. 루트 컨테이너에 `dark` 클래스를 강제한다. 공용 Header도 자체 `dark`를 갖고 있어 정합한다.

## 8. 테스트

### 8.1 Vitest — 순수 로직 집중

| 파일                        | 검증                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `ralli-motion.test.ts`      | `scoreAt(p)` 경계값(`0/15/30/40/GAME`), `stepIndexAt(p)` → `0/1/2`, `mapRange` clamp 동작 |
| `ralli-content.test.ts`     | 섹션 넘버링 연속성(01~04), 모든 `src`가 `/ralli/`로 시작, `alt` 비어있지 않음             |
| `ralli-shot.test.tsx`       | 마스크 클래스 적용, `alt`·`width`·`height` 전달                                           |
| `ralli-cta-button.test.tsx` | 기존 유지                                                                                 |

`_areas` 컴포넌트는 jsdom에 레이아웃이 없어 `useScroll`이 정상 동작하지 않는다. **정적 폴백(reduced-motion) 경로만** 렌더 테스트한다.

### 8.2 Playwright — E2E

- 4개 섹션 헤딩 렌더, 앵커 클릭 → 해당 섹션 도달
- App Store CTA `href` 검증(내비 · 히어로 · 최종 CTA 3곳), Privacy 링크 이동
- **모바일 390×844에서 가로 스크롤 미발생** (`body.scrollWidth <= innerWidth`) — 시안의 모바일 대응이 0이므로 이 회귀 가드가 가장 중요하다
- reduced-motion 에뮬레이션 후 전 섹션 가시성

## 9. 구현 단계에서 확정할 항목

아래 4개는 실물 렌더를 보고 정한다. 재검토하지 않을 경우 **기본값**대로 진행한다.

| #   | 항목                    | 선택지                                               | 기본값           | 근거                                                                                                                                |
| --- | ----------------------- | ---------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 폰트                    | 시안의 Plus Jakarta Sans 추가 vs 프로젝트 Geist 통일 | **Geist 통일**   | 추가 로드 0 · 사이트 일관성. 다만 히어로 `RALLI` 800 weight 초대형 타이포는 자소 폭이 달라 인상이 바뀔 수 있어 실물 비교가 필요하다 |
| 2   | Watch 이미지            | 2x 재캡처 vs 표시 크기 축소                          | **2x 재캡처**    | 5.1 참조. 시뮬레이터 재캡처 가능 여부 확인 필요                                                                                     |
| 3   | 모바일 CTA              | 하단 고정 바 vs pill 내비 축소 유지                  | **하단 고정 바** | 6절 참조                                                                                                                            |
| 4   | `watch-home-global.png` | 갤러리 추가 vs 콘텐츠에서 제거                       | **제거**         | 시안 어느 구간에도 쓰이지 않는다                                                                                                    |

1번(폰트)이 인상을 가장 크게 좌우한다. 구현 첫 단계에서 히어로 타이포를 두 벌로 렌더해 나란히 비교한다.

## 10. 열린 확인 사항

시안 02 Health 섹션의 스탯 수치(`642 kcal` · `148 bpm` · `87 min`)는 시안 작성자가 넣은 예시값이다. 라벨이 "Active energy, tracked per match"처럼 지표 설명이라 예시임이 문맥상 드러나지만, 실제 앱 스크린샷 수치와 맞추는 편이 정확하다. 구현 시 실제 값 확인이 가능하면 교체한다.
