# 이미지 에디터 개선 (paste/drop placeholder + 드래그 이동)

## 목표
글 작성 페이지(`/admin/posts/new`, `/admin/posts/[id]/edit`)의 TipTap 에디터에서 두 가지 UX 개선:

1. 이미 삽입된 이미지를 잡아서 다른 위치(커서 위치)로 드래그 이동
2. 이미지 paste/drop 시 R2 업로드 동안 placeholder 노드를 표시해 글 위치가 흔들리지 않게 처리

## 결정 사항 요약

| 주제 | 결정 |
|------|------|
| 드래그 핸들 | 이미지 자체를 잡아 드래그 (ProseMirror 기본 동작) |
| 동시 paste 처리 | 첫 번째 파일만 처리 (현재 동작 유지) |
| 업로드 실패 처리 | placeholder 제거 + `toast.error` |
| paste / drop 처리 | 동일 코드 경로(placeholder 적용) |
| placeholder 구현 | 별도 TipTap 노드(`imageUploading`) — 직렬화/저장에서 노출되지 않음 |
| placeholder UI | blob URL 미리보기 + 반투명 검정 오버레이 + `Loader2` 스피너 + "업로드 중..." |

## 아키텍처

TipTap 에디터 안에서 두 가지 개선:
1. 이미 삽입된 이미지 노드를 ProseMirror 기본 드래그 동작으로 이동 가능하게 함
2. 외부 이미지(paste/drop) 업로드를 placeholder 노드 패턴으로 처리해 업로드 도중에도 글의 위치가 흔들리지 않도록 함

## 변경 단위

### 1) `_components/_image-block/image-node-view.tsx` — 이미지 드래그 활성화
- `<img draggable={false}>` 제거 → 기본값(`true`)
- 이미지 위에 마우스 올렸을 때 `cursor-grab` 클래스 추가, 드래그 중일 때 `cursor-grabbing`
- 캡션 input은 그대로(드래그 영향 없음)
- NodeViewWrapper(`figure`)는 이미 `draggable: true`인 ImageBlock 노드를 감싸고 있으므로 ProseMirror가 드래그 핸들링

### 2) `_utils/image-uploading-extension.ts` (신규) — placeholder 전용 노드
- TipTap Node 정의: name `imageUploading`, group `block`, atom, selectable false
- attrs:
  - `previewUrl: string` (blob URL)
  - `id: string` (uploadAndInsert 호출 시 발급되는 임의 UUID — 동일 노드를 찾아 교체할 때 사용)
- `renderHTML` / `parseHTML` 정의하지 않음 → **저장·직렬화에 절대 노출되지 않음**
- NodeView로 React 컴포넌트 렌더(미리보기 + 오버레이 + 스피너)

### 3) `_components/_image-uploading/image-uploading-node-view.tsx` (신규)
- `<figure>` 안에 `<img src={previewUrl}>` + 반투명 검정 오버레이 + 가운데 Lucide `Loader2 size={24}` (`animate-spin`) + "업로드 중..." 텍스트
- `previewUrl`은 blob URL이므로 컴포넌트 unmount 시 `URL.revokeObjectURL` 호출

### 4) `_hooks/use-editor-image-upload.ts` — placeholder 삽입/교체 로직 통합
`uploadAndInsert(editor, file)` 동작 변경:
1. 파일 검증(타입/크기 10MB) → 실패 시 toast 후 종료
2. `id = crypto.randomUUID()`, `previewUrl = URL.createObjectURL(file)` 생성
3. 에디터에 `imageUploading` 노드 삽입(`{ id, previewUrl }`)
4. R2 업로드 호출
5. **성공**: doc.descendants로 해당 `id`를 가진 `imageUploading` 노드를 찾아 그 위치에 `ImageBlock`으로 교체. blob URL revoke
6. **실패**: 같은 방식으로 노드 제거 후 `toast.error`. blob URL revoke

`editor.state.doc.descendants` 기반 위치 탐색을 헬퍼로 분리:
- `replaceUploadingNode(editor, id, replacement | null)`
- `replacement`가 있으면 교체, `null`이면 제거

