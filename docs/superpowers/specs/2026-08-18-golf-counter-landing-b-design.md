# GolfCounter 랜딩 B 시안 적용 — 설계 문서

> 작성일: 2026-08-18
> 대상 라우트: `src/app/(main)/apps/golf-counter`
> 시안: [`docs/design/ralli/Ralli Landing B.dc.html`](../../design/ralli/Ralli%20Landing%20B.dc.html)
> 배경: Ralli 랜딩 시안 중 채택되지 않은 **B안(라이트 · 베이토 그리드형)의 레이아웃·모션 구조**를 GolfCounter 랜딩에 적용한다. 시안의 카피·이미지는 전부 테니스(Ralli) 기준이므로 골프 콘텐츠로 교체하고, 색은 다크로 뒤집는다. 선행 사례인 [Ralli 랜딩 A](2026-08-12-ralli-landing-a-design.md)에서 만든 모션 인프라를 공용으로 승격해 재사용한다.

## 1. 현재 상태와 목표

`/apps/golf-counter`에는 아직 랜딩이 없다. 현재 폴더에는 `privacy/page.tsx`와 3줄짜리 `_utils/golf-counter-content.ts`(이름·아이콘·지원 이메일)만 있고, 랜딩 요청은 `apps/[slug]/page.tsx`의 동적 라우트가 받고 있다.

`golf-counter/page.tsx`를 추가하면 정적 세그먼트가 동적 세그먼트보다 우선하므로 `/apps/golf-counter`는 랜딩으로 바뀐다. `/apps/ralli`가 이미 같은 상태이므로 의도된 동작이며, `apps-data.ts`의 `golf-counter` 항목은 `/apps` 목록 카드용으로 계속 쓰인다.

### 1.1 시안 B의 구성

| 구간   | 시안 B 구성                                                       | 스크롤 길이    |
| ------ | ----------------------------------------------------------------- | -------------- |
| Hero   | stage 컨테이너 확대(50→94vw) + 칩 4개 사방 비산 + 헤드 페이드아웃 | `300vh` sticky |
| Watch  | 베이토 그리드 (세로 tall 카드 1 + 정사각 카드 2)                  | 일반 흐름      |
| Health | 2컬럼 pin — 좌측 3-step 리스트 + 우측 이미지 크로스페이드         | `280vh` sticky |
| iPhone | 3열 갤러리 + 룰 카드(2컬럼)                                       | 일반 흐름      |
| Footer | 유리 카드 안에 아이콘 + 최종 CTA + 링크                           | 일반 흐름      |

A안과 겹치는 부분이 없다. A안은 글자 비산 히어로 · 마퀴 · 카운트업 스탯 · 가로 드리프트 갤러리로 구성된 세로 흐름이고, B안은 stage 확대 히어로 · 베이토 · 2컬럼 pin이다. **두 랜딩은 나란히 놓아도 별개 디자인으로 읽힌다.**

### 1.2 시안이 답하지 않은 것

시안을 그대로 옮기면 네 가지가 깨진다. 각각 아래에서 결론을 낸다.

1. **레이아웃 중복** — 시안은 자체 fixed pill 내비와 자체 푸터를 갖는다 (2절)
2. **라이트 테마** — 사용자 결정으로 다크로 전환. B안은 밝은 배경 위 검은 카드로 대비를 만드는 구조라 단순 반전으로 끝나지 않는다 (3절)
3. **콘텐츠 부족** — 시안 이미지 슬롯 11개에 대응할 GolfCounter 자산이 부족하다 (4절)
4. **워치 스크린샷 해상도** — 시안의 stage 확대 크기를 원본 422×514가 감당하지 못한다 (5절)

## 2. 레이아웃 통합 방침

`(main)` 레이아웃에 그대로 두고 공용 `Header`·`Footer`를 받는다.

| 시안 요소                                           | 처리                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| fixed pill 내비 (`Ralli` 워드마크 + 앵커 3개 + CTA) | **전부 제거.** 공용 Header만 사용                                           |
| 시안 푸터 유리 카드                                 | **최종 CTA 섹션**으로 렌더 (아이콘 · 헤드라인 · CTA · Privacy/Support 링크) |
| 시안 푸터의 `© 2026 YJlogs`                         | **제거.** 공용 `Footer`가 이미 렌더                                         |

