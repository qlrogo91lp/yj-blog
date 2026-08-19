# 에디터 이미지 처리·UI 개선 구현 계획 (글쓰기 개선 PR 3/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문 이미지의 드래그 이동이 실제로 동작하게 하고, 이미지 툴바가 잘리거나 겹치는 UI 문제를 없애며, 이미지 삭제·정리를 저장 시점의 서버 사이드로 옮기고, 업로드 전 클라이언트 압축으로 원본 크기 문제를 해결한다.

**Architecture:**
- **드래그**: TipTap 3의 React NodeView는 `[data-drag-handle]` 요소에서 시작한 드래그만 노드 이동으로 처리한다(`@tiptap/core/src/NodeView.ts` `onDragStart` — 핸들이 없으면 즉시 return). 이미지·갤러리 NodeView에 핸들 속성을 추가한다.
- **툴바**: 이미지 NodeView 안의 `absolute` 툴바를 제거하고, 에디터 레벨의 `BubbleMenu`(`@tiptap/react/menus`, floating-ui `flip`/`shift` 내장, portal 렌더)로 옮긴다. 툴바는 이미지 노드가 선택되면 이미지 위에 뜨고 뷰포트·컨테이너 경계에서 자동으로 위치를 조정한다. 갤러리 슬라이드 툴바는 슬라이드 폭에 무관하게 좌상단 고정으로 바꾼다.
- **이미지 정리**: `onUpdate`마다 사라진 src를 즉시 R2에서 지우던 클라이언트 로직(잘라내기·Undo 시 파일 유실)을 제거하고, `savePost`가 저장 직후 본문 HTML·썸네일 URL에서 R2 키를 추출해 `post_images`와 대조, 고아만 삭제한다. R2 클라이언트는 `src/lib/r2.ts`로 통합한다.
- **압축**: 업로드 직전 canvas로 긴 변 1600px·webp 0.85 재인코딩(`_utils/compress-image.ts`). 썸네일·본문·다이얼로그 업로드 모두 같은 함수를 거친다. 결과가 원본보다 크거나 실패하면 원본을 그대로 쓴다.
- **빈 draft**: 이미지 업로드로 생긴 `title: ''` draft는 유지하되 관리 목록에서 "(제목 없음)"으로 표시하고, draft 글의 제목 링크는 편집 페이지로 향하게 한다.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, TipTap 3.20 (`@tiptap/react/menus` BubbleMenu, `useEditorState`), Cloudflare R2(`@aws-sdk/client-s3`), Drizzle(neon-http), Vitest + Testing Library

**Spec:** 별도 스펙 없음. 2026-08-19 리뷰 결과 및 사용자 결정(빈 draft는 "B — 유지 + 목록 표시" 방식).

**선행:** PR 1(`editor-save-lifecycle`), PR 2(`editor-remove-markdown-mode`) 머지 후 진행. PR 1의 Task 3이 `wysiwyg-editor.action.tsx`의 동기화 effect에 `prevImageSrcs` 갱신을 넣었는데, 이 PR에서 `prevImageSrcs` 자체가 사라진다.

## 배경 — 리뷰에서 확인된 문제

| # | 문제 | 근거 |
|---|---|---|
| 1 | 이미지·갤러리 드래그로 위치 이동이 안 됨. `<img>`에 `cursor-grab`까지 있어 되는 것처럼 보이지만 네이티브 이미지 드래그만 일어나고, 드롭 시 사본이 삽입될 수 있음 | `grep data-drag-handle src/app/admin/posts/new` → 0건. TipTap `NodeView.onDragStart`는 `!dragHandle`이면 return |
| 2 | 이미지 선택 시 툴바(정렬3+크기3+alt+삭제 ≈ 330px)가 `figure` 중앙 `absolute -top-11`에 뜸. `data-size="small"`(40% ≈ 290px)이면 양옆으로 튀어나가고, 왼쪽 정렬이면 에디터 밖으로 나감. `data-size="full"`은 `transform`이라 기준점이 어긋남. 문서 첫 블록이면 sticky 툴바와 겹침 | `image-node-view.tsx:26`, `prose.css:129-143` |
| 3 | 갤러리 슬라이드 툴바가 `overflow-x: auto` 컨테이너 안 슬라이드 중앙에 있어, 세로 사진(폭 좁음)이면 옆 슬라이드 위로 겹침 | `gallery-node-view.tsx:46`, `prose.css:194-197` |
| 4 | 이미지 잘라내기(Ctrl+X)·삭제 후 Undo 시 R2 파일이 이미 지워져 깨진 이미지 | `wysiwyg-editor.action.tsx` `onUpdate` → `removeImage` 즉시 호출. 갤러리 plan(2026-08-17)에서 "알려진 제약"으로 남겼던 항목 |
| 5 | 썸네일 교체·제거 시 이전 R2 파일과 `post_images` 행이 남음 | `thumbnail-upload.action.tsx` X 버튼은 `setThumbnailUrl(null)`만 |
| 6 | 썸네일 1MB 제한은 OG 이미지(원본 URL 그대로 노출)·Server Action body 한도를 지키기 위해 필요하지만, 폰 사진은 대부분 걸림. 본문 이미지도 10MB 원본이 그대로 R2에 쌓임 | `thumbnail-upload.action.tsx`, `upload-image.ts` |
| 7 | 이미지 업로드로 생긴 빈 draft가 목록에 빈 제목 행으로 노출, 제목 링크가 공개 페이지(404)로 감 | `upload-image.ts createDraftPost`, `columns.tsx` |
| 8 | 정렬 버튼이 `size !== 'small'`이면 disabled인데 이유 안내 없음. 활성 버튼 hover가 `bg-muted-foreground`로 바뀌어 눌린 상태가 흐릿해짐 | `image-toolbar.tsx` |