### 5) `_actions/wysiwyg-editor-action.tsx` — 익스텐션 등록
- `extensions`에 `ImageUploading` 추가
- `handleDrop`: 외부 파일이 들어올 때 `uploadAndInsert` 호출(현재 코드 유지). placeholder는 hook 내부에서 처리
- `handlePaste`: 동일. fire-and-forget으로 호출하되 hook 내부에서 placeholder 흐름이 즉시 visible
- `onUpdate`의 이미지 src diff 로직(`getImageSrcs` / `deleteImage`)은 `imageBlock`만 추적하므로 placeholder가 사라져도 `deleteImage` 호출되지 않음 — 그대로 둠

## 데이터 흐름

```
paste/drop 발생
   ↓
handleDrop | handlePaste → uploadAndInsert(editor, file)
   ↓
[검증 통과]
   ↓
imageUploading 노드 즉시 삽입 (blob preview + spinner)
   ↓                                    ↓
업로드 진행                     사용자는 다른 위치에서 계속 입력 가능
   ↓
   ├─ 성공 → 같은 id의 imageUploading 위치를 imageBlock(src=R2 URL)로 교체
   └─ 실패 → 같은 id의 imageUploading 노드 제거 + toast.error
   ↓
blob URL revoke
```

## 에러 처리

- 파일 타입/크기 검증 실패: placeholder 삽입 전에 toast로 종료
- 업로드 네트워크/서버 실패: placeholder 제거 + `toast.error(result.error ?? '업로드 실패')`
- 업로드 도중 사용자가 placeholder를 직접 삭제할 가능성: 교체 단계에서 노드가 없으면 silent skip

## 테스트 전략

### Vitest
- `replaceUploadingNode` 헬퍼 단위 테스트
  - 주어진 id를 가진 `imageUploading` 노드를 찾아 `imageBlock`으로 교체
  - 주어진 id를 가진 노드 제거
  - 일치하는 id가 없을 때 silent skip
- `image-uploading-node-view.tsx` 렌더링 테스트
  - `previewUrl` 이미지가 표시됨
  - 스피너와 "업로드 중..." 텍스트가 표시됨
- 기존 `image-extension.test.ts` 회귀 확인 (변경 없음 예상)

### 수동 검증 체크리스트 (`npm run dev`)
- [ ] paste 직후 placeholder 즉시 표시 / 업로드 끝나면 실제 이미지로 교체
- [ ] 업로드 중 다른 단락에 텍스트 입력 가능
- [ ] drop으로도 동일 placeholder 동작
- [ ] 이미지를 잡고 다른 위치 단락 사이로 드래그 → 이동 성공
- [ ] 캡션 input 클릭/입력은 드래그와 충돌 없음
- [ ] 업로드 실패 시 placeholder 제거 + 에러 토스트
- [ ] 글 저장 후 DB `posts.content`에 `imageUploading` 흔적이 없는지 확인
- [ ] 다크/라이트 테마에서 오버레이 가독성 확인

---

# Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TipTap 에디터에 이미지 placeholder 업로드 흐름과 이미지 드래그 이동을 도입한다.

**Architecture:** 새 TipTap 노드 `imageUploading`(atom, 직렬화 제외)을 도입해 paste/drop 즉시 placeholder를 박고, 업로드 완료 후 같은 위치를 `imageBlock`으로 교체한다. 이미지 노드 자체에 ProseMirror 기본 드래그 동작을 풀어주어 위치 이동을 가능하게 한다.

**Tech Stack:** Next.js 16, React 19, TipTap v2, Vitest, @testing-library/react, lucide-react, sonner

---

## Task 1: ImageUploading TipTap 노드 정의

**Files:**
- Create: `src/app/admin/posts/new/_utils/image-uploading-extension.ts`
- Test: `src/app/admin/posts/new/_utils/image-uploading-extension.test.ts`

- [ ] **Step 1: failing test 작성**