A안은 시안의 pill 내비를 "섹션 앵커 서브 내비"로 축소해 남겼지만, **B안에서는 제거한다.** 사용자 결정이며, 근거도 있다 — B안 섹션은 4개뿐이고 각 섹션이 화면을 크게 점유해서 앵커 점프의 실익이 작다. 상단 고정 요소가 하나 줄어 hero의 stage 확대 연출이 더 잘 보인다.

Hero의 sticky 컨테이너는 A안과 동일하게 **`top-14 h-[calc(100vh-3.5rem)]`** 로 둔다. 공용 Header 높이(`h-14` = 56px)만큼 내려 콘텐츠가 헤더 뒤로 숨지 않게 한다.

## 3. 테마 — B안을 다크로 뒤집기

### 3.1 단순 반전이 안 되는 이유

시안 B는 밝은 배경(`#F2F2F7`) 위에 **검은 이미지 카드(`#0A0A0A`)** 를 얹어 대비를 만든다. 스크린샷 배경이 순수 검정이라 카드와 이음매가 보이지 않는 구조다 (PNG 코너 픽셀 확인: `rgba(0,0,0,255)`, 전 자산 동일).

배경을 검게 하면 이 대비가 사라진다. 해결은 **이미지 카드를 페이지 배경보다 더 어둡게** 두는 것이다. 카드가 "패인 면"으로 읽히고, 스크린샷과의 이음매는 여전히 없다. A안이 `ralli-shot-mask`(radial 마스크 페이드)로 풀었던 문제를 여기서는 색만으로 푼다 — **따라서 B안에는 마스크가 필요 없다.**

| 요소            | 시안 B (라이트)                                       | GolfCounter (다크)                            |
| --------------- | ----------------------------------------------------- | --------------------------------------------- |
| 페이지 배경     | `#F2F2F7`                                             | `--color-golf-bg` `#050a06`                   |
| 이미지 카드     | `#0A0A0A`                                             | **순수 `#000`** + `border-white/8`            |
| 유리 카드       | `rgba(250,250,250,.72)` + `blur(26px) saturate(180%)` | `bg-white/6` + 동일 blur + `border-white/10`  |
| 본문 텍스트     | `#000` / `rgba(60,60,67,.6)`                          | `--color-golf-fg` `#f1f5f1` / `text-white/55` |
| 메시 그라디언트 | green · blue · purple radial                          | green · orange radial, opacity 하향           |

### 3.2 강조색: iOS 블루 → 그린 + 오렌지

시안의 강조색은 iOS 시스템 블루(`#007AFF`)다. GolfCounter 앱 UI는 **초록 스코어 링 + 주황 홀 플래그**를 쓰고 아이콘 배경도 `#00520A`(진한 골프 그린)라, 블루를 유지하면 앱과 랜딩 색이 따로 논다. 동시에 A안(라임 `#c8ff3d` + 그린)과도 구분된다.

```css
/* src/app/globals.css — 기존 --color-ralli-* 옆에 추가 */
@theme {
  --color-golf-bg: #050a06;
  --color-golf-fg: #f1f5f1;
  --color-golf-green: #34c759;
  --color-golf-orange: #ff9f0a;
}
```

토큰을 `--color-ralli-*`와 공유하지 않고 신설한다. 이름이 앱에 묶여 있어야 나중에 한쪽 랜딩의 색만 바꿀 수 있다.

**`src/styles/golf-counter.css`는 만들지 않는다.** B안에는 마퀴·bob 같은 CSS 키프레임이 없고(A안의 `ralli.css`는 그것 때문에 존재), 메시 그라디언트와 유리 효과는 Tailwind 유틸로 처리된다. 파일을 만들면 `@import` 한 줄과 빈 파일만 남는다.

### 3.3 테마 강제