## Global Constraints

- 브랜치: `develop`에서 `fix/editor-image-handling` 생성. squash 금지, gitmoji 커밋.
- 공개 페이지 HTML 출력 형식(`<figure data-size data-align><img data-caption>`, `<div data-gallery>`)은 변경하지 않는다 — `image-extension.ts`·`gallery-extension.ts`의 `renderHTML`은 그대로.
- 압축 파라미터: 긴 변 **1600px**, **webp 품질 0.85**, 대상 MIME `image/jpeg`·`image/png`·`image/webp`만(gif·svg·avif는 원본 유지). 결과가 원본보다 크면 원본 사용.
- 썸네일 크기 제한 **1MB 유지**(압축 후 검사), 본문 이미지 **10MB 유지**.
- R2 삭제는 실패해도 저장을 실패시키지 않는다(고아 파일 > 저장 실패).
- Server Action은 테스트에서 `vi.mock`. TipTap 통합 테스트는 기존 `collect-image-srcs.test.ts`처럼 jsdom에서 `new Editor({...})`로 구성해도 된다.
- 아이콘은 `size={16}`.

---

## 파일 구조

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx` | 이미지 NodeView. 툴바 제거, `<img data-drag-handle>` | 수정 |
| `src/app/admin/posts/new/_components/_image-block/image-node-view.test.tsx` | 드래그 핸들·캡션 input 테스트 | 신규 |
| `src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx` | 순수 툴바(props). disabled 사유 `title`, hover 색 정리 | 수정 |
| `src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx` | `title` 속성 테스트 추가 | 수정 |
| `src/app/admin/posts/new/_actions/image-bubble-menu.action.tsx` | `BubbleMenu` + `useEditorState`로 선택된 이미지 노드의 속성을 읽고 `ImageToolbar`에 연결 | 신규 |
| `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx` | `ImageBubbleMenuAction` 배치, 이미지 정리 로직 제거, 업로드 전 압축 | 수정 |
| `src/app/admin/posts/new/_components/_gallery/gallery-node-view.tsx` | wrapper `data-drag-handle`, 슬라이드 툴바 좌상단 고정 | 수정 |
| `src/app/admin/posts/new/_components/_gallery/gallery-node-view.test.tsx` | 드래그 핸들 테스트 추가 | 수정 |
| `src/lib/r2.ts` | R2 `S3Client` 단일 인스턴스 + `deleteR2Objects(keys)` | 신규 |
| `src/app/admin/posts/new/_utils/extract-r2-keys.ts` | HTML 문자열에서 R2 public URL로 시작하는 `src`의 키 추출(순수) | 신규 |
| `src/app/admin/posts/new/_utils/extract-r2-keys.test.ts` | 추출 테스트 | 신규 |
| `src/app/admin/posts/new/_services/save-post.ts` | 저장 후 `cleanupOrphanImages` 실행 | 수정 |
| `src/app/admin/posts/new/_services/upload-image.ts` | `src/lib/r2.ts` 사용 | 수정 |
| `src/app/admin/posts/_services/remove-post.ts` | `src/lib/r2.ts` 사용 | 수정 |
| `src/app/admin/posts/new/_services/remove-image.ts` | **삭제** | |
| `src/app/admin/posts/new/_utils/collect-image-srcs.ts` + `.test.ts` | **삭제** | |
| `src/app/admin/posts/new/_utils/compress-image.ts` | 클라이언트 압축 | 신규 |
| `src/app/admin/posts/new/_utils/compress-image.test.ts` | 대상 판별·폴백 테스트 | 신규 |
| `src/app/admin/posts/new/_actions/thumbnail-upload.action.tsx` | 압축 후 1MB 검사 | 수정 |
| `src/app/admin/posts/new/_actions/_image-upload/image-upload.action.tsx` | 압축 후 업로드 | 수정 |
| `src/app/admin/posts/_components/columns.tsx` | 빈 제목 "(제목 없음)", draft는 편집 링크 | 수정 |
| `src/app/admin/posts/_components/columns.test.tsx` | 제목 셀 렌더 테스트 | 신규 |

---

### Task 0: 브랜치 생성

- [ ] **Step 1**

```bash
git checkout develop && git pull origin develop && git checkout -b fix/editor-image-handling
```

- [ ] **Step 2: 기존 테스트 통과 확인**

Run: `npx vitest run --dir src src/app/admin/posts`
Expected: 전부 PASS

---

### Task 1: 이미지·갤러리 드래그 핸들

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx`
- Create: `src/app/admin/posts/new/_components/_image-block/image-node-view.test.tsx`
- Modify: `src/app/admin/posts/new/_components/_gallery/gallery-node-view.tsx`
- Modify: `src/app/admin/posts/new/_components/_gallery/gallery-node-view.test.tsx`

