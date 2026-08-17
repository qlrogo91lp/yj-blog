# 본문 이미지 갤러리 — 설계 문서

- 작성일: 2026-08-17
- 브랜치: `feature/post-gallery` (구현 시작 시 생성)
- 선행 문서: [2026-08-17 레이아웃 폭 · 이미지 표시 체계](./2026-08-17-layout-width-image-display-design.md)
- 참고: [Apple Newsroom 기사 페이지](https://www.apple.com/newsroom/2026/08/apple-opens-advanced-manufacturing-center-in-houston/)

## 배경

글 본문에 이미지를 여러 장 이어서 보여주려면 지금은 단일 이미지를 세로로 나열하는 수밖에 없다. 사진 5~6장이 한 맥락으로 묶이는 글(여행기, 제품 리뷰)에서는 스크롤만 길어지고 묶음이라는 사실도 드러나지 않는다.

가로로 넘겨 보는 갤러리를 추가한다. 폭·radius 체계는 선행 스펙에서 확정한 값(본문 720px, bleed 980px, radius 16px)을 그대로 쓴다.

## 현재 상태의 문제

### 1. 갤러리 개념이 없다

Tiptap 확장은 단일 `image` 노드뿐이다. 여러 장을 묶는 구조가 없어 사진 묶음이 그냥 이미지 N개로 저장된다.

### 2. 드롭·붙여넣기가 파일 1개만 처리한다

`wysiwyg-editor.action.tsx`의 `handleDrop`·`handlePaste`가 `files[0]`만 읽는다. 사진 5장을 한 번에 끌어다 놓으면 첫 장만 들어가고 나머지는 조용히 버려진다.

### 3. 삭제된 이미지가 R2에 영원히 남는다

`wysiwyg-editor.action.tsx:39`가 본문에서 사라진 이미지를 찾아 R2에서 지우려고 노드를 스캔한다.

```ts
if (node.type.name === 'imageBlock' && node.attrs.src) {
```

그런데 `ImageBlock = Image.extend({...})`는 `name`을 재정의하지 않으므로 실제 노드 이름은 `image`다. 실증 확인 결과 등록된 노드는 `['image']`, 문서 내 노드도 `['paragraph', 'image']`로, 이 조건은 **한 번도 참이 된 적이 없다**. 따라서 `prevImageSrcs`는 항상 비어 있고 `removeImage()`는 호출되지 않는다.

갤러리는 이미지를 여러 장 다루므로 같은 정리 로직이 필요하다. 버그를 남겨두면 갤러리에서도 그대로 복제되므로 이번 범위에 포함한다.

## 실측 레퍼런스 — Apple Newsroom (뷰포트 1280px)

| 항목 | 실측값 |
|------|--------|
| 갤러리 컨테이너 | `.gallery-images` grid 1열 980px (본문 텍스트 653px 대비 bleed) |
| 전환 방식 | 이미지를 겹쳐 쌓고 활성 1장만 `visibility: visible` — 가로 스크롤이 아니라 화살표 캐러셀 |
| 조작 | 좌우 화살표 버튼(`paddlenav-arrow-previous`/`-next`), 도트 인디케이터 없음 |
| 캡션 | `.gallery-caption` 12px, 슬라이드별 개별 캡션 |
| 이미지 수 | 6장 |

> Apple은 "가로 스크롤"이 아니라 한 장씩 교체하는 캐러셀이다. 이 스펙은 **의도적으로 다른 방식**(네이티브 가로 스크롤)을 택했다 — 아래 결정 사항 참조. 폭(980px)·슬라이드별 캡션은 Apple을 따른다.

## 확정된 결정 사항

- **넘기는 방식**: CSS `scroll-snap` 기반 **네이티브 가로 스크롤**. 다음 장이 살짝 걸쳐 보이고(엿보기), 데스크톱에는 `scrollBy()`를 호출하는 화살표 버튼을 덧붙인다.
  - 관성·감속이 OS 그대로 적용되고, 모바일 스와이프·키보드·스크린리더를 브라우저가 처리하며, JS 없이도 스크롤이 동작한다.
- **폭**: 사이즈 선택 없이 **항상 980px full-bleed**. 갤러리에는 `data-size` 개념을 두지 않는다.
- **슬라이드 비율**: **높이 고정, 폭은 원본 비율대로.** 잘라내지 않으며 세로 사진은 폭이 좁아진다.
- **캡션**: **슬라이드별 개별 캡션.** 비워두면 렌더하지 않는다.
- **생성 방법**: 이미지 2장 이상 드롭·붙여넣기 시 자동 생성 + 툴바 `[갤러리]` 버튼(다중 파일 선택). 1장이면 기존 단일 이미지 동작을 유지한다.
- **이미지 크기 정보**: DB 스키마를 바꾸지 않는다. 각 `<img>`의 `width`/`height` 속성에 원본 픽셀 크기를 기록하고, 브라우저가 이것으로 종횡비를 계산하게 한다.
- **단일 이미지 세로 길이 상한**: 갤러리와 별개로, 본문 단일 이미지에 `max-height`를 걸어 세로 사진이 화면을 넘기지 않게 한다(§8).

## 설계

### 1. 노드 구조 — 원자 노드 + 이미지 배열

`src/app/admin/posts/new/_utils/gallery-extension.ts` (신규)

```ts
export type GalleryImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};
```

Tiptap 노드 정의:

| 항목 | 값 |
|------|-----|
| `name` | `gallery` |
| `group` | `block` |
| `atom` | `true` — 내부를 ProseMirror 콘텐츠가 아닌 React NodeView가 소유 |
| `draggable` | `true` |
| 속성 | `images: GalleryImage[]` (기본값 `[]`) |

검토한 대안:

- **중첩 노드**(`gallery` > `galleryItem+`): ProseMirror 관용적이고 캡션 인라인 편집이 가능하지만 스키마·커맨드·NodeView가 배로 늘어난다.
- **기존 `image` 노드 재사용**(`gallery` > `image+`): `data-size`·`data-align`이 갤러리 안에서 의미를 잃어 충돌한다.

원자 노드 + 배열 속성을 택한다. 기존 `ImageNodeView`가 `updateAttributes({ caption })`로 캡션을 다루는 방식과 같은 결이며, 편집 UI 전체를 React 컴포넌트 하나가 소유해 추론하기 쉽다.

### 2. 저장되는 HTML

```html
<div data-gallery>
  <figure>
    <img src="https://…/image1.jpg" alt="거실 창가" width="1600" height="1067">
    <figcaption>거실 창가에서</figcaption>
  </figure>
  <figure>
    <img src="https://…/image2.jpg" alt="" width="1067" height="1600">
  </figure>
</div>
```

- `renderHTML`은 `images` 배열을 위 DOM 트리로 펼친다. `caption`이 빈 문자열이면 `<figcaption>`을 생성하지 않는다.
- `parseHTML`은 `div[data-gallery]`를 매칭하고 `getAttrs`에서 자식 `figure`를 순회해 배열을 복원한다. `width`/`height`가 없거나 숫자가 아니면 `0`으로 두고, 이때 CSS는 종횡비를 모른 채 렌더한다(들썩거림은 생기지만 깨지지는 않는다).
- 버튼·인디케이터 같은 UI 요소는 저장하지 않는다. 본문에는 콘텐츠만 남고 조작 UI는 렌더 시점에 덧붙는다.

### 3. 공개 페이지 CSS (`src/styles/prose.css`)

```css
.prose [data-gallery] {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-left: 0;
  width: var(--content-width);
  max-width: calc(100vw - 2rem);
  margin-left: 50%;
  transform: translateX(-50%);
}
.prose [data-gallery] figure {
  flex: none;
  scroll-snap-align: start;
  margin: 0;
}
.prose [data-gallery] img {
  height: var(--gallery-height);
  width: auto;
  max-width: none;
  border-radius: var(--radius-image);
}
```

- bleed 계산식(`width` / `max-width` / `margin-left` / `transform`)은 단일 이미지 `data-size="full"`과 **동일한 값**을 쓴다. 두 요소의 좌우 끝이 같은 선에서 끝난다.
- **`max-width: none`이 반드시 필요하다.** Tailwind preflight의 `img { max-width: 100% }`가 그대로 걸리면, 가로로 긴 사진이 flex 컨테이너 폭에 맞춰 찌그러져 높이 고정이 무너진다.
- `--gallery-height` 신규 토큰: `globals.css`의 `:root`에 `460px`. `@media (max-width: 640px)`에서 `260px`로 낮추고, 같은 미디어쿼리에서 단일 이미지와 동일하게 bleed를 해제한다(`max-width: 100%`, `margin-left: 0`, `transform: none`).

> **모바일 높이는 실기기 확인 후 확정한다.** 375px 뷰포트(컨테이너 약 343px) 기준으로 `260px`일 때 3:2 가로는 390px(컨테이너의 88%가 보임), 2:3 세로는 173px(두 장이 나란히)이 된다. 세로 사진이 다소 작으므로 구현 중 `280~320px`도 함께 보고 정한다. 데스크톱 `460px`는 그대로 간다 — 가로 690px/세로 307px로 둘 다 무리 없다.
- `figcaption`은 기존 `.prose figcaption` 스타일(0.8125rem, muted, 가운데 정렬)을 그대로 상속한다. 갤러리 `figure`에는 `data-size`가 없으므로 선행 스펙의 `.prose figure[data-size] img` 규칙(폭 100%)에 걸리지 않는다.
- 스크롤바는 브라우저 기본을 쓴다. 감추지 않는다 — 스크롤 가능하다는 유일한 시각 신호다.

> **스냅 주의**: 폭이 제각각인 항목에 `mandatory`를 걸면, 마지막 항목이 남은 공간보다 좁을 때 끝까지 스크롤되지 않고 되튕기는 브라우저가 있다. 구현 중 이 증상이 나오면 `proximity`로 완화한다. 어느 쪽이든 스크롤 자체는 동작하므로 차단 사유는 아니다.

### 4. 화살표 버튼 — 점진적 향상

`src/app/(main)/posts/[slug]/_handlers/gallery-nav.handler.tsx` (신규, `_handlers` 폴더도 신규)

본문은 `dangerouslySetInnerHTML`로 주입되는 HTML이라 React가 그 안에 컴포넌트를 심을 수 없다. 마운트 후 DOM을 찾아 버튼을 붙이는 방식으로 처리한다.

- props로 본문 컨테이너 `ref`를 받아 `[data-gallery]`를 모두 찾는다.
- 각 갤러리를 `data-gallery-wrap` 래퍼로 감싸고 좌·우 버튼을 생성해 붙인다.
- 클릭 시 `scrollBy({ left: ±컨테이너폭 * 0.8, behavior: 'smooth' })`.
- `scroll` 이벤트와 `ResizeObserver`로 양 끝 도달 여부를 판정해 해당 버튼을 `hidden` 처리한다. 콘텐츠가 컨테이너에 다 들어가면 양쪽 모두 숨긴다.
- 언마운트 시 생성한 노드와 리스너를 정리한다.

**bleed 소유권 이전** — 래퍼로 감싸면 버튼의 기준이 문제가 된다. 갤러리 자신이 bleed를 갖고 있으면 래퍼는 본문 폭(720px)에 머물러, 래퍼 기준으로 배치한 버튼이 갤러리(980px) 가장자리와 어긋난다. 갤러리 안쪽에 버튼을 넣는 것도 불가능하다 — `overflow-x: auto`라 버튼이 콘텐츠와 함께 스크롤된다.

그래서 래퍼가 있을 때는 bleed를 래퍼가 가져간다.

```css
.prose [data-gallery-wrap] {
  position: relative;
  width: var(--content-width);
  max-width: calc(100vw - 2rem);
  margin-left: 50%;
  transform: translateX(-50%);
}
.prose [data-gallery-wrap] [data-gallery] {
  width: 100%;
  max-width: none;
  margin-left: 0;
  transform: none;
}
```

JS가 없으면 갤러리가 스스로 bleed하고, JS가 붙으면 래퍼가 대신한다. 어느 쪽이든 폭은 980px로 같다.

렌더 결과물이 없고 사이드이펙트만 담당하므로 `_handlers` 규칙에 맞는다.

> **이 버튼이 필요한 이유**: 휠만 있는 마우스 사용자는 가로 스크롤 수단이 사실상 없다(shift+휠은 발견하기 어렵다). 트랙패드·터치 사용자에게는 없어도 되지만, 있어도 방해되지 않는다.

### 5. 확대 보기와의 충돌 처리

`post-content.action.tsx`는 `.prose` 안 모든 `IMG` 클릭을 확대 다이얼로그로 처리한다. 갤러리 이미지도 확대 대상으로 유지하되, 드래그로 스크롤한 뒤 손을 떼는 동작이 확대로 오인되지 않게 한다.

- `pointerdown`에서 좌표를 기록하고, `click` 시점에 이동 거리가 5px를 넘었으면 확대를 건너뛴다.
- 기존 `(pointer: coarse)` 환경 확대 제외 규칙은 그대로 둔다.

### 6. 에디터

**파일 구성**

| 파일 | 역할 |
|------|------|
| `_utils/gallery-extension.ts` (신규) | 노드 정의, `GalleryImage` 타입, parse/render |
| `_utils/read-image-size.ts` (신규) | `File`을 읽어 `{ width, height }` 반환 (`createImageBitmap` 또는 `Image` 로드) |
| `_components/_gallery/gallery-node-view.tsx` (신규) | 갤러리 NodeView. 공개 페이지와 같은 스크롤 스트립으로 렌더 |
| `_components/_gallery/gallery-slide-toolbar.tsx` (신규) | 슬라이드별 오버레이 조작 바 |
| `_actions/wysiwyg-editor.action.tsx` (수정) | 다중 파일 드롭·붙여넣기, 갤러리 삽입, 정리 로직 수정 |
| `_actions/editor-toolbar.action.tsx` (수정) | `[갤러리]` 버튼 추가 |

**업로드 흐름** — 기존 단일 이미지 패턴을 그대로 확장한다.

1. 파일 목록에서 이미지가 아닌 것과 10MB 초과분을 걸러낸다. 걸러진 게 있으면 `toast.error`로 알린다.
2. 남은 파일이 1장이면 기존 `uploadAndInsert`로 단일 이미지 처리, 2장 이상이면 갤러리로 진행한다.
3. `imageUploading` placeholder 노드를 하나 삽입한다. 이 노드는 현재 `{ id, previewUrl }`만 받으므로 **첫 번째 파일의 `previewUrl`을 넘기고**, 총 장수를 표시할 `total` 속성을 추가한다(기본값 `1`이면 기존 단일 이미지 동작과 호환).
4. 각 파일을 `read-image-size`로 측정하고 `uploadImage(formData, postId, 'content')`를 **순차 호출**한다. R2·DB 인덱스 계산이 직렬이라 병렬 호출 시 인덱스가 충돌할 수 있다.
5. 전부 끝나면 `replaceUploadingNode`로 `gallery` 노드를 넣는다. 일부만 성공했으면 성공분으로 갤러리를 만들고 실패 건수를 토스트로 알린다. 전부 실패하면 placeholder를 제거한다.

**슬라이드 편집** — 노드 선택 시 각 슬라이드 위에 오버레이 바를 띄운다. 기존 `ImageToolbar`의 디자인 언어(작은 아이콘 버튼 + 팝오버)를 따른다.

| 컨트롤 | 동작 |
|--------|------|
| `←` `→` | 배열에서 해당 항목의 위치를 앞뒤로 이동. 양 끝에서는 비활성 |
| 톱니 | 팝오버에서 캡션·대체 텍스트(alt) 입력 |
| 휴지통 | 배열에서 제거. 마지막 1장을 지우면 갤러리 노드 자체를 삭제 |

모든 편집은 `updateAttributes({ images: 새배열 })` 한 경로로 수렴한다.

### 7. 이미지 정리 버그 수정

`wysiwyg-editor.action.tsx`의 `getImageSrcs`를 고친다.

- `node.type.name === 'imageBlock'` → `'image'` (오타 수정)
- 동시에 `gallery` 노드의 `images` 배열에 있는 `src`도 수집

이로써 단일 이미지·갤러리 어느 쪽에서 지워도 R2와 `post_images`에서 정리된다.

> 이번 수정으로 정리 로직이 **처음으로 실제 동작**하게 된다. 기존 글에 이미 쌓여 있는 고아 파일은 이 변경으로 소급 정리되지 않는다 — 별도 작업이다.

### 8. 단일 이미지 세로 길이 상한 (부수 수정)

갤러리와는 별개지만 같은 "이미지 표시 규칙" 영역이라 함께 다룬다.

현재 `prose.css`에는 세로 길이 제약이 전혀 없다. 단일 이미지는 폭만 고정하므로(`data-size="default"` → `width: 100%`), 2:3 세로 사진이 720 × **1080px**이 되어 노트북 화면 높이(800px 안팎)를 넘긴다. 한 화면에 안 들어가는 이미지가 본문 흐름을 끊는다.

```css
.prose img[data-size="default"],
.prose img[data-size="small"] {
  max-height: 80vh;
  width: auto;
}
```

- 세로 사진은 화면 높이의 80%에서 멈추고 폭이 비율대로 줄어든다. 가로 사진은 `max-height`에 닿지 않으므로 영향이 없다.
- `width: auto`가 함께 필요하다. `width: 100%`가 남아 있으면 `max-height`가 걸려도 폭이 720px로 고정돼 이미지가 찌그러진다.
- `data-size="full"`(980px bleed)은 제외한다. full은 "크게 보여주려는" 의도적 선택이므로 높이를 제한하지 않는다.
- 캡션이 있는 경우 `figure` 안의 `img`에도 같은 규칙이 필요하다 — 선행 스펙의 `.prose figure[data-size] img { width: 100% }`가 폭을 다시 100%로 되돌리므로, 이 선택자에도 `max-height`·`width: auto`를 맞춰 넣는다.

## 범위 밖

- **마크다운 모드**: 갤러리는 HTML 전용이다. 마크다운 모드에서는 툴바의 갤러리 버튼을 노출하지 않는다.
- 드래그 앤 드롭 순서 변경 — `←` `→` 버튼으로 충분하다.
- 갤러리 내 개별 이미지 크기 조절 — 높이 고정이 전제다.
- 도트 인디케이터 — 스크롤바가 위치를 알려준다.
- 기존에 쌓인 고아 이미지 소급 정리.
- 모바일에서 화면 가장자리까지 넓히는 edge-to-edge 갤러리.

## 테스트

| 파일 | 내용 |
|------|------|
| `_utils/gallery-extension.test.ts` (신규) | parseHTML ↔ renderHTML 왕복, 빈 캡션 시 `figcaption` 생략, `width`/`height` 누락 시 `0` 폴백 |
| `_components/_gallery/gallery-node-view.test.tsx` (신규) | 캡션 입력·삭제·순서 이동이 올바른 배열로 `updateAttributes`를 호출, 마지막 1장 삭제 시 노드 삭제 |
| `src/lib/markdown.test.ts` (수정) | 갤러리 HTML이 `rehypeImageCaption`을 통과해도 변형되지 않음(`div[data-gallery]` 안의 `figure`는 `<p><img></p>` 패턴이 아니므로 대상이 아니다) |
| `_actions/wysiwyg-editor` 정리 로직 | `image`와 `gallery` 양쪽 src를 모두 수집하는지 — §7 회귀 방지 |

`read-image-size.ts`에는 단위 테스트를 두지 않는다. 이미지 디코딩은 jsdom에서 동작하지 않아 테스트가 목(mock)만 검증하게 되고, 프로젝트 테스트 규칙("실제 브라우저가 필요한가")상 Vitest 대상이 아니다. 측정 실패 시 `{ width: 0, height: 0 }`으로 폴백해 갤러리가 깨지지 않는다는 점만 구현에서 보장하고, 에디터에서 실제 업로드로 확인한다.

§8의 `max-height`는 CSS 단독 변경이라 단위 테스트를 두지 않는다. 세로가 긴 사진과 캡션이 달린 세로 사진 두 경우를 개발 서버에서 눈으로 확인한다.

E2E는 추가하지 않는다. 스크롤 위치 단언은 뷰포트·플랫폼에 따라 쉽게 깨져 유지 비용이 이득보다 크다.