페이지 루트에 `dark` 클래스를 걸어 사이트 테마 설정과 무관하게 다크로 고정한다. `/apps/ralli`가 이미 같은 방식이다. 앱 랜딩은 각자의 브랜드 톤을 강제하고, 공용 Header만 사용자 테마를 따른다.

## 4. 섹션 구조 · 콘텐츠 매핑

### 4.1 자산 제약: iPhone 화면이 한 장뿐

파일명이 `ios-`로 시작하는 자산 4장 중 **3장은 실제로 워치 화면을 담은 세로 마케팅 이미지**다.

| 파일                        | 원본      | 실제 내용                                                   |
| --------------------------- | --------- | ----------------------------------------------------------- |
| `watch-match-en.png`        | 422×514   | 워치 홀 스코어 다이얼 (목업만, 텍스트 없음)                 |
| `watch-score-en.png`        | 422×514   | 워치 스코어카드 `Total: 46 +10`                             |
| `watch-home-en.png`         | 422×514   | 워치 홈 `Start 18 Holes` · `Holes 18`                       |
| `watch-workout-en.png`      | 422×514   | 워치 워크아웃 지표 (시간 · kcal · 심박)                     |
| `watch-complication-en.png` | 422×514   | 워치 페이스 + 컴플리케이션                                  |
| `ios-watch-match-en.png`    | 1284×2778 | **워치** 스코어 다이얼 + "One tap / One stroke"             |
| `ios-watch-score-en.png`    | 1284×2778 | **워치** 스코어카드 + "The full scorecard, at a glance"     |
| `complication-en.png`       | 1284×2778 | **워치** 페이스 + "Easy to launch"                          |
| `connectivity-en.png`       | 1284×2778 | 아이폰 + 워치 나란히 + "Easy scoring, right on your wrist." |
| `ios-stat-en.png`           | 1284×2778 | **아이폰 Stats 화면** + "Stats, too"                        |

즉 순수 iPhone 앱 화면은 `ios-stat-en.png` 하나뿐이다. 시안의 `#iphone` 섹션(3열 아이폰 갤러리)을 채울 재료가 없다.

**구조 조정 두 가지:**

1. `#iphone` 섹션을 **3열 → 2열**로 줄이고, 주제를 "아이폰"이 아니라 **"라운드가 끝난 뒤"** 로 재정의한다.
2. Health pin을 **3-step → 2-step**으로 줄인다. 워크아웃·동기화 주제에 맞는 이미지가 2장뿐이고, 세 번째로 통계 화면을 끌어오면 4번 섹션과 주제가 겹친다.

`stepIndexAt(progress, stepCount = 3)`이 이미 `stepCount` 파라미터를 받으므로 2-step 전환에 **유틸 수정이 전혀 필요 없다.** 호출부에서 `stepIndexAt(p, 2)`로 넘기면 된다.

### 4.2 이미지 그대로 사용

시안은 이미지에 텍스트가 없다고 가정하지만 위 자산 5장에는 마케팅 헤드라인이 박혀 있다. **크롭하지 않고 원본 그대로 쓴다** (사용자 결정). A안도 동일한 성격의 자산(`ios-summary-global.png` 등 — "Every match / a memory" 헤드라인 포함)을 그대로 쓰고 있어 선례가 일치한다.

카드 카피는 이미지 속 헤드라인과 **다른 말을 하도록** 작성한다. 같은 문장을 반복하면 두 겹으로 읽힌다.

### 4.3 최종 배치

| #   | 섹션                   | id       | 이미지                                                                   | 헤드라인                                                                                       |
| --- | ---------------------- | -------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1   | Hero (pin 300vh)       | —        | `watch-match-en`                                                         | 배지 "● Live on Apple Watch & iPhone" (시안 그대로)<br>H1 "Play the round.<br>Not your phone." |
| 2   | On the course (베이토) | `course` | tall `ios-watch-match-en`<br>`watch-complication-en`<br>`watch-score-en` | "Everything happens on your wrist."                                                            |
| 3   | Health (pin 2-step)    | `health` | `watch-workout-en`<br>`connectivity-en`                                  | "A round is a workout — logged automatically."                                                 |
| 4   | After the round (2열)  | `after`  | `ios-stat-en`<br>`ios-watch-score-en`                                    | "Every round adds up."                                                                         |
| 5   | 룰 카드                | —        | `watch-home-en`                                                          | "Nine or eighteen. Your call."                                                                 |
| 6   | Final CTA              | —        | `golf-counter.png`                                                       | "Ready for the first tee?"                                                                     |