**Interfaces:**
- Produces: `ImageNodeView`의 `<img>`에 `data-drag-handle`, `GalleryNodeView`의 wrapper(`data-gallery`)에 `data-drag-handle`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_components/_image-block/image-node-view.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { NodeViewProps } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { ImageNodeView } from './image-node-view';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, as: _as, ...rest }: { children: React.ReactNode; as?: string }) => (
    <figure {...rest}>{children}</figure>
  ),
}));

function setup(overrides: Partial<NodeViewProps> = {}) {
  const updateAttributes = vi.fn();
  const props = {
    node: { attrs: { src: 'https://cdn/a.png', alt: '', size: 'default', align: 'center', caption: '' } },
    updateAttributes,
    deleteNode: vi.fn(),
    selected: false,
    ...overrides,
  } as unknown as NodeViewProps;
  const utils = render(<ImageNodeView {...props} />);
  return { ...utils, updateAttributes };
}

describe('ImageNodeView', () => {
  it('img가 드래그 핸들이다 (data-drag-handle)', () => {
    setup();
    expect(screen.getByRole('img')).toHaveAttribute('data-drag-handle');
  });

  it('선택되지 않았고 캡션이 없으면 캡션 input을 렌더하지 않는다', () => {
    setup();
    expect(screen.queryByPlaceholderText('캡션 추가...')).not.toBeInTheDocument();
  });

  it('선택되면 캡션 input을 렌더하고 입력 시 updateAttributes({ caption })', () => {
    const { updateAttributes } = setup({ selected: true });
    const input = screen.getByPlaceholderText('캡션 추가...');
    fireEvent.change(input, { target: { value: '설명' } });
    expect(updateAttributes).toHaveBeenCalledWith({ caption: '설명' });
  });

  it('NodeView 안에 툴바(정렬·삭제 버튼)를 렌더하지 않는다 — BubbleMenu로 이전', () => {
    setup({ selected: true });
    expect(screen.queryByRole('button', { name: '이미지 삭제' })).not.toBeInTheDocument();
  });
});
```

`gallery-node-view.test.tsx`에 추가:

```tsx
  it('갤러리 wrapper가 드래그 핸들이다 (data-drag-handle)', () => {
    const { container } = render(
      <GalleryNodeView
        {...({
          node: { attrs: { images } },
          updateAttributes: vi.fn(),
          deleteNode: vi.fn(),
          selected: false,
        } as unknown as NodeViewProps)}
      />,
    );
    expect(container.querySelector('[data-gallery]')).toHaveAttribute('data-drag-handle');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_components`
Expected: 새 테스트 4+1개 FAIL

- [ ] **Step 3: `image-node-view.tsx` 구현 (툴바 제거 + 드래그 핸들)**

```tsx
'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { ImageAlign, ImageSize } from '../../_utils/image-extension';

/**
 * 본문 이미지 NodeView.
 * - 툴바는 여기 두지 않는다 — 에디터 레벨 ImageBubbleMenuAction이 담당(폭·overflow 문제 회피).
 * - <img>가 드래그 핸들: TipTap React NodeView는 [data-drag-handle]에서 시작한 드래그만 노드 이동으로 처리한다.
 */
export function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const size = (node.attrs.size as ImageSize) ?? 'default';
  const align = (node.attrs.align as ImageAlign) ?? 'center';
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) ?? '';
  const caption = (node.attrs.caption as string) ?? '';

  return (
    <NodeViewWrapper
      as="figure"
      className="relative my-4"
      data-size={size}
      data-align={align}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        data-size={size}
        data-align={align}
        data-drag-handle
        className={cn(
          'cursor-grab active:cursor-grabbing',
          selected && 'ring-2 ring-primary ring-offset-2',
        )}
      />
      {(selected || caption) && (
        <input
          type="text"
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="캡션 추가..."
          className="mt-1.5 w-full border-0 border-b border-muted-foreground/30 bg-transparent px-0 py-0.5 text-sm italic text-muted-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0"
        />
      )}
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 4: `gallery-node-view.tsx` — wrapper에 핸들, 슬라이드 툴바 좌상단**

- `<NodeViewWrapper data-gallery="" ...>` → `<NodeViewWrapper data-gallery="" data-drag-handle ...>`
- 슬라이드 툴바 컨테이너 `className="absolute left-1/2 top-2 z-10 -translate-x-1/2"` → `className="absolute left-2 top-2 z-10"`

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_components`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_components
git commit -m "🐛 fix: 이미지·갤러리에 data-drag-handle을 추가해 드래그 이동이 동작하도록"
```

---

### Task 2: 이미지 툴바를 BubbleMenu로 이전

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx`
- Modify: `src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`
- Create: `src/app/admin/posts/new/_actions/image-bubble-menu.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`

**Interfaces:**
- Consumes: `ImageToolbar` props(기존): `size, align, alt, onSizeChange, onAlignChange, onAltChange, onDelete`
- Produces: `export function ImageBubbleMenuAction({ editor }: { editor: Editor | null })`

- [ ] **Step 1: 툴바 테스트 추가 (disabled 사유 title)**

`image-toolbar.test.tsx`에 추가:

```tsx
  it('정렬 버튼이 disabled일 때 사유를 title로 안내한다', () => {
    render(<ImageToolbar {...baseProps} size="default" />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toHaveAttribute(
      'title',
      '40% 크기에서만 정렬할 수 있습니다',
    );
  });

  it('size=small이면 정렬 버튼에 title이 없다', () => {
    render(<ImageToolbar {...baseProps} size="small" />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).not.toHaveAttribute('title');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`
Expected: 새 테스트 FAIL

- [ ] **Step 3: `image-toolbar.tsx` 수정**

정렬 버튼 `<button>`에 `title={alignDisabled ? '40% 크기에서만 정렬할 수 있습니다' : undefined}` 추가. 활성 상태 클래스 `'bg-primary text-primary-foreground hover:bg-muted-foreground'` → `'bg-primary text-primary-foreground hover:bg-primary/90'` (정렬·사이즈 버튼 두 곳 모두).

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`
Expected: PASS

- [ ] **Step 5: `image-bubble-menu.action.tsx` 작성**

```tsx
'use client';

import { useEditorState, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { ImageToolbar } from '../_components/_image-block/image-toolbar';
import type { ImageAlign, ImageSize } from '../_utils/image-extension';

type Props = {
  editor: Editor | null;
};

/**
 * 선택된 본문 이미지 위에 뜨는 툴바.
 * NodeView 내부 absolute 배치 대신 BubbleMenu(floating-ui, flip/shift 내장, portal)로 띄워
 * 이미지 폭이 좁거나 정렬·full-bleed(transform)여도 잘리거나 어긋나지 않는다.
 */
export function ImageBubbleMenuAction({ editor }: Props) {
  const imageAttrs = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e || !e.isActive('image')) return null;
      const attrs = e.getAttributes('image');
      return {
        size: (attrs.size as ImageSize | undefined) ?? 'default',
        align: (attrs.align as ImageAlign | undefined) ?? 'center',
        alt: (attrs.alt as string | undefined) ?? '',
      };
    },
  });

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubbleMenu"
      shouldShow={({ editor: e }) => e.isActive('image')}
      options={{ placement: 'top', offset: 8 }}
    >
      {imageAttrs && (
        <ImageToolbar
          size={imageAttrs.size}
          align={imageAttrs.align}
          alt={imageAttrs.alt}
          onSizeChange={(size) =>
            editor.chain().focus().updateAttributes('image', { size }).run()
          }
          onAlignChange={(align) =>
            editor.chain().focus().updateAttributes('image', { align }).run()
          }
          onAltChange={(alt) => editor.commands.updateAttributes('image', { alt })}
          onDelete={() => editor.chain().focus().deleteSelection().run()}
        />
      )}
    </BubbleMenu>
  );
}
```

> `onAltChange`는 `focus()`를 호출하지 않는다 — alt 입력 Popover의 `<Input>`에 타이핑할 때마다 에디터로 포커스가 돌아가면 입력이 끊긴다.

- [ ] **Step 6: `wysiwyg-editor.action.tsx`에 배치**

- import 추가: `import { ImageBubbleMenuAction } from './image-bubble-menu.action';`
- return을 다음으로 교체:

```tsx
  return (
    <>
      <EditorContent editor={editor} />
      <ImageBubbleMenuAction editor={editor} />
    </>
  );
```

- [ ] **Step 7: 타입·기존 테스트**

Run: `npx tsc --noEmit && npx vitest run --dir src src/app/admin/posts`
Expected: 오류 없음, PASS

- [ ] **Step 8: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block src/app/admin/posts/new/_actions/image-bubble-menu.action.tsx src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx
git commit -m "✨ feat: 이미지 툴바를 BubbleMenu로 이전해 잘림·겹침 문제 해소"
```

---

### Task 3: R2 클라이언트 통합 (`src/lib/r2.ts`)

**Files:**
- Create: `src/lib/r2.ts`
- Modify: `src/app/admin/posts/new/_services/upload-image.ts`
- Modify: `src/app/admin/posts/_services/remove-post.ts`

**Interfaces:**
- Produces:
  - `export const r2: S3Client`
  - `export const r2Bucket: string` (= `process.env.R2_BUCKET_NAME!`)
  - `export const r2PublicUrl: string` (= `process.env.R2_PUBLIC_URL ?? ''`)
  - `export async function deleteR2Objects(keys: string[]): Promise<void>` — 빈 배열이면 no-op, `DeleteObjectsCommand` 1회

- [ ] **Step 1: `src/lib/r2.ts` 작성**

```ts
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 클라이언트 (서버 전용).
 * upload-image / save-post(고아 정리) / remove-post가 공유한다.
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const r2Bucket = process.env.R2_BUCKET_NAME!;
export const r2PublicUrl = process.env.R2_PUBLIC_URL ?? '';

export async function deleteR2Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: r2Bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
}
```

- [ ] **Step 2: `upload-image.ts`에서 로컬 `S3Client` 생성 제거**

- `import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';` → `import { PutObjectCommand } from '@aws-sdk/client-s3';`
- `const r2 = new S3Client({...});` 블록 삭제 → `import { r2, r2Bucket, r2PublicUrl } from '@/lib/r2';`
- `Bucket: process.env.R2_BUCKET_NAME!` → `Bucket: r2Bucket`
- `return { url: \`${process.env.R2_PUBLIC_URL}/${key}\`, ... }` → `return { url: \`${r2PublicUrl}/${key}\`, ... }`

- [ ] **Step 3: `remove-post.ts`에서 로컬 클라이언트 제거**

- `import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';` 삭제, `const r2 = new S3Client({...})` 삭제
- `import { deleteR2Objects } from '@/lib/r2';` 추가
- 2단계 R2 삭제 블록을 다음으로 교체:

```ts
    // 2. R2에서 이미지 일괄 삭제 (실패해도 DB 삭제는 진행)
    try {
      await deleteR2Objects(images.map(({ key }) => key));
    } catch {
      // R2 삭제 실패는 무시 — 고아 이미지가 남는 게 글이 안 지워지는 것보다 나음
    }
```

- [ ] **Step 4: 타입·테스트**

`upload-image.test.ts`의 `vi.mock('@aws-sdk/client-s3', ...)` 팩토리는 `S3Client`·`PutObjectCommand`만 정의하는데, 새 `src/lib/r2.ts`가 `DeleteObjectsCommand`를 import하므로 팩토리에 아래를 추가한다(없으면 vitest가 "No DeleteObjectsCommand export is defined on the mock" 오류를 낸다):

```ts
    DeleteObjectsCommand: class {
      constructor(public args: Record<string, unknown>) {}
    },
```

Run: `npx tsc --noEmit && npx vitest run src/app/admin/posts/new/_services/upload-image.test.ts`
Expected: 오류 없음, PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/r2.ts src/app/admin/posts/new/_services/upload-image.ts src/app/admin/posts/_services/remove-post.ts src/app/admin/posts/new/_services/upload-image.test.ts
git commit -m "♻️ refactor: R2 클라이언트를 src/lib/r2.ts로 통합"
```

---

### Task 4: 이미지 정리를 저장 시점 서버 사이드로 이전

**Files:**
- Create: `src/app/admin/posts/new/_utils/extract-r2-keys.ts`
- Create: `src/app/admin/posts/new/_utils/extract-r2-keys.test.ts`
- Modify: `src/app/admin/posts/new/_services/save-post.ts`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`
- Delete: `src/app/admin/posts/new/_services/remove-image.ts`
- Delete: `src/app/admin/posts/new/_utils/collect-image-srcs.ts`, `collect-image-srcs.test.ts`

**Interfaces:**
- Produces: `export function extractR2Keys(html: string, publicUrl: string): Set<string>` — `src="<publicUrl>/<key>"` 형태의 모든 `src`에서 `<key>`를 모은다. `publicUrl`이 빈 문자열이면 빈 Set.
- Consumes: Task 3의 `deleteR2Objects`, `r2PublicUrl`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_utils/extract-r2-keys.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractR2Keys } from './extract-r2-keys';

const publicUrl = 'https://pub.example.com';

describe('extractR2Keys', () => {
  it('public URL로 시작하는 img src에서 키를 추출한다', () => {
    const html = `<figure><img src="${publicUrl}/images/post-1/image1-123.png"></figure>`;
    expect(extractR2Keys(html, publicUrl)).toEqual(new Set(['images/post-1/image1-123.png']));
  });

  it('갤러리 안 여러 이미지의 키를 모두 모은다', () => {
    const html =
      `<div data-gallery=""><figure><img src="${publicUrl}/images/post-1/a.png"></figure>` +
      `<figure><img src="${publicUrl}/images/post-1/b.png"></figure></div>`;
    expect(extractR2Keys(html, publicUrl)).toEqual(
      new Set(['images/post-1/a.png', 'images/post-1/b.png']),
    );
  });

  it('외부 URL 이미지는 무시한다', () => {
    const html = `<img src="https://other.com/x.png"><img src='${publicUrl}/images/y.png'>`;
    expect(extractR2Keys(html, publicUrl)).toEqual(new Set(['images/y.png']));
  });

  it('publicUrl이 비어 있으면 빈 Set', () => {
    expect(extractR2Keys('<img src="https://a/b.png">', '')).toEqual(new Set());
  });

  it('이미지가 없으면 빈 Set', () => {
    expect(extractR2Keys('<p>텍스트</p>', publicUrl)).toEqual(new Set());
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/extract-r2-keys.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/app/admin/posts/new/_utils/extract-r2-keys.ts`:

```ts
/**
 * 본문 HTML 문자열에서 R2 public URL로 시작하는 src의 키를 모은다.
 * 서버(savePost)에서 post_images와 대조해 고아 파일을 찾는 데 쓴다.
 * TipTap 없이 문자열만으로 동작해야 하므로 정규식으로 처리한다.
 */
export function extractR2Keys(html: string, publicUrl: string): Set<string> {
  const keys = new Set<string>();
  if (!publicUrl) return keys;

  const prefix = `${publicUrl}/`;
  const srcPattern = /\ssrc=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = srcPattern.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith(prefix)) keys.add(src.slice(prefix.length));
  }
  return keys;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/extract-r2-keys.test.ts`
Expected: PASS (5개)

- [ ] **Step 5: `save-post.ts`에 고아 정리 추가**

import 추가:

```ts
import { postImages, postTags, posts } from '@/db/schema';
import { deleteR2Objects, r2PublicUrl } from '@/lib/r2';
import { extractR2Keys } from '../_utils/extract-r2-keys';
```

파일 하단(`syncPostTags` 옆)에 헬퍼 추가:

```ts
/**
 * 본문·썸네일에 더 이상 쓰이지 않는 이미지를 R2와 post_images에서 정리한다.
 * 저장 시점에만 실행하므로 편집 중 잘라내기·Undo로 파일이 사라지지 않는다.
 * 실패는 무시한다 — 고아 파일이 남는 게 저장 실패보다 낫다.
 */
async function cleanupOrphanImages(
  postId: number,
  content: string,
  thumbnailUrl: string | null,
): Promise<void> {
  try {
    const keep = extractR2Keys(content, r2PublicUrl);
    if (thumbnailUrl && r2PublicUrl && thumbnailUrl.startsWith(`${r2PublicUrl}/`)) {
      keep.add(thumbnailUrl.slice(r2PublicUrl.length + 1));
    }

    const rows = await db
      .select({ id: postImages.id, key: postImages.key })
      .from(postImages)
      .where(eq(postImages.postId, postId));

    const orphans = rows.filter((row) => !keep.has(row.key));
    if (orphans.length === 0) return;

    await deleteR2Objects(orphans.map((row) => row.key));
    await db.delete(postImages).where(
      inArray(
        postImages.id,
        orphans.map((row) => row.id),
      ),
    );
  } catch {
    // 정리 실패는 저장 결과에 영향을 주지 않는다
  }
}
```

`import { eq } from 'drizzle-orm';` → `import { eq, inArray } from 'drizzle-orm';`

UPDATE 분기의 `await syncPostTags(input.postId, tagIds);` 뒤와 INSERT 분기의 `await syncPostTags(newPost.id, tagIds);` 뒤에 각각:

```ts
      await cleanupOrphanImages(input.postId, content, input.thumbnailUrl ?? null);
```
```ts
      await cleanupOrphanImages(newPost.id, content, input.thumbnailUrl ?? null);
```

- [ ] **Step 6: 클라이언트 즉시 삭제 로직 제거**

`wysiwyg-editor.action.tsx`:
- import 삭제: `removeImage`, `collectImageSrcs`
- `const prevImageSrcs = useRef<Set<string>>(new Set());` 삭제
- `onUpdate`를 다음으로 교체:

```tsx
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
```

- context 공유 effect에서 `if (editor) { prevImageSrcs.current = collectImageSrcs(editor.state.doc); }` 삭제
- content 동기화 effect에서 `prevImageSrcs.current = collectImageSrcs(editor.state.doc);` 삭제 (PR 1 Task 3에서 넣은 줄)

파일 삭제:

```bash
git rm src/app/admin/posts/new/_services/remove-image.ts src/app/admin/posts/new/_utils/collect-image-srcs.ts src/app/admin/posts/new/_utils/collect-image-srcs.test.ts
```

- [ ] **Step 7: 타입·테스트**

Run: `npx tsc --noEmit && npx vitest run --dir src src/app/admin/posts`
Expected: 오류 없음, PASS. `grep -rn "removeImage\|collectImageSrcs" src` → 출력 없음

- [ ] **Step 8: 커밋**

```bash
git add -A src/app/admin/posts/new
git commit -m "♻️ refactor: 이미지 고아 정리를 저장 시점 서버 사이드로 이전 (잘라내기·Undo 시 파일 유실 방지)"
```

---

### Task 5: 업로드 전 클라이언트 압축

**Files:**
- Create: `src/app/admin/posts/new/_utils/compress-image.ts`
- Create: `src/app/admin/posts/new/_utils/compress-image.test.ts`
- Modify: `src/app/admin/posts/new/_actions/thumbnail-upload.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/_image-upload/image-upload.action.tsx`

**Interfaces:**
- Produces:
  - `export function isCompressible(file: File): boolean` — `image/jpeg | image/png | image/webp`
  - `export async function compressImage(file: File): Promise<File>` — 긴 변 1600px·webp 0.85. 대상이 아니거나 실패하거나 결과가 더 크면 원본 반환

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_utils/compress-image.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { compressImage, isCompressible } from './compress-image';

function fileOf(type: string, size = 10) {
  return new File([new Uint8Array(size)], `x.${type.split('/')[1]}`, { type });
}

describe('isCompressible', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('%s 는 압축 대상', (type) => {
    expect(isCompressible(fileOf(type))).toBe(true);
  });
  it.each(['image/gif', 'image/svg+xml', 'image/avif', 'text/plain'])('%s 는 대상 아님', (type) => {
    expect(isCompressible(fileOf(type))).toBe(false);
  });
});

describe('compressImage', () => {
  it('대상이 아니면 원본을 그대로 돌려준다', async () => {
    const gif = fileOf('image/gif');
    expect(await compressImage(gif)).toBe(gif);
  });

  it('createImageBitmap이 없거나 실패하면 원본을 돌려준다 (jsdom)', async () => {
    const png = fileOf('image/png');
    expect(await compressImage(png)).toBe(png);
  });

  it('압축 결과가 원본보다 크면 원본을 돌려준다', async () => {
    const png = fileOf('image/png', 4);
    const bitmap = { width: 10, height: 10, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const toBlob = vi.fn((cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array(100)], { type: 'image/webp' })));
    const getContext = vi.fn(() => ({ drawImage: vi.fn() }));
    vi.spyOn(document, 'createElement').mockImplementation(
      () => ({ width: 0, height: 0, getContext, toBlob }) as unknown as HTMLCanvasElement,
    );
    expect(await compressImage(png)).toBe(png);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('압축 결과가 더 작으면 webp File을 돌려준다', async () => {
    const png = fileOf('image/png', 1000);
    const bitmap = { width: 3200, height: 1600, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (cb: (b: Blob | null) => void) =>
        cb(new Blob([new Uint8Array(10)], { type: 'image/webp' })),
    };
    vi.spyOn(document, 'createElement').mockImplementation(
      () => canvas as unknown as HTMLCanvasElement,
    );
    const out = await compressImage(png);
    expect(out.type).toBe('image/webp');
    expect(out.name).toBe('x.webp');
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 800);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/compress-image.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/app/admin/posts/new/_utils/compress-image.ts`:

```ts
const maxEdgePx = 1600;
const webpQuality = 0.85;
const compressibleTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isCompressible(file: File): boolean {
  return compressibleTypes.has(file.type);
}

/**
 * 업로드 전 클라이언트 압축: 긴 변 1600px, webp 0.85.
 * - gif(애니메이션)·svg·avif는 건드리지 않는다.
 * - 실패하거나 결과가 원본보다 크면 원본을 그대로 쓴다.
 * 썸네일(OG 이미지로 원본 URL이 노출됨)·본문 이미지 모두 이 함수를 거친다.
 */
export async function compressImage(file: File): Promise<File> {
  if (!isCompressible(file)) return file;
  if (typeof createImageBitmap !== 'function') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', webpQuality),
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/compress-image.test.ts`
Expected: PASS

- [ ] **Step 5: 썸네일 업로드에 적용**

`thumbnail-upload.action.tsx`:
- `import { compressImage } from '../_utils/compress-image';`
- `handleFileChange`를 다음으로 교체:

```tsx
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;

    setIsUploading(true);
    try {
      const file = await compressImage(original);
      if (file.size > THUMBNAIL_SIZE_LIMIT) {
        toast.error('썸네일은 1MB 이하만 업로드 가능합니다 (압축 후에도 초과)');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData, postId, 'thumbnail');
      if (result.url) {
        setThumbnailUrl(result.url);
        if (result.postId && !postId) {
          setPostId(result.postId);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };
```

- [ ] **Step 6: 본문 업로드(WYSIWYG)에 적용**

`wysiwyg-editor.action.tsx`:
- `import { compressImage } from '../_utils/compress-image';`
- `uploadAndInsert` 안에서 `const formData = new FormData(); formData.append('file', file);` → 

```tsx
      const uploadFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', uploadFile);
```

- `uploadFiles`의 for 루프 안 `const size = await readImageSize(file);` 앞에 `const uploadFile = await compressImage(file);`를 두고, `readImageSize(uploadFile)`·`formData.append('file', uploadFile)`로 바꾼다.

- [ ] **Step 7: 이미지 다이얼로그에 적용**

`_image-upload/image-upload.action.tsx`:
- `import { compressImage } from '../../_utils/compress-image';`
- `handleFileChange`에서 `formData.append('file', file);` → `formData.append('file', await compressImage(file));`

- [ ] **Step 8: 타입·테스트**

Run: `npx tsc --noEmit && npx vitest run --dir src src/app/admin/posts`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add src/app/admin/posts/new/_utils/compress-image.ts src/app/admin/posts/new/_utils/compress-image.test.ts src/app/admin/posts/new/_actions
git commit -m "✨ feat: 이미지 업로드 전 클라이언트 압축(1600px·webp) 적용"
```

---

### Task 6: 관리 목록 — 빈 제목 표시, draft는 편집 링크

**Files:**
- Modify: `src/app/admin/posts/_components/columns.tsx`
- Create: `src/app/admin/posts/_components/columns.test.tsx`

**Interfaces:**
- Produces: 제목 셀 — `title`이 비면 "(제목 없음)"(muted, italic). `status === 'draft'`면 `/admin/posts/{id}/edit`, 아니면 `/posts/{slug}`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/_components/columns.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { postColumns } from './columns';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const base = {
  id: 1,
  title: '글 제목',
  slug: 'my-post',
  content: '',
  contentFormat: 'html',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published',
  views: 0,
  categoryId: null,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  category: null,
} as unknown as PostWithCategory;

function renderTitleCell(post: PostWithCategory) {
  const column = postColumns[0];
  const cell = column.cell as (ctx: { getValue: () => unknown; row: { original: PostWithCategory } }) => React.ReactNode;
  render(<>{cell({ getValue: () => post.title, row: { original: post } })}</>);
}

describe('postColumns 제목 셀', () => {
  it('발행 글은 공개 페이지로 링크한다', () => {
    renderTitleCell(base);
    expect(screen.getByRole('link', { name: '글 제목' })).toHaveAttribute('href', '/posts/my-post');
  });

  it('draft 글은 편집 페이지로 링크한다', () => {
    renderTitleCell({ ...base, status: 'draft' });
    expect(screen.getByRole('link', { name: '글 제목' })).toHaveAttribute('href', '/admin/posts/1/edit');
  });

  it('제목이 비어 있으면 "(제목 없음)"으로 표시한다', () => {
    renderTitleCell({ ...base, title: '', status: 'draft' });
    expect(screen.getByRole('link', { name: '(제목 없음)' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/_components/columns.test.tsx`
Expected: FAIL (draft 링크·빈 제목)

- [ ] **Step 3: 구현** — `columns.tsx`의 title 컬럼:

```tsx
  columnHelper.accessor('title', {
    header: '제목',
    cell: (info) => {
      const { id, slug, status } = info.row.original;
      const title = info.getValue();
      const href = status === 'draft' ? `/admin/posts/${id}/edit` : `/posts/${slug}`;
      return (
        <Link
          href={href}
          className={
            title
              ? 'font-medium hover:underline'
              : 'italic text-muted-foreground hover:underline'
          }
        >
          {title || '(제목 없음)'}
        </Link>
      );
    },
  }),
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/_components/columns.test.tsx`
Expected: PASS (3개)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/_components/columns.tsx src/app/admin/posts/_components/columns.test.tsx
git commit -m "✨ feat: 관리 목록에서 빈 제목 draft를 '(제목 없음)'으로 표시하고 편집 페이지로 링크"
```

---

### Task 7: 최종 검증 및 문서 갱신

- [ ] **Step 1: 전체 테스트·린트·빌드**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 전부 PASS / 성공

- [ ] **Step 2: 수동 시나리오 (로그인 가능한 브라우저 필수 — 이 PR은 눈으로 봐야 한다)**

1. **드래그**: 본문에 이미지 2장 + 문단을 넣고 이미지를 끌어 문단 아래로 이동 → 원본이 사라지고 새 위치에 나타난다(사본 아님). 갤러리도 동일.
2. **툴바 위치**: 이미지 선택 → 툴바가 이미지 위 중앙에 뜬다. `40%` + `왼쪽 정렬`로 바꿔도 툴바가 에디터 밖으로 나가지 않는다. `전체 폭`에서도 이미지 위에 정확히 뜬다. 문서 첫 블록이 이미지일 때 상단 sticky 툴바에 가려지지 않는다(뷰포트 위쪽이면 아래로 flip).
3. **alt 입력**: 톱니 → Popover에서 alt 타이핑이 끊기지 않는다(포커스 유지). 입력 후 이미지 클릭 해제 → 다시 선택하면 값이 남아 있다.
4. **삭제 지연**: 이미지 삽입 → Ctrl+X → Ctrl+V(다른 위치) → 이미지가 정상 표시된다. 이미지 삭제 → Ctrl+Z → 정상 표시. 이미지 삭제 후 **저장** → R2/`post_images`에서 사라짐(`npx drizzle-kit studio`로 확인).
5. **썸네일**: 3~5MB 폰 사진 업로드 → 성공(압축 후 1MB 이하). 썸네일 교체 후 저장 → 이전 썸네일 행이 `post_images`에서 사라짐.
6. **본문 압축**: 5MB jpg 붙여넣기 → R2에 저장된 객체가 webp·1600px 이하.
7. **관리 목록**: 이미지만 올리고 저장 없이 이탈한 draft가 "(제목 없음)"으로 보이고 클릭 시 편집 페이지로 이동. 삭제 버튼으로 지울 수 있다.
8. **정렬 disabled 안내**: 기본 크기에서 정렬 버튼에 마우스를 올리면 사유 툴팁(title)이 보인다.

- [ ] **Step 3: plan 문서 상단에 완료 기록(수동 시나리오 결과 포함) 후 커밋, `develop`으로 PR (`--no-ff`)**

```bash
git add docs/superpowers/plans/2026-08-19-editor-image-handling.md
git commit -m "📝 docs: 에디터 이미지 처리 plan 완료 기록"
```