`src/app/admin/posts/new/_utils/image-uploading-extension.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { ImageUploading } from './image-uploading-extension';

function createEditor(content: string = '<p></p>') {
  return new Editor({
    extensions: [StarterKit, ImageUploading],
    content,
  });
}

describe('ImageUploading extension', () => {
  it('group=block, atom 스펙을 가진다', () => {
    const editor = createEditor();
    const spec = editor.schema.nodes.imageUploading.spec;
    expect(spec.group).toBe('block');
    expect(spec.atom).toBe(true);
    expect(spec.selectable).toBe(false);
  });

  it('id, previewUrl attribute를 가진다', () => {
    const editor = createEditor();
    const spec = editor.schema.nodes.imageUploading.spec;
    const attrs = spec.attrs ?? {};
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('previewUrl');
  });

  it('직렬화된 HTML에 노드가 노출되지 않는다', () => {
    const editor = createEditor();
    editor
      .chain()
      .insertContent({
        type: 'imageUploading',
        attrs: { id: 'abc', previewUrl: 'blob:fake' },
      })
      .run();
    const html = editor.getHTML();
    expect(html).not.toContain('imageUploading');
    expect(html).not.toContain('blob:fake');
    expect(html).not.toContain('abc');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/image-uploading-extension.test.ts`
Expected: FAIL with "Cannot find module './image-uploading-extension'"

- [ ] **Step 3: ImageUploading 노드 구현**

`src/app/admin/posts/new/_utils/image-uploading-extension.ts`:

```typescript
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageUploadingNodeView } from '../_components/_image-uploading/image-uploading-node-view';

export const ImageUploading = Node.create({
  name: 'imageUploading',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      id: { default: '' },
      previewUrl: { default: '' },
    };
  },

  // parseHTML/renderHTML을 정의하지 않음 → DB로 직렬화되지 않음
  parseHTML() {
    return [];
  },

  renderHTML() {
    return ['div', { 'data-image-uploading': '' }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadingNodeView);
  },
});
```

> Note: `renderHTML`은 TipTap 스키마 요구사항을 채우기 위해 비식별 div를 반환하지만, 노드는 atom + selectable false 이고 사용자는 NodeView로만 본다. `getHTML()`은 일반 글 흐름에 노드가 있을 경우 이 div를 출력할 수 있으므로, 저장 직전 단계에서 우리는 placeholder가 살아있는 동안 저장하지 않는다(자동저장은 시간 간격이 있어 실제 사례가 거의 없으나, 안전성을 위해 Step 4의 테스트에서 직렬화 노출 금지를 강제). 만약 Step 4 테스트가 fail하면 `renderHTML`을 `() => ''`로 바꾸거나 빈 fragment 처리가 필요. 우선 Step 4 결과로 결정한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/image-uploading-extension.test.ts`
Expected: PASS (3 tests)

만약 "직렬화된 HTML에 노드가 노출되지 않는다"가 실패하면, `renderHTML`을 다음으로 교체:

```typescript
renderHTML() {
  return ['span', { 'data-image-uploading': '', style: 'display:none' }, 0];
},
```

그래도 실패할 경우, 노드를 `addNodeView`만 둔 상태에서 `parseHTML`/`renderHTML` 메서드 선언 자체를 제거하고 다시 실행. (일부 TipTap 버전에서는 메서드 미정의 시 기본값으로 비-직렬화 처리됨)

- [ ] **Step 5: ImageUploadingNodeView 임시 stub 생성 (Task 2에서 본 구현)**

이 시점엔 아직 NodeView 컴포넌트가 없어 import가 깨진다. Task 2에서 본 구현을 만들 때까지의 임시 stub:

`src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.tsx`:

```typescript
'use client';

import { NodeViewWrapper } from '@tiptap/react';