`complication-en.png`만 미사용이다. `watch-complication-en.png`와 **같은 워치 페이스 화면**이라 정보 손실이 없다. 나머지 9장을 중복 없이 쓴다.

`golf-counter-content.ts`에서 미사용 자산은 아예 정의하지 않는다 (A안이 `watch-home-global.png`를 제거한 것과 동일한 판단).

### 4.4 Hero 세부

**칩 4개** — 시안은 칩이 사방으로 흩어지는 구성이라 개수를 유지한다. 값은 **스크린샷에 실제로 찍힌 숫자만** 쓴다.

| 칩  | 라벨    | 값            | 색     | 출처             |
| --- | ------- | ------------- | ------ | ---------------- |
| 0   | `TOTAL` | `46` `+10`    | green  | `watch-score-en` |
| 1   | `HOLES` | `18`          | fg     | `watch-home-en`  |
| 2   | `PUTTS` | `1.8` `/hole` | fg     | `ios-stat-en`    |
| 3   | `BEST`  | `+9`          | orange | `ios-stat-en`    |

A안은 시안 데모 수치(`642 kcal` · `148 bpm` · `87 min`)를 그대로 옮겼지만, 여기서는 실제 화면 값을 쓴다. 심박·칼로리 칩을 넣으려면 근거 없는 숫자를 지어내야 해서 제외했다 (10절 확인 사항).

**stage 라벨** — 시안 `Set 2 · 4–3 · your serve` → **`Hole 2 · Par 4 · +3`**. hero 이미지에 찍힌 값과 정확히 일치시킨다.

**서브 카피** — 시안 문장 구조가 골프에 그대로 옮겨진다:
`"GolfCounter counts strokes, putts, and calories from your wrist — then hands the whole round back to your iPhone."`

### 4.5 CTA — App Store 출시됨

GolfCounter는 App Store에 출시되어 있다. 시안대로 **활성 CTA 버튼 2곳**(hero 하단 · 최종 CTA)을 그대로 렌더한다.

```
https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372
```

`/kr/`·`/us/` 양쪽 스토어프론트 모두 열리는 것을 확인했다. **`/us/`를 쓴다** — 랜딩이 영문이고, 앱의 지원 언어도 영어 단일이며, `ralliMeta.appStoreUrl`도 `/us/`라 일관된다.

App Store에서 확인한 메타데이터:

| 항목          | 값                           |
| ------------- | ---------------------------- |
| 스토어 표기명 | GolfCounter with Watch       |
| 가격          | 무료                         |
| 최소 버전     | iOS 16.4+ / **watchOS 9.0+** |
| 카테고리      | 스포츠                       |
| 지원 언어     | 영어                         |

**랜딩 표기명은 `GolfCounter`를 쓴다** (`golfCounterMeta.name` 현재 값). 스토어 표기명의 `with Watch`는 검색 최적화용 접미사이고, 랜딩은 워치가 주인공이라는 걸 페이지 전체로 설명하므로 제목에 중복시킬 필요가 없다.

CTA 옆 부가 문구는 시안의 `Free · watchOS 10+` 자리에 **`Free · watchOS 9.0+`** 를 넣는다 (실제 최소 버전).

### 4.6 URL이 확정되면서 함께 처리하는 것

