# image-block-controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tiptap 에디터에서 본문 내 이미지를 네이버 블로그 스타일로 편집(사이즈 3프리셋·정렬 3가지·드래그 이동)할 수 있게 한다.

**Architecture:** 기본 `@tiptap/extension-image`를 `.extend()`로 확장해 `data-size`/`data-align` 속성을 추가하고 `draggable`을 켠다. 각 이미지는 `ReactNodeViewRenderer`가 렌더링하는 React 컴포넌트로, 선택 시 상단에 플로팅 툴바를 띄운다. 에디터·독자 페이지 모두 `prose.css`의 `[data-size]`/`[data-align]` 선택자로 동일 스타일을 적용한다.

**Tech Stack:** Tiptap v3 (`@tiptap/react`, `@tiptap/extension-image`), React 19, Tailwind v4, Vitest + Testing Library, Playwright.

**Spec:** [docs/superpowers/specs/2026-04-21-image-block-controls-design.md](../specs/2026-04-21-image-block-controls-design.md)

---

## 사전 준비

- [ ] **브랜치 생성** (현재 `develop`에서 분기)

```bash
git switch -c feature/image-block-controls
```

참고: Git Worktree 규칙(CLAUDE.md) — 작업 완료(merge 후) 시 worktree를 썼다면 반드시 제거. 직접 브랜치 전환으로 진행해도 무방.

---

## Task 1: 커스텀 Image extension — 속성 정의

`@tiptap/extension-image`를 `.extend()`해서 `size`, `align` 두 속성을 추가한다. 이 태스크에서는 extension만 정의하고 NodeView는 다음 태스크에서 붙인다.

**Files:**
- Create: `src/app/admin/posts/new/_components/_image-block/image-extension.ts`
- Create: `src/app/admin/posts/new/_components/_image-block/image-extension.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`image-extension.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { ImageBlock } from './image-extension';

function createEditor(content: string) {
  return new Editor({
    extensions: [StarterKit, ImageBlock],
    content,
  });
}

describe('ImageBlock extension', () => {
  it('data-size, data-align 속성이 있는 이미지를 파싱한다', () => {
    const editor = createEditor(
      '<p><img src="a.png" data-size="small" data-align="left" /></p>',
    );
    const html = editor.getHTML();
    expect(html).toContain('data-size="small"');
    expect(html).toContain('data-align="left"');
    expect(html).toContain('src="a.png"');
  });

  it('속성이 없는 기존 이미지는 기본값(medium/center)으로 직렬화된다', () => {
    const editor = createEditor('<p><img src="a.png" /></p>');
    const html = editor.getHTML();
    expect(html).toContain('data-size="medium"');
    expect(html).toContain('data-align="center"');
  });

  it('draggable 스펙이 true이다', () => {
    const editor = createEditor('<p></p>');
    const spec = editor.schema.nodes.image.spec;
    expect(spec.draggable).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm run test:run -- image-extension
```

Expected: `image-extension.ts`이 존재하지 않아 모듈 resolve 에러로 FAIL.

- [ ] **Step 3: 최소 구현**

`image-extension.ts`:

```typescript
import { Image } from '@tiptap/extension-image';

export type ImageSize = 'small' | 'medium' | 'full';
export type ImageAlign = 'left' | 'center' | 'right';

export const ImageBlock = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: 'medium' as ImageSize,
        parseHTML: (el) => (el.getAttribute('data-size') as ImageSize) ?? 'medium',
        renderHTML: (attrs) => ({ 'data-size': attrs.size ?? 'medium' }),
      },
      align: {
        default: 'center' as ImageAlign,
        parseHTML: (el) => (el.getAttribute('data-align') as ImageAlign) ?? 'center',
        renderHTML: (attrs) => ({ 'data-align': attrs.align ?? 'center' }),
      },
    };
  },
});
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npm run test:run -- image-extension
```

Expected: 3개 테스트 모두 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-extension.ts \
        src/app/admin/posts/new/_components/_image-block/image-extension.test.ts
git commit -m "feat: 이미지 블록 확장 - size/align 속성 추가"
```

---

## Task 2: 플로팅 툴바 컴포넌트

툴바는 순수 프레젠테이션 컴포넌트로 만들고, 명령은 props 콜백으로 받아 테스트를 쉽게 한다.

