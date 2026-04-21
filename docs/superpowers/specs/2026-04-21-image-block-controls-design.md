# image-block-controls 설계

작성일: 2026-04-21
브랜치명: `feature/image-block-controls`

## 목적

글 편집 중 본문 내 이미지를 **네이버 블로그 스타일**로 편집할 수 있게 한다. 현재는 Tiptap 기본 `@tiptap/extension-image`만 사용하고 있어 이미지 삽입 후에는 크기 조정, 정렬, 위치 이동이 불가능하다.

## 범위

### 포함

1. **사이즈 프리셋** — 3단계: 작게(40%) / 중간(70%) / 글 너비(100%). 기본값 중간.
2. **정렬** — 왼쪽 / 가운데 / 오른쪽. "글 너비"에서는 비활성(의미 없음).
3. **드래그 이동** — 이미지 노드를 잡고 문단 사이로 이동.
4. **플로팅 툴바** — 이미지 클릭 시 상단 중앙에 툴바(정렬 3 + 사이즈 3 + 삭제) 표시.
5. **선택 스타일** — 프로젝트 primary 색상 기반 테두리로 선택 상태 시각화.
6. **독자 페이지 렌더링** — 저장된 `data-*` 속성을 `prose.css`에서 받아 동일하게 표시.

### 제외

- **캡션(사진 설명)** — 이번 범위 외, 추후 별도 기능.
- **마크다운 모드 지원** — 표준 마크다운 `![](url)`으로는 사이즈·정렬 속성을 표현할 수 없음. WYSIWYG(HTML) 모드만 지원.
- **드래그 핸들 자유 리사이즈** — 픽셀 단위 리사이즈 없음, 프리셋만.
- **블록 전체 드래그 핸들(Notion식)** — 이미지 노드만 이동 가능.
- **"대표(썸네일)" 뱃지** — 썸네일은 `ThumbnailUploadAction`에서 별도 관리 중.
- **필터·AI 활용 등 네이버의 부가 기능**.

## 아키텍처

### Tiptap 커스텀 Extension

기본 `Image` extension을 확장해 두 가지를 추가한다.

1. **추가 attribute** — `data-size`, `data-align`을 HTML 속성으로 저장/파싱.
2. **NodeView (React)** — `ReactNodeViewRenderer`로 각 이미지를 React 컴포넌트로 렌더링해, 선택 상태·플로팅 툴바를 Tiptap 내부에서 그릴 수 있게 한다.

```typescript
// 의사 코드
Image.extend({
  name: 'image',
  draggable: true,             // ProseMirror 노드 레벨 드래그 이동 활성화
  addAttributes() {
    return {
      ...this.parent?.(),
      size:  { default: 'medium', parseHTML: el => el.getAttribute('data-size'),  renderHTML: a => ({ 'data-size':  a.size  }) },
      align: { default: 'center', parseHTML: el => el.getAttribute('data-align'), renderHTML: a => ({ 'data-align': a.align }) },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
```

### 저장 포맷 (예시)

```html
<img src="https://.../foo.png" alt="..." data-size="medium" data-align="center" />
```

- `width`/`height` 속성은 프리셋 모드에서는 **넣지 않는다** (CSS에서 `width` 제어).
- 기존에 삽입된 이미지(속성 없음)는 파싱 시 기본값(`medium` / `center`) 적용되어 하위 호환성 유지.

### 컴포넌트 단위

| 파일 | 역할 | 외부 인터페이스 |
|------|------|------------------|
| `image-extension.ts` | Tiptap extension 정의 (attribute + NodeView 연결 + draggable) | Tiptap `extensions` 배열에 넣음 |
| `image-node-view.tsx` | 선택 상태 감지, `<img>` 렌더링, 선택 시 `ImageToolbar` 표시 | Tiptap이 NodeView로 호출 |
| `image-toolbar.tsx` | 플로팅 툴바 UI (정렬/사이즈/삭제 버튼) | props로 `editor`, `node`, `getPos` 받음 |
| `image-commands.ts` | `setImageSize`, `setImageAlign`, `deleteImage` 등 커스텀 command | NodeView·다른 UI에서 재사용 |

**의존성 방향**: `extension → node-view → toolbar`. `commands`는 `extension`에 등록되어 툴바가 `editor.chain().setImageSize(...)` 형태로 호출.

### 드래그 이동

- Tiptap `draggable: true`만 설정하면 ProseMirror가 자동으로 노드 드래그 핸들링.
- 드롭 인디케이터(삽입 위치 표시선)는 ProseMirror 기본 동작 사용.
- 드래그 중 툴바는 숨김(포커스 해제 시 자동 사라짐).