- **`golfCounterMeta`에 `appStoreUrl` 추가** — `ralliMeta`와 동일한 형태. CTA 버튼 2곳과 JSON-LD가 이 상수 하나를 참조한다.
- **`apps-data.ts`의 `golf-counter.links` 채우기** — 현재 빈 배열이다. `[{ label: 'App Store', url: <위 URL> }]`로 채운다. `/apps` 목록과 랜딩이 같은 URL을 두 곳에 각각 적지 않도록, `apps-data.ts`가 `golfCounterMeta.appStoreUrl`을 import해 참조한다. (`ralli`도 `links: []`로 비어 있지만 이번 작업 범위가 아니므로 건드리지 않는다.)
- **`golf-json-ld.tsx`에 `offers` 포함** — 무료 앱이므로 `SoftwareApplication` 스키마에 `offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }`와 `applicationCategory: 'SportsApplication'`, `operatingSystem: 'iOS 16.4, watchOS 9.0'`을 넣는다. `ralli-json-ld.tsx`의 기존 형태를 따르되 실제 값으로 채운다.

## 5. 이미지 자산 — 워치 해상도 상한

A안 설계 5.1에서 지적된 문제가 그대로 반복된다. 워치 스크린샷은 여전히 **422×514**이고 2x 재캡처는 이뤄지지 않았다 (`public/ralli/watch-*.png` 현재 크기로 확인).

B안은 A안보다 상황이 나쁘다. 시안 hero의 stage는 데스크톱에서 `height: 44vh → 86vh`로 커지고, 그 안의 워치 이미지는 `stage 높이 × 0.84`를 따른다. 최종 **72vh** — 1080p에서 약 778px, 2x DPR 기준 1556px가 필요한데 원본은 514px다.

**해법: stage와 이미지의 크기를 분리한다.**

시안 코드는 `hw.style.height = stage높이 * 0.84`로 이미지를 stage에 비례시킨다. 이를 **`min(stage높이 × 0.84, 44vh)`로 상한**을 건다. stage는 시안대로 화면을 꽉 채우며 확대되고(B안 hero의 핵심 연출), 이미지만 선명도를 유지하는 크기에서 멈춘다. 검은 stage 안에 워치가 놓인 구도라 이미지가 stage를 꽉 채우지 않아도 어색하지 않다 — 오히려 여백이 카드 느낌을 강화한다.

같은 상한이 필요한 곳이 하나 더 있다. Health pin의 우측 패널(`height: 74vh`)에서 `watch-workout-en`이 `max-height: 70%` ≈ 52vh로 렌더된다. 여기도 **44vh 상한**을 건다. 같은 패널의 `connectivity-en`(1284×2778)은 상한이 필요 없다.

나머지 슬롯은 여유가 있다:

| 슬롯                               | 표시 크기 | 원본      | 판정                 |
| ---------------------------------- | --------- | --------- | -------------------- |
| 베이토 tall (`ios-watch-match-en`) | 400px     | 1284×2778 | ✅                   |
| 베이토 small 워치 2장              | 150px     | 422×514   | ✅ (2x = 300px 필요) |
| After the round 2열                | 340px     | 1284×2778 | ✅                   |
| 룰 카드 (`watch-home-en`)          | 200px     | 422×514   | ✅ (2x = 400px 필요) |

시안의 `https://yjlogs.com/ralli/...` 절대 URL은 쓰지 않는다. 로컬 경로 `/golf-counter/...` + `next/image`를 유지하고, hero 워치 이미지만 `priority`를 준다.

## 6. 모션 인프라 — `apps/` 공용 승격

### 6.1 결정

A안이 만든 모션 부품을 **`apps/` 층으로 승격해 두 랜딩이 공유**한다. 검토한 대안은 셋이었다.

| 방식                                                     | 채택 여부                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **`apps/` 공용 승격**                                    | ✅ **채택**                                                                                                                    |
| golf-counter에 hook/util 복제                            | ralli 무손상이지만 hydration·reduced-motion 처리가 두 벌이 된다. A안 README가 기록한 미해결 이슈를 고칠 때 두 곳을 고쳐야 한다 |
| 랜딩 프리미티브 컴포넌트 라이브러리화 (`LandingHero` 등) | A안과 B안은 레이아웃이 근본적으로 달라 공통 분모가 얇다. YAGNI                                                                 |

