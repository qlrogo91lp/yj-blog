# Image Caption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WYSIWYG 에디터의 이미지 블록에 캡션 입력 기능을 추가하고, 블로그 글 상세 페이지에서 `<figcaption>`으로 렌더링한다.

**Architecture:** TipTap `ImageBlock` 확장에 `caption` 속성을 추가해 `data-caption` 어트리뷰트로 직렬화한다. 에디터 NodeView에서 선택 시 얇은 밑줄 스타일 `<input>`으로 캡션을 편집할 수 있게 한다. 블로그 렌더링(`htmlToHtmlWithToc`) 단계에서 rehype 플러그인이 `<p><img data-caption="..."></p>`를 `<figure><img><figcaption>...</figcaption></figure>`로 변환한다.

**Tech Stack:** TipTap (ProseMirror), React, rehype (unist-util-visit), Tailwind CSS v4

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `src/app/admin/posts/new/_components/_image-block/image-extension.ts` | 수정 — `caption` 속성 추가 |
| `src/app/admin/posts/new/_components/_image-block/image-extension.test.ts` | 수정 — caption 파싱·직렬화 테스트 추가 |
| `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx` | 수정 — 캡션 `<input>` UI 추가 |
| `src/lib/markdown.ts` | 수정 — `rehypeImageCaption` 플러그인 추가, `htmlToHtmlWithToc`에 적용 |
| `src/lib/markdown.test.ts` | 신규 — rehype 플러그인 동작 검증 |
| `src/styles/prose.css` | 수정 — `figcaption` 스타일 추가 |

---

## Task 1: ImageBlock extension에 caption 속성 추가

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-extension.ts`
- Modify: `src/app/admin/posts/new/_components/_image-block/image-extension.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`image-extension.test.ts` 파일 끝 `describe` 블록 안에 추가:

```typescript
it('data-caption 속성이 있는 이미지를 파싱하고 직렬화한다', () => {
  const editor = createEditor(
    '<p><img src="a.png" data-size="medium" data-align="center" data-caption="강남역 저녁" /></p>',
  );
  const html = editor.getHTML();
  expect(html).toContain('data-caption="강남역 저녁"');
});

it('caption이 비어있으면 data-caption 속성을 출력하지 않는다', () => {
  const editor = createEditor('<p><img src="a.png" /></p>');
  const html = editor.getHTML();
  expect(html).not.toContain('data-caption');
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- src/app/admin/posts/new/_components/_image-block/image-extension.test.ts
```

Expected: FAIL — `data-caption` 관련 두 테스트 실패

- [ ] **Step 3: caption 속성 구현**

`image-extension.ts`의 `addAttributes()` 안에 `size`, `align` 다음에 추가:

```typescript
addAttributes() {
  return {
    ...this.parent?.(),
    size: {
      default: 'medium' as ImageSize,
      parseHTML: (el) => {
        const v = el.getAttribute('data-size');
        return isImageSize(v) ? v : 'medium';
      },
      renderHTML: (attrs) => ({ 'data-size': attrs.size ?? 'medium' }),
    },
    align: {
      default: 'center' as ImageAlign,
      parseHTML: (el) => {
        const v = el.getAttribute('data-align');
        return isImageAlign(v) ? v : 'center';
      },
      renderHTML: (attrs) => ({ 'data-align': attrs.align ?? 'center' }),
    },
    caption: {
      default: '' as string,
      parseHTML: (el) => el.getAttribute('data-caption') ?? '',
      renderHTML: (attrs) => {
        if (!attrs.caption) return {};
        return { 'data-caption': attrs.caption };
      },
    },
  };
},
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/app/admin/posts/new/_components/_image-block/image-extension.test.ts
```

Expected: PASS (기존 3개 + 신규 2개 = 5개 모두)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-extension.ts \
        src/app/admin/posts/new/_components/_image-block/image-extension.test.ts
git commit -m "feat: ImageBlock에 caption 속성 추가 (data-caption으로 직렬화)"
```

---

## Task 2: ImageNodeView에 캡션 입력 UI 추가

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx`

- [ ] **Step 1: NodeView 전체 교체**

`image-node-view.tsx` 파일을 아래 내용으로 교체한다:

```tsx
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
  const caption = (node.attrs.caption as string) ?? '';

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

- [ ] **Step 2: 개발 서버에서 동작 확인**

```bash
npm run dev
```

1. `http://localhost:3000/admin/posts/new` 접속
2. 이미지를 업로드하거나 에디터에 이미지 삽입
3. 이미지를 클릭하면 하단에 얇은 회색 밑줄 + "캡션 추가..." placeholder 확인
4. 캡션 입력 후 이미지 바깥 클릭 시 캡션 텍스트 유지 확인
5. 이미지 미선택 상태에서는 캡션 없으면 영역 미표시 확인

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-node-view.tsx
git commit -m "feat: ImageNodeView에 캡션 입력 UI 추가"
```

---

## Task 3: rehypeImageCaption 플러그인으로 블로그 렌더링 처리

**Files:**
- Modify: `src/lib/markdown.ts`
- Create: `src/lib/markdown.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/markdown.test.ts` 신규 생성:

```typescript
import { describe, it, expect } from 'vitest';
import { htmlToHtmlWithToc } from './markdown';