**Files:**
- Create: `src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx`
- Create: `src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`image-toolbar.test.tsx`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageToolbar } from './image-toolbar';

describe('ImageToolbar', () => {
  const baseProps = {
    size: 'medium' as const,
    align: 'center' as const,
    onSizeChange: vi.fn(),
    onAlignChange: vi.fn(),
    onDelete: vi.fn(),
  };

  it('정렬 3개, 사이즈 3개, 삭제 버튼을 렌더한다', () => {
    render(<ImageToolbar {...baseProps} />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가운데 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오른쪽 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '작게' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '중간' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '글 너비' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이미지 삭제' })).toBeInTheDocument();
  });

  it('사이즈 버튼 클릭 시 onSizeChange 호출', () => {
    const onSizeChange = vi.fn();
    render(<ImageToolbar {...baseProps} onSizeChange={onSizeChange} />);
    fireEvent.click(screen.getByRole('button', { name: '작게' }));
    expect(onSizeChange).toHaveBeenCalledWith('small');
  });

  it('정렬 버튼 클릭 시 onAlignChange 호출', () => {
    const onAlignChange = vi.fn();
    render(<ImageToolbar {...baseProps} onAlignChange={onAlignChange} />);
    fireEvent.click(screen.getByRole('button', { name: '오른쪽 정렬' }));
    expect(onAlignChange).toHaveBeenCalledWith('right');
  });

  it('삭제 버튼 클릭 시 onDelete 호출', () => {
    const onDelete = vi.fn();
    render(<ImageToolbar {...baseProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: '이미지 삭제' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('size=full 이면 정렬 버튼 3개 모두 disabled', () => {
    render(<ImageToolbar {...baseProps} size="full" />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '가운데 정렬' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '오른쪽 정렬' })).toBeDisabled();
  });

  it('현재 size에 해당하는 버튼은 aria-pressed=true', () => {
    render(<ImageToolbar {...baseProps} size="small" />);
    expect(screen.getByRole('button', { name: '작게' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '중간' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm run test:run -- image-toolbar
```

Expected: FAIL (모듈 없음).

- [ ] **Step 3: 최소 구현**

`image-toolbar.tsx`:

