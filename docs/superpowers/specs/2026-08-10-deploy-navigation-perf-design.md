# 배포 환경 페이지 전환 성능 개선 — 설계 문서

> 작성일: 2026-08-10
> 선행 문서: [`2026-07-21-route-navigation-perf-design.md`](./2026-07-21-route-navigation-perf-design.md)
> 배경: 선행 작업으로 공개 라우트를 정적화했음에도 Vercel 배포 환경에서 전환이 느리게 느껴지는 문제. 프로덕션 실측으로 남은 원인을 확정하고 개선 방향을 정한다.

## 1. 배경 — 선행 작업 이후 남은 문제

선행 문서에서 이미 해결한 것은 다음과 같다.

- Clerk 인증 UI를 클라이언트 경계로 분리 → 공개 라우트 정적화 (1단계)
- 읽기 쿼리 `unstable_cache` 래핑 + `generateStaticParams` (3단계)
- `loading.tsx`는 적용 후 **되돌림** (2단계, soft 404 문제 — 3.4에서 다시 다룬다)

프로덕션(`https://yjlogs.com`) 실측으로 `/posts/[slug]`가 `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`로 응답하는 것을 확인했다. **선행 작업의 정적화는 의도대로 동작하고 있다.**

그럼에도 두 종류의 비용이 남아 있다. 하나는 캐시가 아무리 더워져도 사라지지 않는 **상시 비용**이고, 다른 하나는 트래픽이 적을 때 반복적으로 발생하는 **콜드 스타트 비용**이다.

## 2. 진단 (실측 증거)

### 2.1 상시 비용 — Clerk 미들웨어가 모든 공개 요청에 적용됨

동일 브라우저에서 동일 엣지(`icn1`)로, 둘 다 `x-vercel-cache: HIT`인 두 경로를 5회씩 측정했다.

| 요청                        |       미들웨어        |       평균 |
| --------------------------- | :-------------------: | ---------: |
| `/_next/static/chunks/*.js` | 미적용 (matcher 제외) |  **~20ms** |
| `/posts/dell-s2725qc` (RSC) |         적용          | **~105ms** |
| `/` (RSC)                   |         적용          | **~105ms** |

네트워크 RTT는 두 경로에 공통이므로, **약 85ms의 차이는 미들웨어 경로에 귀속된다.**

응답 헤더가 이를 뒷받침한다.

```
x-clerk-auth-status: signed-out
x-clerk-auth-reason: session-token-and-uat-missing
```

로그아웃 방문자가 **인증이 전혀 필요 없는 공개 글**을 볼 때도 Clerk가 매 요청 세션을 검사한다. 원인은 [`src/proxy.ts`](../../../src/proxy.ts)의 matcher가 정적 파일만 제외하고 **사이트 전체**를 대상으로 삼는 것이다.

이 비용은 **prefetch 요청에도 동일하게 붙는다.** prefetch가 느려지면 클릭 전에 완료되지 못할 확률이 올라가고, 그러면 클릭 시점에 105ms를 그대로 지불한다. "prefetch를 했는데도 느리다"는 체감의 구조적 원인이다.

> 참고: 첫 페이지 로드에서 동일 URL로 prefetch가 **7회 중복** 발생하는 것도 관측했다. 중복 자체보다 각 요청이 85ms를 지불한다는 점이 문제다.

### 2.2 콜드 스타트 — R2 원본에 `Cache-Control`이 없음

```
R2 원본 응답 헤더:      content-type, etag 만 존재 → Cache-Control 없음
Next Image 최적화 응답: cache-control: public, max-age=14400, must-revalidate
```

[`upload-image.ts`](../../../src/app/admin/posts/new/_services/upload-image.ts)의 `PutObjectCommand`가 `ContentType`만 설정하고 `CacheControl`을 넣지 않는다. 업스트림에 캐시 지시가 없으므로 Next.js가 `images.minimumCacheTTL` 기본값(Next 16 기준 **14400초 = 4시간**)으로 폴백한다.