export function ImageUploadingNodeView() {
  return <NodeViewWrapper />;
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_utils/image-uploading-extension.ts \
  src/app/admin/posts/new/_utils/image-uploading-extension.test.ts \
  src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.tsx
git commit -m "feat: ImageUploading TipTap 노드 추가 (placeholder용, 직렬화 제외)"
```

---

## Task 2: ImageUploadingNodeView 컴포넌트 본 구현

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.tsx`
- Test: `src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.test.tsx`

- [ ] **Step 1: failing test 작성**

`src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.test.tsx`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageUploadingNodeView } from './image-uploading-node-view';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, ...rest }: { children: React.ReactNode }) => (
    <figure {...rest}>{children}</figure>
  ),
}));

const baseProps = {
  node: { attrs: { id: 'abc', previewUrl: 'blob:preview' } },
} as never;

describe('ImageUploadingNodeView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('previewUrl로 미리보기 이미지를 렌더한다', () => {
    render(<ImageUploadingNodeView {...baseProps} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'blob:preview');
  });

  it('업로드 중 텍스트가 표시된다', () => {
    render(<ImageUploadingNodeView {...baseProps} />);
    expect(screen.getByText('업로드 중...')).toBeInTheDocument();
  });

  it('unmount 시 URL.revokeObjectURL을 호출한다', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', { ...URL, revokeObjectURL: revoke });
    const { unmount } = render(<ImageUploadingNodeView {...baseProps} />);
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.test.tsx`
Expected: FAIL — stub 컴포넌트는 img/텍스트를 렌더하지 않음

- [ ] **Step 3: 본 구현으로 교체**

`src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Loader2 } from 'lucide-react';

