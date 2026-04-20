# 에디터 이미지 드래그/붙여넣기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TipTap 에디터에서 이미지를 드래그 앤 드롭 또는 클립보드 붙여넣기로 삽입할 수 있도록 한다.

**Architecture:** TipTap의 `editorProps`에 `handleDrop`과 `handlePaste` 핸들러를 추가하여, 이미지 파일이 감지되면 기존 `uploadImage` Server Action을 호출하고 결과 URL을 에디터에 삽입한다.

**Tech Stack:** TipTap (`@tiptap/react`), `uploadImage` Server Action (post ID 기반, `plan.md` 구현 선행 필요)

**선행 조건:** `.claude/plan.md`의 Task 1~3이 완료되어야 함 (`uploadImage`가 postId/type을 받는 새 시그니처)

---

## File Structure

| 파일 | 역할 | 생성/수정 |
|------|------|-----------|
| `src/app/admin/posts/new/_hooks/use-editor-image-upload.ts` | 드래그/붙여넣기 이미지 업로드 로직 hook | 생성 |
| `src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx` | `editorProps`에 handleDrop/handlePaste 추가 | 수정 |

---

### Task 1: 이미지 업로드 hook 생성

**Files:**
- Create: `src/app/admin/posts/new/_hooks/use-editor-image-upload.ts`

- [ ] **Step 1: hook 작성**

```typescript
import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { uploadImage } from '../_components/_image-upload/_services/upload-image';
import { useNewPostStore } from '../_store';

export function useEditorImageUpload() {
  const postId = useNewPostStore((s) => s.postId);
  const setPostId = useNewPostStore((s) => s.setPostId);

  const uploadAndInsert = useCallback(
    async (editor: Editor, file: File) => {
      if (!file.type.startsWith('image/')) return false;

      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return true;
      }

      const formData = new FormData();
      formData.append('file', file);

      const currentPostId = useNewPostStore.getState().postId;
      const result = await uploadImage(formData, currentPostId, 'content');

      if (result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
        if (result.postId && !currentPostId) {
          setPostId(result.postId);
        }
      } else if (result.error) {
        toast.error(result.error);
      }

      return true;
    },
    [setPostId],
  );

  return { uploadAndInsert };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/admin/posts/new/_hooks/use-editor-image-upload.ts
git commit -m "feat: 에디터 이미지 드래그/붙여넣기용 upload hook 생성"
```

---

### Task 2: 에디터에 handleDrop/handlePaste 추가

**Files:**
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx`

- [ ] **Step 1: hook import 및 editorProps 수정**

`wysiwyg-editor-action.tsx`에서 hook을 import하고, `useEditor`의 `editorProps`에 `handleDrop`과 `handlePaste`를 추가:

```typescript
import { useEditorImageUpload } from '../_hooks/use-editor-image-upload';
```

컴포넌트 내부에서:

```typescript
const { uploadAndInsert } = useEditorImageUpload();
```

`useEditor` 호출의 `editorProps`를 아래로 변경:

```typescript
editorProps: {
  attributes: {
    class:
      'prose prose-neutral dark:prose-invert max-w-none min-h-[500px] outline-none',
  },
  handleDrop: (view, event, _slice, moved) => {
    if (moved || !event.dataTransfer?.files.length) return false;
    const file = event.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) return false;
    event.preventDefault();
    uploadAndInsert(view.state.tr ? editor! : editor!, file);
    return true;
  },
  handlePaste: (_view, event) => {
    const files = event.clipboardData?.files;
    if (!files?.length) return false;
    const file = files[0];
    if (!file?.type.startsWith('image/')) return false;
    event.preventDefault();
    if (editor) {
      uploadAndInsert(editor, file);
    }
    return true;
  },
},
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx
git commit -m "feat: 에디터에 이미지 드래그/붙여넣기 지원 추가"
```

---

### Task 3: 수동 검증

- [ ] **Step 1: 드래그 앤 드롭 테스트**

1. `/admin/posts/new`에서 에디터 열기
2. 파일 탐색기에서 이미지 파일을 에디터 영역에 드래그
3. 이미지가 업로드되고 에디터에 삽입되는지 확인

- [ ] **Step 2: 붙여넣기 테스트**

1. 스크린샷을 찍거나 이미지를 클립보드에 복사
2. 에디터에서 Cmd+V (붙여넣기)
3. 이미지가 업로드되고 에디터에 삽입되는지 확인

- [ ] **Step 3: 기존 기능 회귀 확인**

1. 텍스트 복사/붙여넣기가 정상 동작하는지 확인 (이미지가 아닌 경우 기본 동작)
2. 기존 이미지 다이얼로그 업로드가 여전히 동작하는지 확인