측정된 영향은 다음과 같다.

| 상태                                        | 응답 시간 |
| ------------------------------------------- | --------: |
| 이미지 최적화 콜드 (`x-vercel-cache: MISS`) | **607ms** |
| 이미지 최적화 웜 (`HIT`)                    |   10~22ms |

**4시간마다 모든 이미지 변형이 만료된다.** 하루 방문자가 적은 블로그에서는 사실상 방문자 대부분이 콜드를 맞는다. 반면 운영자 본인은 직전 요청으로 캐시를 데워놓은 상태에서 재접속하므로 거의 항상 웜만 체험한다 — 문제가 본인에게만 잘 보이지 않는 구조다.

`Cache-Control` 부재는 두 경로를 모두 때린다.

| 경로         | 대상        | 결과                                               |
| ------------ | ----------- | -------------------------------------------------- |
| `next/image` | 썸네일      | 4시간마다 재최적화 (607ms)                         |
| raw `<img>`  | 본문 이미지 | **브라우저 캐시가 걸리지 않아 매 방문 재다운로드** |

본문 이미지는 마크다운이 HTML로 변환되어 `dangerouslySetInnerHTML`로 렌더되므로 `next/image`를 거치지 않고 R2에서 직접 로드된다. 실측에서 `assets.yjlogs.com/images/post-1/image1.jpg` 형태의 직접 URL이 확인되었다.

### 2.3 기능 버그 — CSP가 Google Analytics를 차단

배포된 모든 페이지의 콘솔에 다음 에러가 반복된다.

```
Loading the script 'https://www.googletagmanager.com/gtag/js?id=G-3NQLCVZJG1'
violates the following Content Security Policy directive: "script-src 'self' ..."
```

[`next.config.ts`](../../../next.config.ts)의 `script-src`에 `googletagmanager.com`이 없다. **GA는 배포 이후 한 번도 동작한 적이 없다.** 성능 항목이 아니라 기능 버그이며, 자체 `/api/track` 집계와 별개로 GA 데이터가 통째로 비어 있음을 뜻한다.

### 2.4 측정 방법에 관한 주의

> **⚠️ 백그라운드 탭에서 `setTimeout` 폴링으로 전환 시간을 재지 말 것.**
>
> 브라우저는 `visibilityState === 'hidden'`인 탭에서 `setTimeout`을 **최소 1000ms로 클램프**한다. 이 상태에서 폴링으로 측정하면 실제 값과 무관하게 정확히 1000ms가 나온다. 본 조사에서도 초기에 "전환 1000ms"라는 가짜 수치를 얻었고, 스로틀링을 받지 않는 `MutationObserver`로 재측정하니 실제 값은 **169ms**였다.
>
> 또한 hidden 탭은 렌더링 파이프라인이 돌지 않아 **IntersectionObserver가 동작하지 않는다.** `<Link>` prefetch는 IntersectionObserver 기반이므로 hidden 탭에서는 아예 발생하지 않는다(7초 관찰, 0건). **prefetch 재사용 여부는 이 환경에서 검증 불가**이며, 실제 브라우저에서 확인해야 한다.

선행 문서의 경고도 함께 유효하다 — **dev 서버로 검증하지 말 것.** dev 모드는 정적 프리렌더를 수행하지 않는다.

### 2.5 확신이 낮은 항목

홈 RSC 요청에서 `x-vercel-cache: PRERENDER`, `age: 0`, **554ms**를 1회 관측했다. ISR 재생성 비용으로 보이지만 발생 조건을 특정하지 못했다. 이번 범위에서 조치하지 않고, 3.1~3.4 적용 후 재관측한다.

## 3. 설계

### 3.1 미들웨어 범위 축소 — `src/proxy.ts`

matcher를 `/admin/:path*`와 `/api/:path*`로 좁힌다.

근거는 다음 세 가지이며, 모두 코드로 확인했다.