랜딩이 2개가 되는 지금이 추출 적기다. `apps/_components`·`apps/_utils`가 이미 그 층에 있어 `page-folder.md` 규칙과도 맞는다.

### 6.2 이동 대상

| 현재 위치                                            | 이동 위치                           | 근거                                                                                    |
| ---------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `ralli/_hooks/useSectionProgress.ts`                 | `apps/_hooks/useSectionProgress.ts` | ralli 고유 개념이 없다. B안 hero·health pin이 그대로 사용                               |
| `ralli/_hooks/useIsMobile.ts`                        | `apps/_hooks/useIsMobile.ts`        | B안도 필요 — 시안 rAF가 `mob = innerWidth < 768`로 칩 이동 벡터와 stage 크기를 분기한다 |
| `ralli/_actions/reveal.action.tsx`                   | `apps/_actions/reveal.action.tsx`   | `[data-reveal]` 대체 래퍼. B안에도 `data-reveal`이 8곳                                  |
| `ralli-motion.ts`의 `clamp`·`mapRange`·`stepIndexAt` | `apps/_utils/landing-motion.ts`     | 순수 수학 + 시안 공통 스텝 로직                                                         |

`scoreSequence`·`RalliScore`·`scoreAt`은 테니스 점수 전용이라 `ralli/_utils/ralli-motion.ts`에 남는다. 골프에 대응 개념이 없다.

### 6.3 부수 정리: `useMounted`

`useSectionProgress`와 `Reveal`이 **똑같은 `subscribe` 함수 + `useSyncExternalStore` 3줄**을 각자 갖고 있다 (hydration mismatch 방어 패턴 — A안 설계의 "함정 2"). 둘을 같은 층으로 올리면서 `apps/_hooks/useMounted.ts`로 한 번만 정의한다.

지금 손대는 파일 안의 중복이므로 범위 확장이 아니다. `components/theme-toggle.tsx`에도 같은 패턴이 있지만 `apps/` 밖이라 건드리지 않는다.

### 6.4 파급 범위와 회귀 위험

import 경로 수정은 **ralli area 파일 6개, 9줄**이다.

```
hero.area.tsx       useSectionProgress          (scoreAt은 그대로)
watch.area.tsx      useSectionProgress, stepIndexAt
replay.area.tsx     useSectionProgress, useIsMobile, Reveal
workout.area.tsx    Reveal
rules.area.tsx      Reveal
final-cta.area.tsx  Reveal
```

ralli area 테스트 6개 중 **어느 것도 이 모듈들을 `vi.mock`하지 않는다** (`next/image`·`next/link`만 mock). 실제 구현을 그대로 쓰므로 경로가 잘못되면 즉시 실패한다. TypeScript strict와 기존 테스트 전량이 이동 검증을 대신한다.

## 7. 파일 구조

```
src/app/(main)/apps/
├── _hooks/                          ← 신설 (6.2 이동분)
│   ├── useMounted.ts
│   ├── useSectionProgress.ts
│   └── useIsMobile.ts
├── _actions/                        ← 신설 (6.2 이동분)
│   └── reveal.action.tsx
├── _utils/
│   ├── apps-data.ts                 golf-counter.links 채움 (4.6)
│   └── landing-motion.ts            ← 신설 (6.2 이동분)
└── golf-counter/
    ├── page.tsx                     Server Component. area 6개를 순서대로 나열
    ├── _areas/
    │   ├── hero.area.tsx            pin 300vh · stage 확대 + 칩 4개 비산
    │   ├── course.area.tsx          베이토 그리드
    │   ├── health.area.tsx          pin 2-step 크로스페이드
    │   ├── after-round.area.tsx     2열 갤러리
    │   ├── holes.area.tsx           룰 카드
    │   └── final-cta.area.tsx       Coming soon CTA
    ├── _components/
    │   ├── golf-shot.tsx            next/image 래퍼
    │   ├── golf-stat-chip.tsx       hero 칩
    │   └── golf-json-ld.tsx         SoftwareApplication schema
    ├── _utils/
    │   ├── golf-counter-content.ts  기존 파일 확장 (현재 3줄)
    │   └── golf-motion.ts           B안 전용 순수 함수
    └── privacy/page.tsx             (기존, 수정 없음)
```