describe('htmlToHtmlWithToc — 이미지 캡션', () => {
  it('data-caption이 있는 img를 figure + figcaption으로 변환한다', async () => {
    const html =
      '<p><img src="a.png" data-size="medium" data-align="center" data-caption="강남역 저녁" /></p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).toContain('<figure');
    expect(result).toContain('<figcaption>강남역 저녁</figcaption>');
    expect(result).not.toContain('data-caption');
  });

  it('figure에 data-size, data-align이 유지된다', async () => {
    const html =
      '<p><img src="a.png" data-size="small" data-align="left" data-caption="설명" /></p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).toContain('data-size="small"');
    expect(result).toContain('data-align="left"');
  });

  it('data-caption이 없는 img는 변환하지 않는다', async () => {
    const html = '<p><img src="a.png" data-size="medium" data-align="center" /></p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).not.toContain('<figure');
    expect(result).not.toContain('<figcaption>');
  });

  it('p 안에 img 외 다른 자식이 있으면 변환하지 않는다', async () => {
    const html =
      '<p>텍스트 <img src="a.png" data-caption="설명" /> 뒤에도 텍스트</p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).not.toContain('<figure');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- src/lib/markdown.test.ts
```

Expected: FAIL — figcaption 변환이 아직 구현되지 않음

- [ ] **Step 3: rehypeImageCaption 플러그인 구현**

`src/lib/markdown.ts`에서 import 블록 아래, `markdownToHtml` 함수 위에 아래 코드를 추가한다:

```typescript
import type { Root } from 'hast';
```

그리고 기존 `import type { Element } from 'hast';` 줄을 아래로 교체한다:

```typescript
import type { Element, Root } from 'hast';
```

이후 `markdownToHtml` 함수 위에 플러그인 함수를 추가한다:

```typescript
function rehypeImageCaption() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'p') return;
      if (node.children.length !== 1) return;

      const child = node.children[0];
      if (child.type !== 'element') return;
      const img = child as Element;
      if (img.tagName !== 'img') return;

      const caption = img.properties?.dataCaption;
      if (!caption) return;

      delete img.properties!.dataCaption;

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: {
          ...(img.properties?.dataSize && { dataSize: img.properties.dataSize }),
          ...(img.properties?.dataAlign && { dataAlign: img.properties.dataAlign }),
        },
        children: [
          img,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: String(caption) }],
          },
        ],
      };

      if (parent && index !== null && index !== undefined) {
        (parent.children as Element[])[index] = figure;
      }
    });
  };
}
```

그리고 `htmlToHtmlWithToc` 함수의 processor 체인에 `.use(rehypeImageCaption)` 플러그인을 추가한다. `rehypeSlug` 다음에 추가:

```typescript
export async function htmlToHtmlWithToc(html: string): Promise<MarkdownResult> {
  const toc: TocItem[] = [];

  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSlug)
    .use(rehypeImageCaption)   // ← 추가
    .use(() => (tree) => {
      visit(tree, 'element', (node: Element) => {
        if (node.tagName === 'h2' || node.tagName === 'h3') {
          const id = node.properties?.id as string | undefined;
          const text = extractText(node);
          if (id && text) {
            toc.push({ level: Number(node.tagName[1]) as 2 | 3, text, id });
          }
        }
      });
    })
    .use(rehypeStringify);

  const result = await processor.process(html);

  return { html: result.toString(), toc };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- src/lib/markdown.test.ts
```

Expected: PASS (4개 모두)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts
git commit -m "feat: htmlToHtmlWithToc에 rehypeImageCaption 플러그인 추가"
```

---

## Task 4: prose.css에 figcaption 스타일 추가

**Files:**
- Modify: `src/styles/prose.css`

- [ ] **Step 1: figcaption 스타일 추가**

`prose.css`의 이미지 블록 섹션 (`/* ── 이미지 블록 */`) 바로 앞에 아래를 추가한다:

```css
.prose figcaption {
  font-size: 0.8125rem;
  color: var(--muted-foreground);
  font-style: italic;
  text-align: center;
  margin-top: 0.375rem;
}
```

- [ ] **Step 2: 개발 서버에서 최종 확인**

```bash
npm run dev
```

1. 관리자에서 캡션이 있는 이미지를 포함한 글 저장
2. 블로그 글 상세 페이지에서 캡션이 이미지 하단에 작은 회색 이탤릭 텍스트로 표시되는지 확인
3. 캡션 없는 이미지는 figcaption 없이 그대로 표시되는지 확인

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm run test:run
```

Expected: 전체 테스트 PASS

- [ ] **Step 4: 최종 커밋**

```bash
git add src/styles/prose.css
git commit -m "feat: prose figcaption 스타일 추가"
```