- 공개 라우트에서 `auth()`를 호출하는 코드가 **하나도 없다** (grep 전수 확인)
- 공개 Server Action 2개(`addComment`, `removeComment`)는 **bcrypt 비밀번호 방식**이라 Clerk와 무관하다. Server Action은 현재 페이지 URL로 POST되므로, 공개 페이지에서 호출되어도 미들웨어를 필요로 하지 않는다
- 관리자 Server Action은 모두 `/admin/*` 페이지에서 호출되므로 POST 대상 URL이 `/admin/*`이고, 축소된 matcher에 포함된다

`/api`를 유지하는 이유는 [`api/track/route.ts`](../../../src/app/api/track/route.ts)가 관리자 본인의 방문을 집계에서 제외하기 위해 `auth()`를 사용하기 때문이다.

이 변경은 선행 문서 1단계의 연장선이다. [`header-auth.tsx`](../../../src/components/nav/header-auth.tsx)에 *"공개 라우트의 정적 렌더링을 유지하려고 클라이언트 경계로 뺐다"*고 명시되어 있으며, 미들웨어 축소는 같은 의도를 요청 경로에도 적용하는 것이다.

**기대 효과**: 공개 페이지 RSC 요청 105ms → 약 20ms. prefetch 요청도 동일하게 개선된다.

### 3.2 이미지 캐시 정책

두 조치를 함께 적용한다. 하나는 신규 업로드용, 다른 하나는 기존 자산 구제용이다.

**(a) 업로드 시점 — `upload-image.ts`**

`PutObjectCommand`에 `CacheControl: 'public, max-age=31536000, immutable'`을 추가한다. 업로드 경로가 `images/{타임스탬프}-{파일명}`이라 같은 경로에 다른 내용이 덮일 수 없으므로 `immutable`이 안전하다.

이 조치는 본문 이미지(raw `<img>`)의 브라우저 캐시까지 함께 해결한다.

**(b) 기존 객체 구제 — `next.config.ts`**

(a)는 신규 업로드만 커버하므로, 이미 올라간 이미지를 위해 `images.minimumCacheTTL`을 **`31536000`(1년)** 으로 설정한다. 업스트림에 지시가 없어도 Next.js가 최적화 결과를 이 기간 동안 보관한다. (a)의 R2 `max-age`와 같은 값으로 맞춰 두 경로의 캐시 수명을 일치시킨다.

1년이 안전한 이유는 모든 이미지가 `images/{타임스탬프}-{파일명}` 경로로 올라가 **같은 URL에 다른 내용이 덮일 수 없기** 때문이다. 이미지를 교체하려면 새 URL이 생성되므로 stale 위험이 없다.

아울러 `images.deviceSizes`를 축소해 생성되는 변형 수를 줄인다. 콘텐츠 폭이 980px이므로 2x DPI를 감안해도 1920px을 넘는 변형은 사용되지 않는다. 기본값 8종에서 4종(`640, 828, 1080, 1920`)으로 줄이면 콜드 미스 표면이 절반으로 감소한다.

`imageSizes`는 변경하지 않는다. 축소 이득이 불확실한 반면 예상치 못한 레이아웃에서 화질 저하를 부를 수 있다.

### 3.3 CSP 수정 — `next.config.ts`

- `script-src`에 `https://www.googletagmanager.com` 추가
- `connect-src`에 `https://*.google-analytics.com`, `https://*.analytics.google.com` 추가

`img-src`는 이미 `https:`를 허용하므로 변경이 불필요하다.

### 3.4 네비게이션 프로그레스 바

**`loading.tsx`는 도입하지 않는다.** 선행 문서 3.2의 결론을 그대로 따른다 — `loading.tsx`는 Suspense 경계를 만들어 응답을 스트리밍하고, HTTP 상태가 헤더 플러시 시점에 200으로 확정된 뒤 `notFound()`가 실행되어 **soft 404**를 발생시킨다. 이는 GSC 인덱스 커버리지 과제와 충돌한다.