`golf-shot.tsx`를 `ralli-shot.tsx`와 공유하지 않는다. 후자는 `ralli-shot-mask`를 하드코딩하는데, B안은 3.1에서 정한 대로 마스크가 필요 없다. 억지로 합치면 prop 분기만 늘어난다. 마찬가지로 `GolfImage` 타입도 `RalliImage`와 공유하지 않고 각 content 파일에 둔다 — 6필드짜리 타입이고, 공유하면 한쪽 랜딩의 자산 구조를 바꿀 때 다른 쪽이 끌려온다.

### 7.1 `golf-motion.ts`에 들어갈 것

시안 rAF 로직 중 **framer-motion으로 흡수되지 않는 부분만** 순수 함수로 남긴다. 이징(`eio` = easeInOutQuad)은 `useTransform`의 `ease` 옵션으로, 값 보간은 `useTransform` 자체로 대체된다.

| 함수 / 상수              | 시안 원본                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `chipRangeAt(index)`     | `t = clamp((p - 0.04 - i*0.045) / 0.46, 0, 1)` → 칩별 `[시작, 끝]` 구간                                                 |
| `CHIP_OFFSETS`           | `mob ? [[-2,-11],[2,-13],[2,13],[-2,12]] : [[-16,-6],[16,-10],[14,12],[-14,10]]`                                        |
| `stageRangeOf(isMobile)` | `width: 50→94vw / 86→96vw`, `height: 44→86vh / 32→58vh`. 시안의 `max-width:820px` 캡은 Tailwind `max-w-205`로 별도 적용 |

## 8. 모바일 레이아웃

시안 B는 A안과 달리 **자체 미디어 쿼리를 갖고 있다** (`injectMedia()`가 `@media (max-width:768px)` 블록을 주입). 이를 Tailwind `md:` 분기로 옮긴다.

| 섹션              | 데스크톱 (시안)                            | 모바일 (시안 미디어 쿼리)                       |
| ----------------- | ------------------------------------------ | ----------------------------------------------- |
| Hero 껍데기       | `300vh`                                    | `210vh`                                         |
| └ stage           | `50→94vw` × `44→86vh`                      | `86→96vw` × `32→58vh`                           |
| └ 칩 위치         | `left:9vw` 등 vw 기준                      | `left:12px` 등 px 고정, 폰트·패딩 축소          |
| └ 칩 이동 벡터    | `[[-16,-6],[16,-10],[14,12],[-14,10]]`     | `[[-2,-11],[2,-13],[2,13],[-2,12]]` — 세로 위주 |
| └ CTA             | 가로 배치                                  | 세로 스택, `bottom:5vh`                         |
| 베이토 그리드     | `1.25fr 1fr`, tall 카드 `grid-row: span 2` | 1컬럼, tall 카드 `min-height:400px`             |
| Health pin 껍데기 | `280vh`                                    | `170vh`                                         |
| └ 그리드          | `1fr 1fr`                                  | 1컬럼, 패널 높이 `74vh → 38vh`                  |
| After the round   | 2열                                        | 1컬럼                                           |
| 룰 카드           | `1fr 1fr`                                  | 1컬럼                                           |

### 8.1 JS 분기가 필요한 곳

대부분은 Tailwind `md:` 클래스로 처리된다. **JS 분기(`useIsMobile`)가 필요한 곳은 hero 하나**다 — 칩 이동 벡터와 stage 크기가 `useTransform`의 출력 범위 값이라 CSS 클래스로 바꿀 수 없다.

A안은 replay 갤러리(스크롤 축 충돌) 때문에 `useIsMobile`이 필요했다. B안에는 가로 드리프트 갤러리가 없어 그 문제는 없지만, hero 때문에 결국 같은 훅을 쓴다. 6.2에서 이 훅을 공용으로 올리는 근거이기도 하다.

### 8.2 `prefers-reduced-motion`