### 사이즈·정렬 CSS

프리셋 값은 **에디터와 독자 페이지에서 동일한 CSS**를 써야 한다. 단일 소스 유지를 위해 `src/styles/prose.css`에만 정의하고, 에디터도 `prose` 클래스를 갖고 있으므로 별도 복제 없이 적용된다.

```css
/* src/styles/prose.css 에 추가 */
.prose img[data-size="small"]  { width: 40%; }
.prose img[data-size="medium"] { width: 70%; }
.prose img[data-size="full"]   { width: 100%; }

.prose img[data-align="left"]   { margin-right: auto; margin-left: 0; display: block; }
.prose img[data-align="center"] { margin-left: auto;  margin-right: auto; display: block; }
.prose img[data-align="right"]  { margin-left: auto;  margin-right: 0; display: block; }

/* 모바일: 모두 100% */
@media (max-width: 640px) {
  .prose img[data-size] { width: 100%; }
}
```

### 플로팅 툴바 UX

- 이미지 클릭(= ProseMirror NodeSelection) 시 표시.
- `position: absolute`, 이미지 상단 중앙. 이미지가 작을 때 잘리지 않게 `top: -44px` 고정.
- 버튼 구성(왼쪽 → 오른쪽):
  ```
  [ 왼쪽  가운데  오른쪽 ] | [ 작게  중간  글너비 ] | [ 삭제 ]
  ```
- 선택된 옵션은 primary 색상 배경으로 하이라이트.
- "글 너비"가 선택된 상태에서는 정렬 3개 버튼을 비활성(opacity 낮춤) 처리.
- 아이콘: `lucide-react` (`AlignLeft`, `AlignCenter`, `AlignRight`, `Minimize2`, `Square`, `Maximize2`, `Trash2`).

### 선택 스타일

```css
/* primary ring, rounded */
.ProseMirror .ProseMirror-selectednode img {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

## 파일 구조

```
src/app/admin/posts/new/_components/_image-block/
  image-extension.ts
  image-node-view.tsx
  image-toolbar.tsx
  image-commands.ts

src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx   # extensions 배열 교체
src/styles/prose.css                                          # data-size / data-align 스타일 추가
```

- 기존 `_image-upload/` 폴더(업로드 로직)와 구분하기 위해 **`_image-block/`** 폴더를 신규 생성.
- `_components`는 페이지별 규칙(`page-folder.md`)에 따라 `.tsx`/`.ts` 혼용 가능하나, extension·commands는 `.ts`만 포함하므로 의도상 일관.

## 데이터 흐름

```
[사용자 이미지 클릭]
      ↓
ProseMirror NodeSelection 발생
      ↓
image-node-view.tsx: selected=true → <ImageToolbar /> 렌더
      ↓
사용자 사이즈/정렬 버튼 클릭
      ↓
image-commands.ts: editor.chain().updateAttributes('image', { size: 'small' }).run()
      ↓
Tiptap onUpdate → store.setContent(editor.getHTML())
      ↓
AutoSaveProvider가 저장
```

## 테스트 전략

### Vitest (단위)

- `image-extension` attribute parseHTML/renderHTML 왕복(roundtrip)으로 속성 유지 확인.
- `image-toolbar` 렌더링: size/align 상태에 따라 올바른 버튼이 활성 하이라이트되는지.
- "글 너비"일 때 정렬 버튼이 비활성되는지.

### Playwright (E2E)

- 에디터 진입 → 이미지 업로드 → 툴바 표시 → 사이즈 "작게" 선택 → 저장 → 다시 열었을 때 작게 유지.
- 이미지 드래그로 문단 사이 이동 후 저장 → 순서 유지.
- 독자 페이지(`/posts/[slug]`)에서 같은 속성으로 렌더링 확인(시각 회귀까지는 아니어도 `data-size` 속성 존재 확인).

## 마이그레이션 / 하위 호환

- 기존 게시글의 `<img>`에는 `data-size`, `data-align`이 없다.
- NodeView 렌더링 시 Tiptap이 기본값(`medium`/`center`)을 채우므로 **추가 마이그레이션 불필요**.
- 다음번 해당 게시글이 편집·저장될 때 속성이 자연스럽게 HTML에 기록된다.

## 열린 질문

없음.

## 참고

- Tiptap Node Views (React): https://tiptap.dev/docs/editor/guide/node-views/react
- ProseMirror draggable nodes: https://prosemirror.net/docs/ref/#model.NodeSpec.draggable