프로그레스 바는 **순수 클라이언트 UI라 Suspense 경계를 만들지 않는다.** 따라서 정확한 404 상태를 유지하면서 선행 문서 2단계가 원했던 로딩 피드백을 제공한다. `loading.tsx`가 해결하지 못한 요구를 부작용 없이 충족하는 유일한 경로다.

#### 라이브러리 선정

Next 전용 프로그레스바 래퍼는 조사한 4종이 모두 유지보수가 정체되어 있다.

| 패키지                   | 주간 DL | 마지막 릴리스  | 판정                                                             |
| ------------------------ | ------: | -------------- | ---------------------------------------------------------------- |
| `nextjs-toploader`       |    682k | 2025-09-09     | _"Not Compatible with React19/Nextjs15"_ 이슈 2024-11부터 미해결 |
| `@bprogress/next`        |    265k | 2025-04-14     | 16개월 정지, Next 16 이전                                        |
| `holy-loader`            |    9.5k | 2025-11-13     | 채택률 낮음                                                      |
| `@tanem/react-nprogress` |    272k | **2026-08-08** | **활발, peer에 React 19 명시**                                   |

패턴이 분명하다. **Next 라우터 내부에 훅을 거는 패키지만 썩고, 프레임워크 무관 패키지는 건강하다.** Next이 버전을 올릴 때마다 깨지는 지점이 바로 그 훅이기 때문이다.

따라서 **썩는 부분을 우리가 소유한다.** 애니메이션은 활발히 관리되는 `@tanem/react-nprogress`에 맡기고, Next 의존적인 네비게이션 감지만 직접 구현한다. 인터페이스가 불리언 하나(`isAnimating`)로 끝나 경계가 깔끔하다.

```
@tanem/react-nprogress  →  useNProgress({ isAnimating })  →  progress, animationDuration
자체 코드               →  isAnimating 불리언 생성 + 바 렌더
```

#### 컴포넌트 설계

**신규 파일**: `src/components/navigation-progress.tsx` (`'use client'`)

`src/components/` 직하의 공통 클라이언트 컴포넌트이므로 `page-tracker.tsx`·`nav-links.tsx`와 동일하게 접미사 없는 kebab-case를 쓴다(`_actions/*.action.tsx`는 라우트 폴더 전용 규칙이라 해당 없음). 함수명은 `NavigationProgress`.

루트 레이아웃([`src/app/layout.tsx`](../../../src/app/layout.tsx))의 `<PageTracker />` 옆에 한 번만 배치한다. 라우트마다 넣지 않는다.

**동작 명세**

| 항목      | 명세                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| 시작      | 내부 링크 클릭을 캡처 단계에서 감지                                                                           |
| 종료      | `usePathname()` 변경 감지                                                                                     |
| 지연 노출 | **150ms** 경과 후에만 표시. 3.1 적용 후 웜 전환이 ~85ms이므로 지연이 없으면 대부분의 이동에서 깜빡이고 끝난다 |
| 위치      | 화면 최상단 고정, 헤더(`z-50`)보다 위                                                                         |
| 접근성    | `aria-hidden`(진행률을 읽어줄 필요 없는 장식적 표시). `prefers-reduced-motion`에서 애니메이션 축소            |

**감지에서 제외해야 할 케이스** — 이 목록이 자체 구현의 핵심이며 검증 대상이다.

- 뒤로/앞으로 가기 (popstate)
- `cmd`/`ctrl`/`shift`/`middle` 클릭 (새 탭·새 창)
- 외부 링크 (`origin` 불일치)
- `#해시` 링크 (같은 문서 내 이동)
- `target="_blank"`
- 현재 경로와 동일한 링크 재클릭
- `download` 속성이 있는 링크

**폴백 없음**: 라이브러리 리스크를 이미 제거했으므로 별도 폴백 경로를 두지 않는다.

## 4. 검증

> dev 서버가 아니라 **배포된 프로덕션**에서 확인한다. 3.1·3.2는 Vercel 인프라 동작이 걸려 있어 로컬 `next start`로는 재현되지 않는다.

### 4.1 성능 (Before / After 실측)