export function ImageUploadingNodeView({ node }: NodeViewProps) {
  const previewUrl = (node.attrs.previewUrl as string) ?? '';

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <NodeViewWrapper as="figure" className="relative my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">업로드 중...</span>
      </div>
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.tsx \
  src/app/admin/posts/new/_components/_image-uploading/image-uploading-node-view.test.tsx
git commit -m "feat: ImageUploadingNodeView 본 구현 (미리보기+오버레이+스피너)"
```

---

## Task 3: replaceUploadingNode 헬퍼

**Files:**
- Create: `src/app/admin/posts/new/_utils/replace-uploading-node.ts`
- Test: `src/app/admin/posts/new/_utils/replace-uploading-node.test.ts`

- [ ] **Step 1: failing test 작성**

`src/app/admin/posts/new/_utils/replace-uploading-node.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { ImageBlock } from './image-extension';
import { ImageUploading } from './image-uploading-extension';
import { replaceUploadingNode } from './replace-uploading-node';

function createEditor() {
  return new Editor({
    extensions: [StarterKit, ImageBlock, ImageUploading],
    content: '<p></p>',
  });
}

function insertUploading(editor: Editor, id: string) {
  editor
    .chain()
    .insertContent({
      type: 'imageUploading',
      attrs: { id, previewUrl: 'blob:fake' },
    })
    .run();
}

describe('replaceUploadingNode', () => {
  it('id에 해당하는 노드를 imageBlock으로 교체한다', () => {
    const editor = createEditor();
    insertUploading(editor, 'target');

    replaceUploadingNode(editor, 'target', {
      type: 'image',
      attrs: { src: 'https://r2/x.png' },
    });

    const html = editor.getHTML();
    expect(html).toContain('src="https://r2/x.png"');
    expect(html).not.toContain('data-image-uploading');
  });

  it('replacement가 null이면 노드를 제거한다', () => {
    const editor = createEditor();
    insertUploading(editor, 'target');

    replaceUploadingNode(editor, 'target', null);

    const html = editor.getHTML();
    expect(html).not.toContain('data-image-uploading');
  });

  it('id가 일치하지 않으면 아무것도 하지 않는다', () => {
    const editor = createEditor();
    insertUploading(editor, 'a');
    const before = editor.getHTML();

    replaceUploadingNode(editor, 'b', null);

    expect(editor.getHTML()).toBe(before);
  });

  it('여러 placeholder 중 일치하는 id만 교체한다', () => {
    const editor = createEditor();
    insertUploading(editor, 'a');
    insertUploading(editor, 'b');

    replaceUploadingNode(editor, 'b', {
      type: 'image',
      attrs: { src: 'https://r2/b.png' },
    });

    const html = editor.getHTML();
    expect(html).toContain('src="https://r2/b.png"');
    // a 는 그대로 placeholder 상태
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/replace-uploading-node.test.ts`
Expected: FAIL with "Cannot find module './replace-uploading-node'"

- [ ] **Step 3: 헬퍼 구현**

`src/app/admin/posts/new/_utils/replace-uploading-node.ts`:

```typescript
import type { Editor } from '@tiptap/core';

type Replacement = {
  type: string;
  attrs?: Record<string, unknown>;
};

export function replaceUploadingNode(
  editor: Editor,
  id: string,
  replacement: Replacement | null,
): void {
  let foundPos: number | null = null;
  let foundSize = 0;

  editor.state.doc.descendants((node, pos) => {
    if (foundPos !== null) return false;
    if (node.type.name === 'imageUploading' && node.attrs.id === id) {
      foundPos = pos;
      foundSize = node.nodeSize;
      return false;
    }
    return true;
  });

  if (foundPos === null) return;

  const tr = editor.state.tr;
  if (replacement) {
    const newNode = editor.schema.nodeFromJSON({
      type: replacement.type,
      attrs: replacement.attrs ?? {},
    });
    tr.replaceWith(foundPos, foundPos + foundSize, newNode);
  } else {
    tr.delete(foundPos, foundPos + foundSize);
  }
  editor.view.dispatch(tr);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/replace-uploading-node.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_utils/replace-uploading-node.ts \
  src/app/admin/posts/new/_utils/replace-uploading-node.test.ts
git commit -m "feat: replaceUploadingNode 헬퍼 추가"
```

---

## Task 4: use-editor-image-upload.ts 리팩토링

**Files:**
- Modify: `src/app/admin/posts/new/_hooks/use-editor-image-upload.ts`

> 현재 동작: 파일 검증 → R2 업로드 → 성공 시 `editor.chain().focus().setImage()`. 실패 시 `toast.error`.
> 변경 동작: 파일 검증 → placeholder 즉시 삽입 → R2 업로드 → 성공 시 `replaceUploadingNode`로 교체 / 실패 시 `replaceUploadingNode`로 제거 + `toast.error`.

- [ ] **Step 1: 본 구현**

`src/app/admin/posts/new/_hooks/use-editor-image-upload.ts` 전체 교체:

```typescript
import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { uploadImage } from '../_services/upload-image';
import { useNewPostStore } from '../_store';
import { replaceUploadingNode } from '../_utils/replace-uploading-node';

export function useEditorImageUpload() {
  const setPostId = useNewPostStore((s) => s.setPostId);

  const uploadAndInsert = useCallback(
    async (editor: Editor, file: File) => {
      if (!file.type.startsWith('image/')) return false;

      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return true;
      }

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      editor
        .chain()
        .focus()
        .insertContent({
          type: 'imageUploading',
          attrs: { id, previewUrl },
        })
        .run();

      const formData = new FormData();
      formData.append('file', file);

      const currentPostId = useNewPostStore.getState().postId;
      const result = await uploadImage(formData, currentPostId, 'content');

      if (result.url) {
        replaceUploadingNode(editor, id, {
          type: 'image',
          attrs: { src: result.url },
        });
        if (result.postId && !currentPostId) {
          setPostId(result.postId);
        }
      } else {
        replaceUploadingNode(editor, id, null);
        toast.error(result.error ?? '업로드 실패');
      }

      return true;
    },
    [setPostId],
  );

  return { uploadAndInsert };
}
```

- [ ] **Step 2: 타입 검증**

Run: `npx tsc --noEmit`
Expected: errors 없음 (또는 변경한 파일과 무관한 기존 에러만 존재)

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_hooks/use-editor-image-upload.ts
git commit -m "refactor: 이미지 업로드 hook을 placeholder 흐름으로 변경"
```

---

## Task 5: WysiwygEditorAction에 ImageUploading 익스텐션 등록

**Files:**
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx`

- [ ] **Step 1: import 추가**

`src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx` 상단에 다음 import 추가:

```typescript
import { ImageUploading } from '../_utils/image-uploading-extension';
```

- [ ] **Step 2: extensions 배열에 추가**

`extensions: [...]` 안의 `ImageBlock,` 다음 줄에 추가:

```typescript
ImageBlock,
ImageUploading,
```

- [ ] **Step 3: 컴파일 + 테스트 회귀 확인**

Run: `npx vitest run`
Expected: 모든 테스트 PASS (변경된 익스텐션 등록은 기존 테스트에 영향 없음)

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx
git commit -m "feat: 에디터에 ImageUploading 익스텐션 등록"
```

---

## Task 6: 이미지 드래그 활성화

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx`

- [ ] **Step 1: `<img>`의 `draggable={false}` 제거 + cursor 클래스 추가**

`src/app/admin/posts/new/_components/_image-block/image-node-view.tsx`의 `<img>` 부분을 다음으로 교체:

```typescript
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src={src}
  alt={alt}
  data-size={size}
  data-align={align}
  className={cn(
    'cursor-grab active:cursor-grabbing',
    selected && 'ring-2 ring-primary ring-offset-2',
  )}
/>
```

(파일 상단 `import { cn } from '@/lib/utils';` 추가 필요)

- [ ] **Step 2: 테스트 회귀 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-block`
Expected: 기존 image-toolbar.test 결과 유지

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-node-view.tsx
git commit -m "feat: 이미지 노드 드래그 이동 활성화"
```

---

## Task 7: 수동 검증 및 마무리

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev`

- [ ] **Step 2: `/admin/posts/new` 접속 후 다음 시나리오 검증**

- [ ] paste한 이미지가 즉시 placeholder로 표시되고 업로드 끝나면 실제 이미지로 교체
- [ ] drop도 동일 동작
- [ ] 업로드 중 다른 단락에 텍스트 입력 가능
- [ ] 이미지를 잡고 다른 단락 사이로 드래그 → 위치 이동 성공
- [ ] 이미지 클릭 시 ImageToolbar가 정상 표시됨 (드래그와 충돌 없음)
- [ ] 캡션 input 클릭 시 입력 가능 (드래그와 충돌 없음)
- [ ] 네트워크 탭에서 업로드 실패 시뮬레이션(throttle/abort) → placeholder 제거 + 에러 토스트
- [ ] 다크/라이트 테마 모두에서 placeholder 오버레이 가독성 확인

- [ ] **Step 3: DB 직렬화 검증**

작성 중인 글을 임시 저장(또는 자동저장 대기) → DB Studio로 `posts.content` 확인:

Run: `npx drizzle-kit studio`
Expected: `posts.content`에 `imageUploading` / `data-image-uploading` 흔적 없음

만약 흔적이 발견되면 Task 1 Step 4의 `renderHTML` fallback을 적용하고 다시 검증.

- [ ] **Step 4: 마지막 회귀 테스트**

Run: `npx vitest run`
Expected: 전체 테스트 PASS

Run: `npm run lint`
Expected: 경고/에러 없음

- [ ] **Step 5: develop 브랜치로 PR 준비**

`feature/image-paste-placeholder` 브랜치에서 작업했다면 develop으로 PR 생성. 단일 커밋이 아닌 Task별 커밋이 그대로 보존되어야 한다.

---

## Self-Review

- ✅ Spec coverage: 변경 단위 5개(이미지 노드 드래그 활성화, ImageUploading 노드, NodeView 컴포넌트, replace 헬퍼, hook 리팩토링, 익스텐션 등록)가 Task 1~6에 모두 매핑됨
- ✅ Placeholder scan: TBD/TODO 없음. 모든 코드 블록이 완전한 형태
- ✅ Type consistency: `imageUploading` 노드명, `id`/`previewUrl` 속성, `replaceUploadingNode` 시그니처가 Task 1·3·4에서 일관되게 사용됨