모바일 분기와 **독립된 축**이다. 모바일은 애니메이션을 유지하되 값만 줄이는 반면, reduced-motion은 pin 시퀀스 자체를 해제한다.

- pin 껍데기 높이를 `300vh`/`280vh` → `h-auto`로 접고 sticky를 해제한다
- 모든 모션 요소를 최종 상태로 렌더한다 (stage 확대 완료, 칩 4개 제자리 표시, health 2-step 모두 표시)
- `Reveal`은 `motion.div` 대신 평범한 `div`를 반환한다

pin 껍데기를 접지 않으면 진행도가 흐르지 않는 빈 화면을 300vh만큼 스크롤하게 된다 — A안 설계 6.1의 결론과 동일하다.

각 Area는 `useSectionProgress`가 반환하는 `isStatic` 분기 하나를 갖는다.

## 9. 테스트

| 파일                                      | 내용                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/_utils/landing-motion.test.ts`      | 이동분 — `clamp`·`mapRange`·`stepIndexAt`. **`stepIndexAt(p, 2)` 경계 케이스 추가** (2-step은 신규 사용) |
| `apps/_actions/reveal.test.tsx`           | 이동분 (수정 없음)                                                                                       |
| `ralli/_utils/ralli-motion.test.ts`       | `scoreAt` 케이스만 잔류                                                                                  |
| `golf-counter/_utils/golf-motion.test.ts` | 신규 — 칩 구간 경계·겹침, 뷰포트 분기                                                                    |
| `golf-counter/_areas/*.test.tsx`          | 신규 6개 — 렌더링·카피·이미지 `alt`·링크 (A안 area 테스트와 동일 형식)                                   |
| `e2e/golf-counter.spec.ts`                | 신규 — `e2e/ralli.spec.ts`와 같은 수준                                                                   |

`sitemap.ts`는 수정하지 않는다. `apps-data.ts`를 순회하므로 `/apps/golf-counter`가 이미 포함되어 있다.

검증 명령: `npm run lint` · `npm run test:run` · `npm run build` · `npm run test:e2e`.

## 10. 구현 단계에서 확정할 항목

- **`ios-watch-*.png` 파일명** — 실제 내용은 워치 화면이라 이름이 오해를 부른다. 자산 파일 rename은 이 작업 범위 밖이므로 `golf-counter-content.ts`의 `alt`와 변수명으로 실제 내용을 드러낸다.
- **`connectivity-en.png` · `complication-en.png`의 한국어 UI** — 파일명은 `-en`이지만 기기 안 UI가 한국어다 (`36타`, `기록`, `활동 칼로리`, `최고:30°`). 영문 랜딩에서 눈에 띈다. `complication-en`은 미사용이라 무관하고, `connectivity-en`은 Health pin 2번째 슬롯에 쓰인다. 영문 재캡처가 가능하면 교체한다.
- **워치 2x 재캡처** — 5절의 상한 처리는 폴백이다. Apple Watch Ultra 49mm 시뮬레이터에서 844×1028로 재캡처하면 상한을 풀고 시안 크기를 그대로 쓸 수 있다.

## 11. 열린 확인 사항

1. **Hero 칩의 심박·칼로리 대표값** — 스크린샷의 값이 테스트 데이터(`0 kcal`, `61 bpm`)라 쓰지 않았다. 실제 라운드 대표값이 있으면 칩 2개를 교체할 수 있다 (4.4).
2. **`connectivity-en.png`의 한국어 UI** — Health pin 2번째 슬롯에 쓰이는데 기기 안 UI가 한국어다. 영문 재캡처가 가능하면 교체한다 (10절).

## 참고

- 선행 설계: [2026-08-12-ralli-landing-a-design.md](2026-08-12-ralli-landing-a-design.md)
- A안 구현 해설: [`src/app/(main)/apps/ralli/README.md`](<../../../src/app/(main)/apps/ralli/README.md>) — MotionValue·sticky pin·`useScroll` offset 원리와 실제로 걸린 함정 4가지
- 시안 원본: [`docs/design/ralli/Ralli Landing B.dc.html`](../../design/ralli/Ralli%20Landing%20B.dc.html)
