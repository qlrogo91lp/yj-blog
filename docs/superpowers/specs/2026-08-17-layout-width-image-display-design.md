# 레이아웃 폭 · 이미지 표시 체계 — 설계 문서

- 작성일: 2026-08-17
- 브랜치: `refactor/layout-width-image-display` (구현 시작 시 생성)
- 선행 문서: [2026-08-05 Apple Newsroom 디자인 정렬](./2026-08-05-newsroom-design-alignment-design.md)
- 참고: [Apple Newsroom 기사 페이지](https://www.apple.com/newsroom/2026/08/apple-opens-advanced-manufacturing-center-in-houston/)

## 배경

2026-08-05 정렬 작업으로 `--content-width`(980px) / `--article-width`(653px) 두 토큰이 도입됐지만, 이후 추가된 페이지들이 `max-w-3xl`·`max-w-2xl`을 하드코딩하면서 폭 기준이 다시 다섯 갈래로 갈라졌다. 이번 작업으로 기준선을 둘로 되돌리고, 그 위에서 본문 이미지의 크기 단계를 다시 정의한다.

동작(라우팅·데이터·기능)은 바꾸지 않는다. 레이아웃 폭과 이미지 표시 규칙만 정렬한다.

**이미지 갤러리(가로 스크롤 다중 이미지)는 이 문서의 범위가 아니다.** 별도 스펙으로 진행하며, 이 문서에서 확정하는 본문 폭 720px · bleed 폭 980px · radius 16px을 전제로 설계한다.

## 현재 상태의 문제

### 1. 폭 기준이 다섯 갈래

| 폭                      | 페이지                                                  |
| ----------------------- | ------------------------------------------------------- |
| `--content-width` 980px | 헤더, 푸터, 홈, 글 목록, 태그·카테고리 상세             |
| `--article-width` 653px | 글 상세 본문, 댓글                                      |
| `max-w-3xl` 768px       | 시리즈 목록·상세, 태그 목록, apps 목록·상세, playground |
| `max-w-2xl` 672px       | ralli privacy                                           |
| `max-w-295` 1180px      | ralli 랜딩 (자체 디자인 스케일)                         |

### 2. 컨테이너마다 변수의 의미가 다름

| 위치                       | 클래스                                         | 변수값 | 실제 콘텐츠 폭 |
| -------------------------- | ---------------------------------------------- | ------ | -------------- |
| `content-container.tsx:10` | `max-w-[var(--content-width)] px-4`            | 980    | **948px**      |
| `posts/[slug]/page.tsx:97` | `max-w-[calc(var(--article-width)+2rem)] px-4` | 653    | **653px**      |
| `comment-section.tsx:13`   | `max-w-[var(--article-width)] px-4`            | 653    | **621px**      |

같은 변수를 쓰면서 실폭이 32px씩 어긋난다. 그 결과 댓글이 본문보다 좁게 렌더되고, 목록 실폭(948px)과 `full` 이미지 폭(980px)의 기준선도 맞지 않는다.

### 3. 이미지 기본 크기가 본문 폭과 무관

기본값 `medium`은 본문의 70%(457px)다. 본문 폭에 맞는 단계가 아예 없어서, 대부분의 이미지가 본문보다 좁게 들어간다.

또한 `medium`이라는 이름의 정의가 네 곳에 흩어져 있다 — `ImageBlock`의 `default`, `parseHTML` 폴백, `prose.css` 규칙, 툴바 라벨(`70%`).

### 4. 편집 화면과 발행 결과의 폭이 다름

관리자 에디터 본문은 `max-w-4xl px-6` = 848px, 발행 후는 653px. WYSIWYG인데 이미지 비율이 다르게 보이고, `full`(980px)은 에디터 컨테이너를 넘어간다.

## 실측 레퍼런스 — Apple Newsroom (뷰포트 1280px)

| 항목             | 실측값                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| 본문 텍스트 컬럼 | 653px, `font-size: 17px` / `line-height: 25px`                                       |
| 본문 이미지      | 980px full-bleed, **`border-radius: 0`**                                             |
| 갤러리 컨테이너  | `.gallery-images` grid 1열 980px                                                     |
| 갤러리 전환      | 이미지를 겹쳐 쌓고 활성 1장만 `visibility: visible`, 좌우 화살표(`paddlenav`)로 전환 |
| 갤러리 캡션      | 12px, 슬라이드별 개별 캡션                                                           |

> Apple 본문 이미지에는 radius가 없다. 이번에 적용하는 16px radius는 Apple 참조가 아니라 이 블로그의 선택이다.
>
> Apple 갤러리는 "가로 스크롤"이 아니라 한 장씩 넘기는 캐러셀이다. 갤러리 스펙에서 이 차이를 다시 다룬다.

## 확정된 결정 사항

- **본문 폭**: 653px → **720px** (16px 기준 한 줄 약 45자). 노션(708px)·velog·Medium 대역.
- **변수의 의미**: 변수값 = **패딩을 제외한 콘텐츠 실폭**. 모든 컨테이너가 `max-w-[calc(var(--X)+2rem)] px-4` 규칙을 따른다.
- **이미지 단계**: 3단계(`small` / `default` / `full`). 기본값은 본문 폭과 같은 `default`.
- **이미지 radius**: **16px**. 세 단계 모두 동일. 목록 카드(32px)와 위계를 구분한다.
- **에디터 폭**: 발행 폭과 동일한 720px로 맞춘다.
- **페이지 매핑 원칙**: **읽는 산문만 720px, 나머지는 전부 980px.**

## 설계

### 1. 디자인 토큰 (`src/app/globals.css`)

```css
:root {
  --content-width: 980px; /* 목록·인덱스 콘텐츠 실폭 */
  --article-width: 720px; /* 읽는 산문 콘텐츠 실폭 (653px에서 변경) */
  --radius-image: 1rem; /* 16px — 본문 이미지 (신규) */
}
```

`--radius-card`(32px)는 목록 카드용으로 그대로 둔다.

### 2. 컨테이너 컴포넌트

두 컨테이너가 같은 규칙을 공유한다. 변수에 적힌 숫자가 곧 눈에 보이는 폭이 된다.

`src/components/layout/content-container.tsx` (수정)

```tsx
<div className={cn('mx-auto w-full max-w-[calc(var(--content-width)+2rem)] px-4', className)}>
```

`src/components/layout/article-container.tsx` (신규)

```tsx
<div className={cn('mx-auto w-full max-w-[calc(var(--article-width)+2rem)] px-4', className)}>
```

- `ContentContainer` 실폭이 948px → 980px로 32px 넓어진다. `full` 이미지(980px)와 목록의 기준선이 정확히 일치하게 된다.
- 글 상세·댓글이 각자 쓰던 `max-w-*` 클래스는 `ArticleContainer`로 대체한다. 댓글이 본문보다 32px 좁던 불일치가 해소된다.

### 3. 페이지 매핑

| 컨테이너                   | 페이지                                           | 현재                                 |
| -------------------------- | ------------------------------------------------ | ------------------------------------ |
| `ArticleContainer` (720px) | 글 상세 본문 (`posts/[slug]/page.tsx:97`)        | `max-w-[calc(--article-width+2rem)]` |
|                            | 댓글 섹션 (`comment-section.tsx:13`)             | `max-w-[var(--article-width)]`       |
|                            | ralli privacy (`apps/ralli/privacy/page.tsx:14`) | `max-w-2xl`                          |
| `ContentContainer` (980px) | 시리즈 목록 (`series/page.tsx:14`)               | `max-w-3xl`                          |
|                            | 시리즈 상세 (`series/[slug]/page.tsx:42`)        | `max-w-3xl`                          |
|                            | 태그 목록 (`tags/page.tsx:15`)                   | `max-w-3xl`                          |
|                            | apps 목록 (`apps/page.tsx:13`)                   | `max-w-3xl`                          |
|                            | apps 상세 (`apps/[slug]/page.tsx:36`)            | `max-w-3xl`                          |
|                            | playground (`playground/page.tsx:11`)            | `max-w-3xl`                          |
|                            | 홈·글 목록·태그/카테고리 상세·헤더·푸터          | 이미 `ContentContainer`              |
| 변경 없음                  | ralli 랜딩 (`apps/ralli/**`)                     | 자체 디자인 스케일                   |

작업 후 `(main)` 하위에 `max-w-3xl`·`max-w-2xl` 하드코딩은 남지 않는다.

### 4. 이미지 크기 단계 (`prose.css`, `image-extension.ts`, `image-toolbar.tsx`)

| 값                     | CSS                                   | 실제 폭               | radius | 툴바 라벨  |
| ---------------------- | ------------------------------------- | --------------------- | ------ | ---------- |
| `small`                | `width: 40%`                          | 288px                 | 16px   | `40%`      |
| `default` **(기본값)** | `width: 100%`                         | 720px                 | 16px   | `기본`     |
| `full`                 | `width: var(--content-width)` + bleed | 980px (좌우 각 130px) | 16px   | `⟺` 아이콘 |

변경 지점:

- `image-extension.ts` — `ImageSize` 타입을 `'small' | 'default' | 'full'`로, `isImageSize` 가드, `size.default`, `parseHTML` 폴백, `renderHTML` 폴백을 모두 `'default'`로.
- `prose.css` — `[data-size="medium"]` 선택자를 `[data-size="default"]`로 바꾸고 `width: 70%` → `100%`. 세 단계 공통으로 `border-radius: var(--radius-image)`를 적용한다(`figure[data-size] img`와 `img[data-size]` 양쪽).
- `image-toolbar.tsx` — `sizeOptions`를 3개로. `medium` 항목 제거, `default` 라벨은 `기본`.

정렬 버튼의 활성 조건 (변경):

`default`와 `full`은 폭이 컨테이너를 가득 채우므로 `margin: auto` 정렬이 아무 효과가 없다. 정렬 버튼은 **`small`에서만 활성화**하고 `default`·`full`에서는 비활성화한다. 현재는 `full`에서만 비활성이라, `medium`(70%)이 사라지면서 "눌러도 아무 일도 안 일어나는 버튼"이 생기는 것을 막는다.

`data-align` 값 자체는 계속 저장·렌더한다. `small`에서만 의미를 갖는다.

유지되는 동작:

- `full`의 `max-width: calc(100vw - 2rem)`
- 모바일(`max-width: 640px`)에서 전 단계 `width: 100%`, bleed 해제
- `data-align`의 `margin` 규칙과 `[data-size="full"][data-align]` specificity 재정의

### 5. 에디터 폭 정합성

| 파일                                | 현재                          | 변경 후                                                     |
| ----------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `admin/posts/new/page.tsx:31`       | `max-w-4xl px-6` (실폭 848px) | `max-w-[calc(var(--article-width)+3rem)] px-6` (실폭 720px) |
| `admin/posts/[id]/edit/page.tsx:48` | 동일                          | 동일하게 변경                                               |

`px-6`(좌우 24px씩 = 3rem)에 맞춰 `+3rem`을 더한다. 제목·카테고리·태그·썸네일·SEO 영역까지 함께 720px이 되어, 편집 화면 전체가 발행 결과와 같은 기준선을 갖는다.

미리보기 다이얼로그(`_actions/_preview/preview.action.tsx:29`)도 맞춘다. 다이얼로그 크기(`min-w-4xl max-w-[80vw]`)는 그대로 두고, 내부 `.prose` 래퍼를 `ArticleContainer`로 감싸 본문 컬럼만 720px이 되게 한다.

**알려진 제약**: `full` 이미지의 `max-width: calc(100vw - 2rem)`은 관리자 사이드바 폭을 계산에 넣지 못한다. 사이드바가 열린 상태에서 창이 좁으면 에디터 안에서만 이미지가 살짝 넘칠 수 있다. 발행 화면에는 영향이 없어 이번 범위에서 대응하지 않는다.

### 6. 우측 TOC — 영향 없음 (검산)

`posts/[slug]/page.tsx:118`의 TOC 위치는 다음과 같다.

```
left = calc(100% + ((--content-width - --article-width) / 2) + 2rem)
```

절대 위치로 전개하면 `--article-width`(= a)가 소거된다.

```
left = (vw - (a+32))/2 + (a+32) + (c-a)/2 + 32
     = vw/2 + c/2 + 48
```

즉 TOC 위치는 `--content-width`에만 의존하므로 본문 폭 변경의 영향을 받지 않는다. 계산식도 그대로 둔다.

> 별개로, 정확히 `1500px` 폭에서는 TOC 우측 끝이 8px 넘친다(`vw/2 + 758 = 1508`). 변경 전후가 동일한 기존 이슈이며 이번 범위에서 다루지 않는다.

### 7. 데이터 마이그레이션

발행 HTML에 `data-size` 값이 문자열로 박혀 있으므로 기존 글을 치환한다.

```sql
UPDATE posts SET content = replace(content, 'data-size="medium"', 'data-size="default"');
```

- 대상: 전체 1건 (2026-08-17 기준 `posts` 1행, `content_format='html'`, `medium`·`full` 사용)
- `data-size`가 없는 이미지는 0건
- `medium` 호환용 CSS는 남기지 않는다. 지금 치환하면 잔여가 없다.

### 8. 테스트

| 파일                                             | 작업                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `components/layout/content-container.test.tsx`   | 클래스 문자열 기대값을 `max-w-[calc(var(--content-width)+2rem)]`로 갱신 |
| `components/layout/article-container.test.tsx`   | 신규 — 렌더링과 클래스 검증                                             |
| `admin/posts/new/_utils/image-extension.test.ts` | `medium` → `default` 기대값 갱신 (기본값 직렬화, 속성 파싱)             |
| `lib/markdown.test.ts`                           | 픽스처 HTML의 `data-size="medium"` → `default`                          |

E2E는 추가하지 않는다. 폭은 픽셀 단언이 필요한데 뷰포트·폰트에 따라 쉽게 깨져 유지 비용이 이득보다 크다.

## 범위 밖

- 이미지 갤러리(다중 이미지, 캐러셀) — 별도 스펙
- ralli 랜딩 페이지의 자체 폭 스케일
- TOC의 1500px 오버플로
- 관리자 사이드바를 고려한 `full` 이미지 폭 계산