| 항목               | 측정 방법                                                | 성공 기준                                            |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------- |
| 미들웨어 제거      | 공개 페이지 RSC 응답 헤더                                | `x-clerk-auth-status` **소멸**                       |
| 미들웨어 제거      | `curl -o /dev/null -w "%{time_total}" <url> -H "RSC: 1"` | 105ms → **20ms대**                                   |
| 관리자 경로 유지   | `/admin` 응답 헤더                                       | `x-clerk-auth-status` **존재**                       |
| 이미지 캐시 (신규) | 신규 업로드 후 R2 응답 헤더                              | `cache-control: public, max-age=31536000, immutable` |
| 이미지 캐시 (기존) | `/_next/image?...` 응답 헤더                             | `max-age=31536000` (기존 14400에서 변경)             |
| 이미지 변형 축소   | 배포 후 `srcset` 확인                                    | `640/828/1080/1920` 4종만 존재                       |
| CSP                | 배포 페이지 콘솔                                         | GTM 차단 에러 **없음**                               |
| GA                 | GA 실시간 리포트                                         | 유입 **집계됨**                                      |

### 4.2 회귀 (수동)

미들웨어 축소가 인증 흐름을 깨지 않는지 반드시 확인한다.

- 로그인(모달) → 헤더에 대시보드 버튼 노출 → `/admin` 진입 → 글 저장 → 로그아웃
- 비로그인 상태로 댓글 작성 → 비밀번호로 댓글 삭제
- 이미지 업로드 (관리자)

### 4.3 프로그레스 바

3.4의 "감지에서 제외해야 할 케이스" 전 항목을 수동으로 확인한다. 바가 **등장하지 않아야** 하는 케이스에서 등장하지 않고, 콜드 전환에서 등장 후 **반드시 사라지는지** 본다. 바가 사라지지 않고 계속 도는 것이 가장 흔한 실패 모드다.

`NavigationProgress`의 지연 노출·제외 조건은 Vitest로 단위 테스트한다(`navigation-progress.test.tsx`). `usePathname`은 `vi.mock`으로 교체한다.

### 4.4 기존 테스트

`npm run test:run`, `npm run test:e2e`, `npm run lint` 전량 통과.

## 5. 리스크와 롤백

**가장 큰 리스크**는 미들웨어 축소로 Clerk 세션 핸드셰이크가 깨지는 것이다.

완화 근거는 `/admin` 진입 시점에 미들웨어가 살아 있어 핸드셰이크가 필요한 바로 그때 수행된다는 점이다. 그럼에도 4.2의 인증 회귀 시나리오를 배포 후 반드시 수동 확인한다. 롤백은 matcher 한 줄 복구로 즉시 가능하다.

**부차 리스크**로 `deviceSizes` 축소는 특정 뷰포트에서 실제 필요보다 큰 이미지를 받게 만들 수 있다. 화질 손실은 없고 전송량만 소폭 증가하며, 캐시 히트율 상승이 이를 상쇄한다.

## 6. 범위 밖

- **본문 이미지의 레이아웃 시프트** — 본문 `<img>`에 width/height가 없어 로드 중 시프트가 발생한다. 실재하는 문제지만 업로드 시 이미지 크기를 저장하는 스키마 변경이 필요해 별도 과제로 둔다.
- **홈 ISR 재생성 비용** — 2.5 참조. 발생 조건 미특정. 본 작업 적용 후 재관측하여 필요 시 별도 과제화한다.
- **prefetch 중복 발생(동일 URL 7회)** — 3.1로 건당 비용이 1/5로 줄어 실익이 작아진다. Next 16 내부 동작이라 통제 수단도 제한적이다.
- **번들 크기, 폰트 로딩 전략** — 선행 문서와 동일하게 범위 밖.

## 변경 이력

- 2026-08-10: 초안 작성. 프로덕션 실측으로 상시 비용(Clerk 미들웨어 85ms)과 콜드 비용(R2 `Cache-Control` 부재) 확정. `loading.tsx` 대신 프로그레스 바 채택.