```typescript
'use client';

import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react';
import type { ImageAlign, ImageSize } from './image-extension';

type Props = {
  size: ImageSize;
  align: ImageAlign;
  onSizeChange: (size: ImageSize) => void;
  onAlignChange: (align: ImageAlign) => void;
  onDelete: () => void;
};

const sizeOptions: { value: ImageSize; label: string }[] = [
  { value: 'small', label: '작게' },
  { value: 'medium', label: '중간' },
  { value: 'full', label: '글 너비' },
];

const alignOptions: {
  value: ImageAlign;
  label: string;
  icon: typeof AlignLeft;
}[] = [
  { value: 'left', label: '왼쪽 정렬', icon: AlignLeft },
  { value: 'center', label: '가운데 정렬', icon: AlignCenter },
  { value: 'right', label: '오른쪽 정렬', icon: AlignRight },
];

export function ImageToolbar({
  size,
  align,
  onSizeChange,
  onAlignChange,
  onDelete,
}: Props) {
  const alignDisabled = size === 'full';

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-md"
      role="toolbar"
    >
      {alignOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={align === value}
          disabled={alignDisabled}
          onClick={() => onAlignChange(value)}
          className={`rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent ${
            align === value && !alignDisabled
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      {sizeOptions.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={size === value}
          onClick={() => onSizeChange(value)}
          className={`rounded px-2 py-1 text-xs hover:bg-accent ${
            size === value ? 'bg-primary text-primary-foreground' : ''
          }`}
        >
          {label}
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        aria-label="이미지 삭제"
        onClick={onDelete}
        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npm run test:run -- image-toolbar
```

Expected: 6개 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx \
        src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx
git commit -m "feat: 이미지 플로팅 툴바 컴포넌트"
```

---

## Task 3: NodeView — 이미지 + 선택 시 툴바

Tiptap `ReactNodeViewRenderer`가 렌더링할 React 컴포넌트. 선택 상태에서만 `ImageToolbar`를 띄운다.

**Files:**
- Create: `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx`

- [ ] **Step 1: 구현**

`image-node-view.tsx`:

```typescript
'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { ImageAlign, ImageSize } from './image-extension';
import { ImageToolbar } from './image-toolbar';

export function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const size = (node.attrs.size as ImageSize) ?? 'medium';
  const align = (node.attrs.align as ImageAlign) ?? 'center';
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) ?? '';

  return (
    <NodeViewWrapper
      as="figure"
      className="relative my-4"
      data-size={size}
      data-align={align}
    >
      {selected && (
        <div className="absolute -top-11 left-1/2 z-10 -translate-x-1/2">
          <ImageToolbar
            size={size}
            align={align}
            onSizeChange={(next) => updateAttributes({ size: next })}
            onAlignChange={(next) => updateAttributes({ align: next })}
            onDelete={() => deleteNode()}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        data-size={size}
        data-align={align}
        className={selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        draggable={false}
      />
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 2: extension에 NodeView 연결**

`image-extension.ts` 상단 import 추가 + `addNodeView` 메서드 추가:

```typescript
import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './image-node-view';

export type ImageSize = 'small' | 'medium' | 'full';
export type ImageAlign = 'left' | 'center' | 'right';

export const ImageBlock = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: 'medium' as ImageSize,
        parseHTML: (el) => (el.getAttribute('data-size') as ImageSize) ?? 'medium',
        renderHTML: (attrs) => ({ 'data-size': attrs.size ?? 'medium' }),
      },
      align: {
        default: 'center' as ImageAlign,
        parseHTML: (el) => (el.getAttribute('data-align') as ImageAlign) ?? 'center',
        renderHTML: (attrs) => ({ 'data-align': attrs.align ?? 'center' }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
```

- [ ] **Step 3: 속성 테스트 재실행** (NodeView는 별도 E2E로 검증)

```bash
npm run test:run -- image-extension
```

Expected: 3개 테스트 여전히 PASS (속성 로직은 변함없음).

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-node-view.tsx \
        src/app/admin/posts/new/_components/_image-block/image-extension.ts
git commit -m "feat: 이미지 NodeView - 선택 시 플로팅 툴바 표시"
```

---

## Task 4: 에디터에 ImageBlock 주입

기존 `Image` extension을 `ImageBlock`으로 교체한다.

**Files:**
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx`

- [ ] **Step 1: import 교체**

`wysiwyg-editor-action.tsx`의 6번째 줄 import 변경:

```typescript
// 변경 전
import { Image } from '@tiptap/extension-image';

// 변경 후
import { ImageBlock } from '../_components/_image-block/image-extension';
```

- [ ] **Step 2: extensions 배열에서 `Image`를 `ImageBlock`으로 교체**

`wysiwyg-editor-action.tsx` 45번째 줄 근처:

```typescript
      Link.configure({ openOnClick: false }),
      ImageBlock,
      Youtube.configure({
```

- [ ] **Step 3: 개발 서버 실행 후 수동 확인**

```bash
npm run dev
```

브라우저에서 `/admin/posts/new` 진입 → 이미지 업로드(드래그·붙여넣기) → 이미지 클릭 시 상단에 툴바가 뜨고, 사이즈·정렬 버튼이 동작하는지 확인. 데이터는 아직 CSS가 없어 시각적으로는 변화가 미미할 수 있음(HTML 속성만 변경되는지 개발자 도구로 확인).

- [ ] **Step 4: 타입 체크·린트**

```bash
npm run lint
```

Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx
git commit -m "feat: WYSIWYG 에디터에서 Image를 ImageBlock으로 교체"
```

---

## Task 5: CSS — prose.css에 사이즈·정렬 스타일 추가

에디터와 독자 페이지 양쪽에 적용되는 단일 CSS.

**Files:**
- Modify: `src/styles/prose.css`

- [ ] **Step 1: prose.css 하단에 이미지 블록 스타일 추가**

`prose.css`의 마지막 줄(`.dark .prose a { ... }`) 아래에 추가:

```css
/* ── 이미지 블록 (data-size / data-align) ── */
.prose figure[data-size],
.prose img[data-size] {
  display: block;
}
.prose figure[data-size="small"],
.prose img[data-size="small"] {
  width: 40%;
}
.prose figure[data-size="medium"],
.prose img[data-size="medium"] {
  width: 70%;
}
.prose figure[data-size="full"],
.prose img[data-size="full"] {
  width: 100%;
}
.prose figure[data-size] img {
  width: 100%;
  height: auto;
}

.prose figure[data-align="left"],
.prose img[data-align="left"] {
  margin-right: auto;
  margin-left: 0;
}
.prose figure[data-align="center"],
.prose img[data-align="center"] {
  margin-left: auto;
  margin-right: auto;
}
.prose figure[data-align="right"],
.prose img[data-align="right"] {
  margin-left: auto;
  margin-right: 0;
}

/* 에디터 내 선택된 이미지는 NodeView가 ring 클래스로 표시하지만,
   ProseMirror 노드 선택 시의 파란 outline은 제거 */
.ProseMirror .ProseMirror-selectednode {
  outline: none;
}

@media (max-width: 640px) {
  .prose figure[data-size],
  .prose img[data-size] {
    width: 100%;
  }
}
```

> **설명**: NodeView가 `<figure>`로 감싸므로 `figure[data-size]`와 원본 `img[data-size]`(저장된 HTML은 `<img>` 단독) 두 가지 경우 모두 동일 너비를 적용한다. 독자 페이지에서는 `<img>` 그대로 렌더링되므로 `img[data-size]`가 적중.

- [ ] **Step 2: 개발 서버로 수동 확인**

```bash
npm run dev
```

- `/admin/posts/new`에서 이미지 삽입 → 작게/중간/글너비 클릭 시 너비가 실제로 변하는지
- 왼쪽/가운데/오른쪽 정렬 시 위치가 변하는지
- 글 너비에서 정렬 버튼이 비활성(회색)되는지

- [ ] **Step 3: 커밋**

```bash
git add src/styles/prose.css
git commit -m "style: 이미지 블록 data-size/data-align CSS"
```

---

## Task 6: 드래그 이동 동작 확인

`draggable: true`는 이미 Task 1에서 설정됨. 실제로 문단 사이 이동이 작동하는지 검증만 수행.

**Files:** (수정 없음, 수동 확인)

- [ ] **Step 1: 개발 서버에서 이동 테스트**

```bash
npm run dev
```

- 글 작성 페이지에서 이미지 2개, 문단 여러 개 삽입
- 이미지를 마우스로 잡고 다른 문단 사이로 드래그
- 커서가 이동할 위치에 drop indicator(가로선)가 보이는지
- 드롭하면 해당 위치로 이미지가 이동하는지

- [ ] **Step 2: 저장 후 재진입 확인**

- 자동 저장된 글을 `/admin/posts` → 편집 진입 → 이동한 순서가 유지되는지
- 독자 페이지(`/posts/[slug]`)에서도 동일 순서로 보이는지

> 드래그 이동은 ProseMirror 스키마 레벨(`draggable: true`)로 처리되어 추가 코드 없음. 동작하지 않으면 Task 1의 `draggable: true` 설정을 먼저 확인.

- [ ] **Step 3: 검증 결과 기록** (실패 시 이슈 해결 후 별도 커밋)

동작 확인 후 별도 커밋 없이 다음 태스크로 진행.

---

## Task 7: 기존 에디터 UX 회귀 테스트

기존 에디터 기능(다른 extension들)이 깨지지 않았는지 확인.

**Files:** (수정 없음, 수동 확인)

- [ ] **Step 1: 전체 테스트 스위트**

```bash
npm run test:run
```

Expected: 기존 테스트 전부 PASS + 새 테스트 PASS.

- [ ] **Step 2: 수동 스모크 테스트**

`/admin/posts/new`에서:
- 제목 입력 → 카테고리·태그 선택 → 썸네일 업로드
- 본문에 텍스트·볼드·리스트·링크·유튜브·표·이미지 추가
- 이미지 편집(사이즈/정렬/이동/삭제)
- 초안 저장 → `/admin/posts`에서 다시 열기 → 내용 유지 확인
- 발행 → 독자 페이지(`/posts/[slug]`)에서 이미지 사이즈·정렬이 그대로 보이는지

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: 빌드 검증**

```bash
npm run build
```

Expected: 성공.

- [ ] **Step 5: lint·format 확인**

```bash
npm run lint
npm run format
```

Expected: 에러/변경사항 없음(또는 format 수정 반영).

- [ ] **Step 6: 회귀 이슈 수정이 있었다면 커밋**

만약 수정이 있었다면:

```bash
git add <수정 파일>
git commit -m "fix: <내용>"
```

수정 없으면 커밋 생략.

---

## Task 8: Playwright E2E (선택)

에디터 페이지는 Clerk 로그인이 필요해 인증 셋업이 복잡하므로, 이 태스크는 **독자 페이지(`/posts/[slug]`)에서 저장된 이미지 속성이 올바르게 렌더링되는지**만 검증한다. 시드·기존 글로 대체.

**Files:**
- Modify: `scripts/seed.ts` (샘플 글에 속성 있는 이미지 HTML 포함)
- Create: `e2e/post-image-block.spec.ts`

- [ ] **Step 1: seed.ts 검토**

`scripts/seed.ts`에 이미 콘텐츠가 있다면 그중 하나의 HTML에 아래 같은 마크업을 포함시킨다(있으면 skip):

```html
<p>본문 중간 이미지 예시.</p>
<img src="https://picsum.photos/800/450" alt="sample" data-size="small" data-align="left" />
<p>다음 문단.</p>
```

> 이미 이미지가 없는 시드라면 샘플 글 하나만 수정. 이 Task는 "기존 시드 글에 최소 1장 속성 이미지 포함" 정도의 변경.

- [ ] **Step 2: E2E 테스트 작성**

`e2e/post-image-block.spec.ts`:

```typescript
import { expect, test } from '@playwright/test';

test.describe('독자 페이지 이미지 블록', () => {
  test('속성이 있는 이미지는 data-size, data-align이 유지된다', async ({
    page,
  }) => {
    // 이미지가 포함된 시드 글의 slug (seed.ts에서 확인 후 교체)
    await page.goto('/posts/첫-번째-글');

    const img = page.locator('img[data-size]').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('data-size', /small|medium|full/);
    await expect(img).toHaveAttribute('data-align', /left|center|right/);
  });
});
```

> slug 값은 실제 시드 글에 맞춰 조정. 시드에 한글 slug를 쓰면 encodeURI 필요할 수 있음.

- [ ] **Step 3: E2E 실행**

```bash
npx tsx --env-file=.env.local scripts/seed.ts  # 시드 갱신
npm run test:e2e -- post-image-block
```

Expected: PASS.

- [ ] **Step 4: 커밋**

```bash
git add e2e/post-image-block.spec.ts scripts/seed.ts
git commit -m "test: 독자 페이지 이미지 블록 E2E"
```

> **Skip 조건**: 시드에 이미지 포함이 어렵거나 E2E 인프라가 불안정하면 이 태스크 전체 생략 가능. Task 7의 수동 스모크로 충분히 검증됨.

---

## Task 9: PR 생성

- [ ] **Step 1: 브랜치 푸시**

```bash
git push -u origin feature/image-block-controls
```

- [ ] **Step 2: PR 생성 (develop 대상)**

```bash
gh pr create --base develop --title "feat: 이미지 블록 편집 기능 (사이즈·정렬·드래그)" --body "$(cat <<'EOF'
## Summary
- 본문 내 이미지에 사이즈 프리셋 3단계(작게/중간/글너비) 추가
- 정렬 3가지(왼쪽/가운데/오른쪽) 추가. 글너비 시 비활성
- 이미지 노드 드래그 이동 활성화
- 이미지 선택 시 플로팅 툴바(네이버 스타일)
- 독자 페이지도 동일 속성으로 렌더링

Spec: docs/superpowers/specs/2026-04-21-image-block-controls-design.md
Plan: docs/superpowers/plans/2026-04-21-image-block-controls.md

## Test plan
- [ ] 에디터에서 이미지 업로드 → 툴바 표시
- [ ] 사이즈 3단계 전환 확인
- [ ] 정렬 3가지 전환 확인, 글너비에서 비활성 확인
- [ ] 이미지 드래그로 문단 사이 이동
- [ ] 저장 후 재진입 시 속성 유지
- [ ] 독자 페이지(`/posts/[slug]`)에서 속성 유지
- [ ] 기존 이미지(속성 없음)는 기본값(medium/center)으로 렌더
- [ ] 모바일 뷰(640px 이하)에서 모두 100%로 표시

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: PR URL 공유 후 종료**

---

## 참고

- 모든 신규 파일은 `src/app/admin/posts/new/_components/_image-block/` 하위. `_components` 규칙(CLAUDE.md `page-folder.md`) 준수.
- 컴포넌트 파일명은 kebab-case, 컴포넌트 함수명은 PascalCase (`coding-conventions.md`).
- `lucide-react` 아이콘은 `className`이 아닌 `size` prop 사용 (`coding-conventions.md`).
- `console.log` 금지.
