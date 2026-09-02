# 본문 이미지 갤러리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 완료 (2026-08-17)

Task 0~8 전체 완료, 서브에이전트 기반(subagent-driven-development)으로 실행. 태스크별 리뷰 전부 clean 통과(Task 4는 fix round 1회 — 모바일 미디어쿼리에서 캡션 없는 세로 사진이 찌그러지던 실제 결함).

- 이미지 정리 로직이 `imageBlock` 노드명 오타로 한 번도 동작하지 않던 기존 버그 수정. 뮤테이션 테스트로 회귀 방지 확인.
- `gallery` Tiptap 노드(원자 노드 + `images` 배열) 신규, NodeView·슬라이드별 캡션·순서 이동·삭제 UI 추가.
- 공개 페이지에 네이티브 가로 스크롤 갤러리(980px full-bleed, 높이 고정) CSS 추가. 단일 이미지 세로 길이 상한(`max-height: 80vh`)도 함께 반영.
- 다중 파일 드롭·붙여넣기 시 자동 갤러리 생성(1장은 기존 단일 이미지 유지), 툴바에 갤러리 버튼 추가.
- 화살표 버튼을 점진적 향상으로 추가, 갤러리 드래그 스크롤과 이미지 확대 다이얼로그 충돌(5px 이동 판정) 해소.
- 모바일 갤러리 높이는 실측 사진 비율 계산치를 사용자와 함께 검토해 300px로 확정(스펙 초안 260px에서 상향 — 세로 사진이 지나치게 작아 보이는 문제).
- 최종 검증: 단위 테스트 245/245, 린트 clean(사전 존재 이슈 2건 제외), 빌드 성공, 실제 `htmlToHtmlWithToc` 파이프라인에 갤러리 HTML을 직접 투입해 무손상 확인, E2E 10/11(`ralli.spec.ts:45` 실패는 `develop`에서도 재현되는 사전 존재 결함으로 확정).
- 이 세션의 브라우저 프리뷰 도구가 워크트리가 아닌 메인 저장소에 고정되는 툴링 제약(선행 스펙 작업에서 최초 발견)과 `/admin`의 Clerk 인증 게이트로, 에디터 UI의 실제 클릭·드래그 확인은 코드 경로 추적으로 대체했다 — 각 태스크 리뷰어가 diff·소스 대조로 독립 검증.
- 최종 브랜치 리뷰(Opus)에서 Important 3건 발견. 화살표 영구 숨김 버그(width/height 폴백 이미지)와 `GalleryNavHandler` 테스트 부재는 fix round 1회로 수정(commit `d3a0898`). 나머지 1건은 코드 결함이 아니라 **알려진 제약**으로 남긴다 — 아래 참조.

### 알려진 제약: 이미지 삭제 후 undo 시 R2 파일 복구 불가

Task 1에서 고친 이미지 정리 로직(`collectImageSrcs` → `removeImage`)이 노드명 오타 때문에 지금까지 한 번도 실제로 동작한 적이 없었다. 이번 브랜치에서 오타를 고치면서 처음으로 정상 작동하게 됐는데, 그 결과 기존에 설계돼 있던 "본문에서 사라진 이미지를 R2에서 즉시 삭제" 동작이 실제로 드러났다.

에디터에서 이미지(단일 이미지든 갤러리 슬라이드든)를 지우면 `onUpdate` 시점에 즉시 R2 객체와 `post_images` row가 삭제된다. 이 상태에서 Ctrl+Z로 문서를 되돌려도 에디터 노드는 복원되지만 실제 파일은 이미 사라져 깨진 이미지로 남는다.

사용자와 논의 후 **지금은 고치지 않고 알려진 제약으로 남기기로 결정**했다(개인 블로그라 실질적 위험이 낮다고 판단). 근본적으로 고치려면 삭제를 `onUpdate`가 아니라 저장/발행 시점으로 지연시키고, 그 시점에 본문 HTML을 서버에서 다시 파싱해 `post_images`와 대조하는 별도의 서버 사이드 정리 로직이 필요하다 — 이 브랜치의 범위를 넘어서므로 후속 이슈로 분리한다.

**Goal:** 본문에 이미지 여러 장을 가로로 넘겨 보는 갤러리를 추가하고, 함께 드러난 이미지 정리 버그와 세로 사진 높이 문제를 고친다.

**Architecture:** Tiptap에 `gallery` 원자 노드를 추가하고 `images` 배열 속성 하나로 슬라이드를 관리한다. 편집 UI 전체는 React NodeView가 소유하고, 모든 편집은 `updateAttributes({ images })` 한 경로로 수렴한다. 공개 페이지는 CSS `scroll-snap`만으로 스크롤되고, 화살표 버튼은 마운트 후 DOM에 덧붙이는 점진적 향상으로 처리한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, Tiptap, Vitest + Testing Library, Cloudflare R2

**설계 문서:** [2026-08-17 본문 이미지 갤러리](../specs/2026-08-17-post-gallery-design.md)

## Global Constraints

- 갤러리 폭은 사이즈 선택 없이 **항상 980px full-bleed**. `data-size` 개념을 두지 않는다.
- 슬라이드는 **높이 고정, 폭은 원본 비율대로**. 잘라내지 않는다.
- `--gallery-height`: 데스크톱 `460px`, `@media (max-width: 640px)` `260px`(실기기 확인 후 280~320px 검토).
- 갤러리 이미지에는 `max-width: none`이 반드시 필요하다 — Tailwind preflight의 `img { max-width: 100% }`가 높이 고정을 무너뜨린다.
- 저장 HTML에는 콘텐츠만 남긴다. 버튼·인디케이터 같은 조작 UI는 저장하지 않는다.
- 이미지 크기는 `<img>`의 `width`/`height` 속성에 기록한다. DB 스키마는 바꾸지 않는다.
- Tailwind v4 문법을 쓴다. `calc()` 안에서는 `var(--x)` 형태를 그대로 쓴다.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다.
- `console.log`를 커밋하지 않는다.
- 커밋 메시지는 gitmoji를 사용한다.
- 작업 브랜치: `feature/post-gallery` (develop에서 분기)

---

## Task 0: 작업 브랜치 생성

**Files:** 없음

- [x] **Step 1: develop 최신 상태 확인**

```bash
git checkout develop && git pull
```

- [x] **Step 2: 브랜치 생성**

```bash
git checkout -b feature/post-gallery
```

- [x] **Step 3: 기준선 확보**

Run: `npm run test:run`
Expected: PASS — 이 시점의 파일 수와 테스트 수를 기록해 두고, 이후 태스크에서 증가분을 대조한다.

---

## Task 1: 이미지 정리 버그 수정

먼저 고친다. 갤러리가 같은 로직 위에 얹히므로 버그를 남겨두면 그대로 복제된다.

**Files:**

- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx:36-44`
- Create: `src/app/admin/posts/new/_utils/collect-image-srcs.ts`
- Test: `src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`

**Interfaces:**

- Produces: `collectImageSrcs(doc: ProseMirrorNode): Set<string>` — `@/app/admin/posts/new/_utils/collect-image-srcs`에서 named export. Task 5가 갤러리 src 수집을 이 함수에 추가로 얹는다.

로직을 컴포넌트 밖 순수 함수로 꺼내야 테스트할 수 있다. 현재는 `wysiwyg-editor.action.tsx` 안 `useCallback`에 묶여 있어 에디터 전체를 띄우지 않으면 검증이 불가능하다.

- [x] **Step 1: 실패하는 테스트를 먼저 작성**

`src/app/admin/posts/new/_utils/collect-image-srcs.test.ts` 신규 생성.

```ts
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { collectImageSrcs } from './collect-image-srcs';
import { ImageBlock } from './image-extension';

function docOf(html: string) {
  return new Editor({ extensions: [StarterKit, ImageBlock], content: html })
    .state.doc;
}

describe('collectImageSrcs', () => {
  it('단일 이미지의 src를 수집한다', () => {
    const doc = docOf('<p><img src="https://cdn/a.png" /></p>');
    expect(collectImageSrcs(doc)).toEqual(new Set(['https://cdn/a.png']));
  });

  it('이미지가 여러 개면 모두 수집한다', () => {
    const doc = docOf(
      '<p><img src="https://cdn/a.png" /></p><p><img src="https://cdn/b.png" /></p>'
    );
    expect(collectImageSrcs(doc)).toEqual(
      new Set(['https://cdn/a.png', 'https://cdn/b.png'])
    );
  });

  it('이미지가 없으면 빈 Set을 반환한다', () => {
    expect(collectImageSrcs(docOf('<p>텍스트만</p>'))).toEqual(new Set());
  });
});
```

- [x] **Step 2: 테스트를 돌려 실패를 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`
Expected: FAIL — `./collect-image-srcs` 모듈이 없어 import 에러

- [x] **Step 3: 구현**

`src/app/admin/posts/new/_utils/collect-image-srcs.ts` 신규 생성.

```ts
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

/**
 * 문서에 남아 있는 이미지 src를 모두 모은다.
 * 여기에 없는 src는 본문에서 삭제된 것으로 보고 R2에서 정리한다.
 */
export function collectImageSrcs(doc: ProseMirrorNode): Set<string> {
  const srcs = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs.src) {
      srcs.add(node.attrs.src as string);
    }
    return true;
  });
  return srcs;
}
```

> 기존 코드는 `node.type.name === 'imageBlock'`을 검사했는데, `ImageBlock = Image.extend({...})`는 `name`을 재정의하지 않으므로 실제 노드 이름은 `image`다. 이 오타 때문에 정리 로직이 한 번도 동작한 적이 없다.

- [x] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`
Expected: PASS (3 tests)

- [x] **Step 5: 에디터가 새 함수를 쓰도록 교체**

`wysiwyg-editor.action.tsx`에서 `getImageSrcs` `useCallback` 정의(36-44행)를 삭제하고 import를 추가한다.

```tsx
import { collectImageSrcs } from '../_utils/collect-image-srcs';
```

`useEffect`와 `onUpdate` 안의 `getImageSrcs(editor)` 호출을 `collectImageSrcs(editor.state.doc)`로 바꾼다. `getImageSrcs`를 참조하던 `useEffect` 의존성 배열에서도 해당 항목을 제거한다.

- [x] **Step 6: 전체 테스트와 린트 확인**

Run: `npm run test:run && npm run lint`
Expected: PASS. `docs/design/ralli/support.js`의 사전 존재 에러 2건은 이 브랜치와 무관하다.

- [x] **Step 7: 커밋**

```bash
git add src/app/admin/posts/new/_utils/collect-image-srcs.ts src/app/admin/posts/new/_utils/collect-image-srcs.test.ts src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx
git commit -m "🐛 이미지 정리 로직이 동작하지 않던 노드명 오타 수정"
```

---

## Task 2: 갤러리 노드 확장

**Files:**

- Create: `src/app/admin/posts/new/_utils/gallery-extension.ts`
- Test: `src/app/admin/posts/new/_utils/gallery-extension.test.ts`

**Interfaces:**

- Produces: `type GalleryImage = { src: string; alt: string; caption: string; width: number; height: number }`
- Produces: `Gallery` — Tiptap Node. 노드명 `gallery`, 속성 `images: GalleryImage[]`. Task 3의 NodeView, Task 5의 삽입 로직, Task 6의 정리 로직이 이 이름과 속성에 의존한다.

- [x] **Step 1: 실패하는 테스트를 먼저 작성**

`src/app/admin/posts/new/_utils/gallery-extension.test.ts` 신규 생성.

```ts
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { Gallery } from './gallery-extension';

function createEditor(content: string) {
  return new Editor({ extensions: [StarterKit, Gallery], content });
}

const twoImages =
  '<div data-gallery>' +
  '<figure><img src="a.png" alt="첫째" width="1600" height="1067"><figcaption>거실</figcaption></figure>' +
  '<figure><img src="b.png" alt="" width="1067" height="1600"></figure>' +
  '</div>';

describe('Gallery extension', () => {
  it('data-gallery를 파싱해 images 배열로 복원한다', () => {
    const editor = createEditor(twoImages);
    let images: unknown = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'gallery') images = node.attrs.images;
      return true;
    });
    expect(images).toEqual([
      { src: 'a.png', alt: '첫째', caption: '거실', width: 1600, height: 1067 },
      { src: 'b.png', alt: '', caption: '', width: 1067, height: 1600 },
    ]);
  });

  it('직렬화하면 figure 구조로 되돌아온다', () => {
    const html = createEditor(twoImages).getHTML();
    expect(html).toContain('data-gallery');
    expect(html).toContain('src="a.png"');
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1067"');
    expect(html).toContain('<figcaption>거실</figcaption>');
  });

  it('캡션이 비어 있으면 figcaption을 출력하지 않는다', () => {
    const html = createEditor(
      '<div data-gallery><figure><img src="a.png" width="10" height="10"></figure></div>'
    ).getHTML();
    expect(html).not.toContain('figcaption');
  });

  it('width/height가 없으면 0으로 폴백한다', () => {
    const editor = createEditor(
      '<div data-gallery><figure><img src="a.png"></figure></div>'
    );
    let images: { width: number; height: number }[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'gallery') images = node.attrs.images;
      return true;
    });
    expect(images[0].width).toBe(0);
    expect(images[0].height).toBe(0);
  });

  it('figure가 없는 빈 갤러리는 빈 배열이 된다', () => {
    const editor = createEditor('<div data-gallery></div>');
    let images: unknown[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'gallery') images = node.attrs.images;
      return true;
    });
    expect(images).toEqual([]);
  });
});
```

- [x] **Step 2: 테스트를 돌려 실패를 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/gallery-extension.test.ts`
Expected: FAIL — `./gallery-extension` 모듈이 없어 import 에러

- [x] **Step 3: 구현**

`src/app/admin/posts/new/_utils/gallery-extension.ts` 신규 생성.

```ts
import { Node } from '@tiptap/core';

export type GalleryImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

function toNumber(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseFigures(el: HTMLElement): GalleryImage[] {
  return Array.from(el.querySelectorAll('figure')).flatMap((figure) => {
    const img = figure.querySelector('img');
    if (!img) return [];
    return [
      {
        src: img.getAttribute('src') ?? '',
        alt: img.getAttribute('alt') ?? '',
        caption: figure.querySelector('figcaption')?.textContent ?? '',
        width: toNumber(img.getAttribute('width')),
        height: toNumber(img.getAttribute('height')),
      },
    ];
  });
}

export const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [] as GalleryImage[],
        parseHTML: (el) => parseFigures(el as HTMLElement),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-gallery]' }];
  },

  renderHTML({ node }) {
    const images = (node.attrs.images ?? []) as GalleryImage[];
    return [
      'div',
      { 'data-gallery': '' },
      ...images.map((image) => {
        const img = [
          'img',
          {
            src: image.src,
            alt: image.alt,
            ...(image.width ? { width: String(image.width) } : {}),
            ...(image.height ? { height: String(image.height) } : {}),
          },
        ];
        return image.caption
          ? ['figure', {}, img, ['figcaption', {}, image.caption]]
          : ['figure', {}, img];
      }),
    ];
  },
});
```

> `images` 속성의 `renderHTML`이 빈 객체를 반환하는 것이 중요하다. 그러지 않으면 Tiptap이 배열을 `images="[object Object]"` 형태로 `div`에 덧붙인다. 실제 직렬화는 노드 레벨 `renderHTML`이 담당한다.

- [x] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/gallery-extension.test.ts`
Expected: PASS (5 tests)

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_utils/gallery-extension.ts src/app/admin/posts/new/_utils/gallery-extension.test.ts
git commit -m "✨ 갤러리 Tiptap 노드 추가"
```

---

## Task 3: 갤러리 NodeView와 슬라이드 편집 UI

**Files:**

- Create: `src/app/admin/posts/new/_components/_gallery/gallery-slide-toolbar.tsx`
- Create: `src/app/admin/posts/new/_components/_gallery/gallery-node-view.tsx`
- Test: `src/app/admin/posts/new/_components/_gallery/gallery-node-view.test.tsx`
- Modify: `src/app/admin/posts/new/_utils/gallery-extension.ts` (NodeView 연결)

**Interfaces:**

- Consumes: `GalleryImage`, `Gallery` (Task 2)
- Produces: `GalleryNodeView` — `ReactNodeViewRenderer`에 넘길 컴포넌트
- Produces: `GallerySlideToolbar({ index, total, caption, alt, onMove, onCaptionChange, onAltChange, onDelete })` — 슬라이드별 조작 바

- [x] **Step 1: 슬라이드 툴바를 먼저 구현**

`src/app/admin/posts/new/_components/_gallery/gallery-slide-toolbar.tsx` 신규 생성. 기존 `image-toolbar.tsx`의 디자인 언어(작은 아이콘 버튼 + 팝오버)를 따른다.

```tsx
'use client';

import { ArrowLeft, ArrowRight, Settings, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
  index: number;
  total: number;
  caption: string;
  alt: string;
  onMove: (to: number) => void;
  onCaptionChange: (caption: string) => void;
  onAltChange: (alt: string) => void;
  onDelete: () => void;
};

export function GallerySlideToolbar({
  index,
  total,
  caption,
  alt,
  onMove,
  onCaptionChange,
  onAltChange,
  onDelete,
}: Props) {
  return (
    <div
      className="flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-md"
      role="toolbar"
    >
      <button
        type="button"
        aria-label="왼쪽으로 이동"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        type="button"
        aria-label="오른쪽으로 이동"
        disabled={index === total - 1}
        onClick={() => onMove(index + 1)}
        className="rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
      >
        <ArrowRight size={16} />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="캡션과 대체 텍스트 설정"
            className="rounded p-1.5 hover:bg-accent cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="w-72">
          <Label
            htmlFor={`gallery-caption-${index}`}
            className="mb-1 block text-xs"
          >
            캡션
          </Label>
          <Input
            id={`gallery-caption-${index}`}
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="사진 아래에 붙는 설명"
          />
          <Label
            htmlFor={`gallery-alt-${index}`}
            className="mt-3 mb-1 block text-xs"
          >
            대체 텍스트 (alt)
          </Label>
          <Input
            id={`gallery-alt-${index}`}
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="이미지를 설명하는 짧은 문장"
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        aria-label="슬라이드 삭제"
        onClick={onDelete}
        className="rounded p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
```

- [x] **Step 2: NodeView 테스트를 먼저 작성**

`src/app/admin/posts/new/_components/_gallery/gallery-node-view.test.tsx` 신규 생성.

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { NodeViewProps } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { GalleryNodeView } from './gallery-node-view';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, ...rest }: { children: React.ReactNode }) => (
    <div {...rest}>{children}</div>
  ),
}));

const images = [
  { src: 'a.png', alt: '가', caption: '첫째', width: 1600, height: 1067 },
  { src: 'b.png', alt: '나', caption: '', width: 1067, height: 1600 },
  { src: 'c.png', alt: '다', caption: '', width: 800, height: 800 },
];

function setup(overrides: Partial<NodeViewProps> = {}) {
  const updateAttributes = vi.fn();
  const deleteNode = vi.fn();
  const props = {
    node: { attrs: { images } },
    updateAttributes,
    deleteNode,
    selected: true,
    ...overrides,
  } as unknown as NodeViewProps;
  render(<GalleryNodeView {...props} />);
  return { updateAttributes, deleteNode };
}

describe('GalleryNodeView', () => {
  it('이미지 수만큼 렌더한다', () => {
    setup();
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('오른쪽 이동은 배열 순서를 바꾼다', () => {
    const { updateAttributes } = setup();
    fireEvent.click(
      screen.getAllByRole('button', { name: '오른쪽으로 이동' })[0]
    );
    expect(updateAttributes).toHaveBeenCalledWith({
      images: [images[1], images[0], images[2]],
    });
  });

  it('삭제는 해당 항목만 제거한다', () => {
    const { updateAttributes } = setup();
    fireEvent.click(
      screen.getAllByRole('button', { name: '슬라이드 삭제' })[1]
    );
    expect(updateAttributes).toHaveBeenCalledWith({
      images: [images[0], images[2]],
    });
  });

  it('마지막 1장을 삭제하면 노드를 통째로 지운다', () => {
    const { deleteNode, updateAttributes } = setup({
      node: { attrs: { images: [images[0]] } },
    } as unknown as Partial<NodeViewProps>);
    fireEvent.click(screen.getByRole('button', { name: '슬라이드 삭제' }));
    expect(deleteNode).toHaveBeenCalled();
    expect(updateAttributes).not.toHaveBeenCalled();
  });

  it('첫 슬라이드의 왼쪽 이동과 마지막 슬라이드의 오른쪽 이동은 비활성이다', () => {
    setup();
    expect(
      screen.getAllByRole('button', { name: '왼쪽으로 이동' })[0]
    ).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: '오른쪽으로 이동' })[2]
    ).toBeDisabled();
  });

  it('선택되지 않으면 조작 바를 렌더하지 않는다', () => {
    setup({ selected: false } as unknown as Partial<NodeViewProps>);
    expect(
      screen.queryByRole('button', { name: '슬라이드 삭제' })
    ).not.toBeInTheDocument();
  });
});
```

- [x] **Step 3: 테스트를 돌려 실패를 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_gallery/gallery-node-view.test.tsx`
Expected: FAIL — `./gallery-node-view` 모듈이 없어 import 에러

- [x] **Step 4: NodeView 구현**

`src/app/admin/posts/new/_components/_gallery/gallery-node-view.tsx` 신규 생성.

```tsx
'use client';

import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '../../_utils/gallery-extension';
import { GallerySlideToolbar } from './gallery-slide-toolbar';

export function GalleryNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const images = (node.attrs.images ?? []) as GalleryImage[];

  const patch = (index: number, next: Partial<GalleryImage>) => {
    updateAttributes({
      images: images.map((image, i) =>
        i === index ? { ...image, ...next } : image
      ),
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateAttributes({ images: next });
  };

  const remove = (index: number) => {
    if (images.length <= 1) {
      deleteNode();
      return;
    }
    updateAttributes({ images: images.filter((_, i) => i !== index) });
  };

  return (
    <NodeViewWrapper
      data-gallery=""
      className={cn('my-4', selected && 'ring-2 ring-primary ring-offset-2')}
    >
      {images.map((image, index) => (
        <figure key={`${image.src}-${index}`} className="relative">
          {selected && (
            <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
              <GallerySlideToolbar
                index={index}
                total={images.length}
                caption={image.caption}
                alt={image.alt}
                onMove={(to) => move(index, to)}
                onCaptionChange={(caption) => patch(index, { caption })}
                onAltChange={(alt) => patch(index, { alt })}
                onDelete={() => remove(index)}
              />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            width={image.width || undefined}
            height={image.height || undefined}
          />
          {image.caption && <figcaption>{image.caption}</figcaption>}
        </figure>
      ))}
    </NodeViewWrapper>
  );
}
```

> `data-gallery`를 NodeViewWrapper에도 붙여 Task 4의 `prose.css` 스크롤 규칙이 에디터 안에서도 그대로 적용되게 한다. 편집 화면과 발행 결과가 같은 모양으로 보인다.

- [x] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_gallery/gallery-node-view.test.tsx`
Expected: PASS (6 tests)

- [x] **Step 6: 확장에 NodeView 연결**

`gallery-extension.ts` 상단에 import를 추가한다.

```ts
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GalleryNodeView } from '../_components/_gallery/gallery-node-view';
```

`Node.create({...})` 안, `renderHTML` 아래에 추가한다.

```ts
  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  },
```

- [x] **Step 7: 전체 테스트와 린트 확인**

Run: `npm run test:run && npm run lint`
Expected: PASS

- [x] **Step 8: 커밋**

```bash
git add src/app/admin/posts/new/_components/_gallery/ src/app/admin/posts/new/_utils/gallery-extension.ts
git commit -m "✨ 갤러리 NodeView와 슬라이드 편집 UI 추가"
```

---

## Task 4: 공개 페이지 CSS

**Files:**

- Modify: `src/app/globals.css` (`--gallery-height` 토큰 추가)
- Modify: `src/styles/prose.css` (갤러리 규칙 + 단일 이미지 `max-height`)

**Interfaces:**

- Consumes: `--content-width`, `--radius-image` (선행 스펙에서 확정된 토큰)
- Produces: `--gallery-height` CSS 변수, `[data-gallery]` / `[data-gallery-wrap]` 스타일 계약. Task 7의 화살표 핸들러가 `data-gallery-wrap`을 생성한다.

- [x] **Step 1: 높이 토큰 추가**

`src/app/globals.css`의 `:root` 블록에서 `--article-width: 720px;` 바로 아래 줄에 추가한다.

```css
--gallery-height: 460px;
```

- [x] **Step 2: 갤러리 스크롤 규칙 추가**

`src/styles/prose.css`의 `@media (max-width: 640px)` 블록 **앞에** 아래를 추가한다.

```css
/* ── 갤러리 (data-gallery) ── */
.prose [data-gallery] {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
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

/*
 * 화살표 버튼이 붙으면 bleed 소유권이 래퍼로 넘어간다.
 * 갤러리 자신이 bleed를 유지하면 래퍼는 본문 폭(720px)에 머물러,
 * 래퍼 기준으로 배치한 버튼이 갤러리(980px) 가장자리와 어긋난다.
 * 갤러리 안쪽에 넣는 것도 불가능하다 — overflow-x: auto라 버튼이 콘텐츠와 함께 스크롤된다.
 */
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

> `max-width: none`이 반드시 필요하다. Tailwind preflight의 `img { max-width: 100% }`가 걸리면 가로로 긴 사진이 컨테이너 폭에 맞춰 찌그러져 높이 고정이 무너진다.

- [x] **Step 3: 단일 이미지 세로 길이 상한 추가**

같은 파일, 방금 추가한 갤러리 블록 **앞**(단일 이미지 규칙들 아래)에 추가한다.

```css
.prose img[data-size='default'],
.prose img[data-size='small'],
.prose figure[data-size='default'] img,
.prose figure[data-size='small'] img {
  max-height: 80vh;
  width: auto;
}
```

> `width: auto`가 함께 있어야 한다. 선행 스펙의 `width: 100%` / `.prose figure[data-size] img { width: 100% }`가 남아 있으면 `max-height`가 걸려도 폭이 고정돼 이미지가 찌그러진다. `data-size="full"`은 "크게 보여주려는" 의도적 선택이므로 제외한다.

- [x] **Step 4: 모바일 규칙 추가**

`@media (max-width: 640px)` 블록 **안쪽 끝**에 추가한다.

```css
.prose [data-gallery],
.prose [data-gallery-wrap] {
  max-width: 100%;
  margin-left: 0;
  transform: none;
}
.prose [data-gallery] img {
  height: 260px;
}
```

- [x] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공. CSS 문법 오류가 있으면 여기서 잡힌다.

- [x] **Step 6: 컴파일된 CSS에 규칙이 실렸는지 확인**

```bash
CSS=$(find .next/static -name "*.css" | xargs grep -l "gallery-height" | head -1)
grep -o 'data-gallery\][^}]*}' "$CSS" | head -3
grep -o 'max-height:80vh[^}]*}' "$CSS" | head -1
```

Expected: 갤러리 flex/scroll 규칙과 `max-height:80vh`가 모두 출력된다.

- [x] **Step 7: 커밋**

```bash
git add src/app/globals.css src/styles/prose.css
git commit -m "💄 갤러리 가로 스크롤 스타일과 단일 이미지 세로 길이 상한 추가"
```

---

## Task 5: 다중 파일 업로드와 갤러리 삽입

**Files:**

- Create: `src/app/admin/posts/new/_utils/read-image-size.ts`
- Modify: `src/app/admin/posts/new/_utils/image-uploading-extension.ts` (`total` 속성)
- Modify: `src/app/admin/posts/new/_actions/_image-uploading/image-uploading-node-view.action.tsx` (N장 표시)
- Modify: `src/app/admin/posts/new/_actions/_image-uploading/image-uploading-node-view.action.test.tsx`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx` (다중 파일 처리)

**Interfaces:**

- Consumes: `Gallery`, `GalleryImage` (Task 2)
- Produces: `readImageSize(file: File): Promise<{ width: number; height: number }>` — 측정 실패 시 `{ width: 0, height: 0 }`
- Produces: `imageUploading` 노드의 `total` 속성 (기본값 `1`)

- [x] **Step 1: 이미지 크기 측정 함수 구현**

`src/app/admin/posts/new/_utils/read-image-size.ts` 신규 생성.

```ts
/**
 * 업로드 전 파일에서 원본 픽셀 크기를 읽는다.
 * 갤러리 img의 width/height 속성에 넣어 브라우저가 종횡비를 미리 알게 한다.
 * 측정에 실패해도 갤러리는 동작해야 하므로 0으로 폴백한다.
 */
export function readImageSize(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    image.src = url;
  });
}
```

> 단위 테스트를 두지 않는다. jsdom은 이미지를 디코딩하지 않아 목만 검증하는 껍데기 테스트가 되고, 프로젝트 테스트 규칙("실제 브라우저가 필요한가 → Playwright")에도 어긋난다. 실패해도 `{0, 0}`으로 폴백해 갤러리가 깨지지 않는다는 점을 구현으로 보장한다.

- [x] **Step 2: placeholder 노드에 total 속성 추가**

`src/app/admin/posts/new/_utils/image-uploading-extension.ts`의 `addAttributes`를 수정한다.

```ts
  addAttributes() {
    return {
      id: { default: '' },
      previewUrl: { default: '' },
      total: { default: 1 },
    };
  },
```

- [x] **Step 3: placeholder 표시 테스트를 먼저 추가**

`image-uploading-node-view.action.test.tsx`의 `describe` 블록 안에 추가한다.

```tsx
it('total이 2 이상이면 장수를 표시한다', () => {
  const props = {
    node: { attrs: { id: 'abc', previewUrl: 'blob:preview', total: 3 } },
  } as unknown as NodeViewProps;
  render(<ImageUploadingNodeViewAction {...props} />);
  expect(screen.getByText('3장 업로드 중...')).toBeInTheDocument();
});
```

- [x] **Step 4: 테스트를 돌려 실패를 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/_image-uploading/image-uploading-node-view.action.test.tsx`
Expected: FAIL — "3장 업로드 중..." 텍스트가 없다

- [x] **Step 5: placeholder 표시 구현**

`image-uploading-node-view.action.tsx`에서 `total`을 읽어 문구를 분기한다.

```tsx
const previewUrl = (node.attrs.previewUrl as string) ?? '';
const total = (node.attrs.total as number) ?? 1;
```

`<span className="text-sm">업로드 중...</span>`을 아래로 바꾼다.

```tsx
<span className="text-sm">
  {total > 1 ? `${total}장 업로드 중...` : '업로드 중...'}
</span>
```

- [x] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/_image-uploading/image-uploading-node-view.action.test.tsx`
Expected: PASS (4 tests)

- [x] **Step 7: 다중 파일 업로드 로직 구현**

`wysiwyg-editor.action.tsx`에 import를 추가한다.

```tsx
import { Gallery, type GalleryImage } from '../_utils/gallery-extension';
import { readImageSize } from '../_utils/read-image-size';
```

`extensions` 배열의 `ImageBlock` 다음 줄에 `Gallery,`를 추가한다.

기존 `uploadAndInsert` 아래에 새 함수를 추가한다.

```tsx
const uploadFiles = useCallback(
  async (editorInstance: Editor, fileList: File[]) => {
    const images = fileList.filter((f) => f.type.startsWith('image/'));
    const withinLimit = images.filter((f) => f.size <= 10 * 1024 * 1024);
    const rejected = images.length - withinLimit.length;
    if (rejected > 0) {
      toast.error(`${rejected}장이 10MB를 넘어 제외됐습니다`);
    }
    if (withinLimit.length === 0) return true;
    if (withinLimit.length === 1) {
      await uploadAndInsert(editorInstance, withinLimit[0]);
      return true;
    }

    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(withinLimit[0]);
    editorInstance
      .chain()
      .focus()
      .insertContent({
        type: 'imageUploading',
        attrs: { id, previewUrl, total: withinLimit.length },
      })
      .run();

    const uploaded: GalleryImage[] = [];
    let failed = 0;

    // R2 키의 index를 서버가 순차 계산하므로 병렬 호출 시 충돌한다
    for (const file of withinLimit) {
      const size = await readImageSize(file);
      const formData = new FormData();
      formData.append('file', file);
      const currentPostId = useNewPostStore.getState().postId;
      const result = await uploadImage(formData, currentPostId, 'content');
      if (result.url) {
        uploaded.push({
          src: result.url,
          alt: '',
          caption: '',
          width: size.width,
          height: size.height,
        });
        if (result.postId && !currentPostId) setPostId(result.postId);
      } else {
        failed += 1;
      }
    }

    if (uploaded.length === 0) {
      replaceUploadingNode(editorInstance, id, null);
      toast.error('업로드에 모두 실패했습니다');
      return true;
    }

    replaceUploadingNode(editorInstance, id, {
      type: 'gallery',
      attrs: { images: uploaded },
    });
    if (failed > 0) toast.error(`${failed}장 업로드에 실패했습니다`);
    return true;
  },
  [uploadAndInsert, setPostId]
);
```

- [x] **Step 8: 드롭·붙여넣기 핸들러를 다중 파일로 확장**

`editorProps`의 `handleDrop`을 아래로 교체한다.

```tsx
      handleDrop: (_view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files.length) return false;
        const files = Array.from(event.dataTransfer.files);
        if (!files.some((f) => f.type.startsWith('image/'))) return false;
        event.preventDefault();
        if (editor) uploadFiles(editor, files);
        return true;
      },
```

`handlePaste`도 같은 방식으로 교체한다.

```tsx
      handlePaste: (_view, event) => {
        const fileList = event.clipboardData?.files;
        if (!fileList?.length) return false;
        const files = Array.from(fileList);
        if (!files.some((f) => f.type.startsWith('image/'))) return false;
        event.preventDefault();
        if (editor) uploadFiles(editor, files);
        return true;
      },
```

- [x] **Step 9: 전체 테스트와 빌드 확인**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 PASS

- [x] **Step 10: 에디터에서 동작 확인**

`npm run dev` 후 `/admin/posts/new`에서 확인한다.

- 사진 1장 드래그 → 기존처럼 단일 이미지로 삽입
- 사진 3장 동시 드래그 → "3장 업로드 중..." 표시 후 갤러리로 교체, 가로로 스크롤됨
- 갤러리 클릭 → 각 슬라이드에 조작 바 표시, 캡션 입력·순서 이동·삭제 동작

- [x] **Step 11: 커밋**

```bash
git add src/app/admin/posts/new/_utils/read-image-size.ts src/app/admin/posts/new/_utils/image-uploading-extension.ts src/app/admin/posts/new/_actions/
git commit -m "✨ 이미지 여러 장 드롭 시 갤러리로 삽입"
```

---

## Task 6: 툴바 갤러리 버튼과 정리 로직 확장

**Files:**

- Modify: `src/app/admin/posts/new/_actions/editor-toolbar.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx` (파일 선택 핸들러 노출)
- Modify: `src/app/admin/posts/new/_utils/collect-image-srcs.ts`
- Modify: `src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`

**Interfaces:**

- Consumes: `collectImageSrcs` (Task 1), `uploadFiles` (Task 5), `GalleryImage` (Task 2)

- [x] **Step 1: 갤러리 src 수집 테스트를 먼저 추가**

`collect-image-srcs.test.ts` 상단 import에 `Gallery`를 더한다.

```ts
import { Gallery } from './gallery-extension';
```

`docOf` 헬퍼의 extensions에 `Gallery`를 추가한다.

```ts
function docOf(html: string) {
  return new Editor({
    extensions: [StarterKit, ImageBlock, Gallery],
    content: html,
  }).state.doc;
}
```

`describe` 블록 안에 테스트를 추가한다.

```ts
it('갤러리 안의 src도 모두 수집한다', () => {
  const doc = docOf(
    '<div data-gallery>' +
      '<figure><img src="https://cdn/g1.png" width="10" height="10"></figure>' +
      '<figure><img src="https://cdn/g2.png" width="10" height="10"></figure>' +
      '</div>'
  );
  expect(collectImageSrcs(doc)).toEqual(
    new Set(['https://cdn/g1.png', 'https://cdn/g2.png'])
  );
});

it('단일 이미지와 갤러리가 섞여 있어도 전부 수집한다', () => {
  const doc = docOf(
    '<p><img src="https://cdn/a.png" /></p>' +
      '<div data-gallery><figure><img src="https://cdn/g1.png" width="10" height="10"></figure></div>'
  );
  expect(collectImageSrcs(doc)).toEqual(
    new Set(['https://cdn/a.png', 'https://cdn/g1.png'])
  );
});
```

- [x] **Step 2: 테스트를 돌려 실패를 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`
Expected: FAIL — 갤러리 src가 수집되지 않아 빈 Set이 반환된다

- [x] **Step 3: 수집 함수 확장**

`collect-image-srcs.ts`에 import를 추가하고 갤러리 분기를 넣는다.

```ts
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { GalleryImage } from './gallery-extension';

export function collectImageSrcs(doc: ProseMirrorNode): Set<string> {
  const srcs = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs.src) {
      srcs.add(node.attrs.src as string);
    }
    if (node.type.name === 'gallery') {
      const images = (node.attrs.images ?? []) as GalleryImage[];
      images.forEach((image) => {
        if (image.src) srcs.add(image.src);
      });
    }
    return true;
  });
  return srcs;
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`
Expected: PASS (5 tests)

- [x] **Step 5: 파일 선택 핸들러를 context에 노출**

`src/app/admin/posts/new/_providers/editor.provider.tsx`를 아래로 교체한다.

```tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { Editor } from '@tiptap/react';

type UploadFiles = (files: File[]) => void;

type EditorContextValue = {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  uploadFiles: UploadFiles | null;
  setUploadFiles: (fn: UploadFiles | null) => void;
};

const EditorContext = createContext<EditorContextValue>({
  editor: null,
  setEditor: () => {},
  uploadFiles: null,
  setUploadFiles: () => {},
});

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [uploadFiles, setUploadFilesState] = useState<UploadFiles | null>(null);

  // useState에 함수를 그대로 넘기면 업데이터 함수로 해석되므로 한 번 감싼다
  const setUploadFiles = useCallback((fn: UploadFiles | null) => {
    setUploadFilesState(() => fn);
  }, []);

  return (
    <EditorContext.Provider
      value={{ editor, setEditor, uploadFiles, setUploadFiles }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return useContext(EditorContext);
}
```

`wysiwyg-editor.action.tsx`에서 context 값을 하나 더 받는다.

```tsx
const { setEditor, setUploadFiles } = useEditorContext();
```

editor를 context에 공유하는 기존 `useEffect`를 아래로 교체한다.

```tsx
useEffect(() => {
  setEditor(editor);
  setUploadFiles(
    editor ? (files: File[]) => void uploadFiles(editor, files) : null
  );
  if (editor) {
    prevImageSrcs.current = collectImageSrcs(editor.state.doc);
  }
  return () => {
    setEditor(null);
    setUploadFiles(null);
  };
}, [editor, setEditor, setUploadFiles, uploadFiles]);
```

- [x] **Step 6: 툴바 버튼 추가**

`editor-toolbar.action.tsx`에서 lucide import에 `Images`를 더하고, context에서 `uploadFiles`를 받는다.

```tsx
const { editor, uploadFiles } = useEditorContext();
```

숨김 input을 컴포넌트 안에 두고 참조한다.

```tsx
const galleryInputRef = useRef<HTMLInputElement>(null);
```

`ImageIcon` 버튼 바로 다음에 버튼과 input을 추가한다.

```tsx
      <ToolbarButton
        icon={Images}
        tooltip="갤러리"
        onClick={() => galleryInputRef.current?.click()}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) uploadFiles?.(files);
          e.target.value = '';
        }}
      />
```

> 마크다운 모드는 `if (mode === 'markdown')`에서 축약 툴바를 반환하고 끝나므로, 갤러리 버튼은 자동으로 노출되지 않는다. 별도 분기가 필요 없다.

- [x] **Step 7: 전체 테스트·린트·빌드 확인**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 PASS

- [x] **Step 8: 에디터에서 동작 확인**

`npm run dev` 후 `/admin/posts/new`에서 툴바의 갤러리 버튼을 눌러 사진 3장을 선택하면 갤러리가 삽입되는지 확인한다. 모드를 마크다운으로 바꾸면 버튼이 사라지는지도 함께 본다.

- [x] **Step 9: 커밋**

```bash
git add src/app/admin/posts/new/
git commit -m "✨ 툴바 갤러리 버튼 추가하고 정리 로직에 갤러리 포함"
```

---

## Task 7: 공개 페이지 화살표와 확대 충돌 처리

**Files:**

- Create: `src/app/(main)/posts/[slug]/_handlers/gallery-nav.handler.tsx`
- Modify: `src/app/(main)/posts/[slug]/_actions/post-content.action.tsx`
- Test: `src/app/(main)/posts/[slug]/_actions/post-content.action.test.tsx`

**Interfaces:**

- Consumes: `[data-gallery]` / `[data-gallery-wrap]` 스타일 계약 (Task 4)
- Produces: `GalleryNavHandler({ containerRef }: { containerRef: RefObject<HTMLElement | null> })` — 렌더 결과 없이 DOM에 화살표를 붙이는 사이드이펙트 전용 컴포넌트

- [x] **Step 1: 화살표 핸들러 구현**

`src/app/(main)/posts/[slug]/_handlers/gallery-nav.handler.tsx` 신규 생성. `_handlers` 폴더도 이 태스크에서 처음 생긴다.

```tsx
'use client';

import { type RefObject, useEffect } from 'react';

type Props = {
  containerRef: RefObject<HTMLElement | null>;
};

/**
 * 본문 HTML은 dangerouslySetInnerHTML로 주입되어 React가 내부에 컴포넌트를 심을 수 없다.
 * 마운트 후 [data-gallery]를 찾아 좌우 버튼을 덧붙이는 점진적 향상으로 처리한다.
 * JS가 없어도 CSS scroll-snap으로 스크롤 자체는 동작한다.
 */
export function GalleryNavHandler({ containerRef }: Props) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cleanups: (() => void)[] = [];

    root.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
      const wrap = document.createElement('div');
      wrap.setAttribute('data-gallery-wrap', '');
      gallery.parentNode?.insertBefore(wrap, gallery);
      wrap.appendChild(gallery);

      const makeButton = (direction: 'prev' | 'next') => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute(
          'aria-label',
          direction === 'prev' ? '이전 사진' : '다음 사진'
        );
        button.className = [
          'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center',
          'rounded-full border bg-background/80 backdrop-blur-sm transition-opacity',
          'hover:bg-background disabled:pointer-events-none',
          direction === 'prev' ? 'left-2' : 'right-2',
        ].join(' ');
        button.innerHTML =
          direction === 'prev'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
        button.addEventListener('click', () => {
          gallery.scrollBy({
            left:
              direction === 'prev'
                ? -gallery.clientWidth * 0.8
                : gallery.clientWidth * 0.8,
            behavior: 'smooth',
          });
        });
        wrap.appendChild(button);
        return button;
      };

      const prev = makeButton('prev');
      const next = makeButton('next');

      const sync = () => {
        const maxScroll = gallery.scrollWidth - gallery.clientWidth;
        const fits = maxScroll <= 1;
        prev.hidden = fits || gallery.scrollLeft <= 1;
        next.hidden = fits || gallery.scrollLeft >= maxScroll - 1;
      };

      sync();
      gallery.addEventListener('scroll', sync, { passive: true });
      const observer = new ResizeObserver(sync);
      observer.observe(gallery);

      cleanups.push(() => {
        gallery.removeEventListener('scroll', sync);
        observer.disconnect();
        prev.remove();
        next.remove();
        wrap.parentNode?.insertBefore(gallery, wrap);
        wrap.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [containerRef]);

  return null;
}
```

- [x] **Step 2: 확대 충돌 테스트를 먼저 추가**

`post-content.action.test.tsx`의 `describe` 블록 안에 추가한다.

```tsx
it('드래그한 뒤 뗀 클릭은 확대하지 않는다', () => {
  render(
    <PostContentAction html='<img src="/test.jpg" alt="테스트 이미지" />' />
  );
  const img = screen.getAllByAltText('테스트 이미지')[0];
  fireEvent.pointerDown(img, { clientX: 0, clientY: 0 });
  fireEvent.click(img, { clientX: 40, clientY: 0 });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('제자리 클릭은 확대한다', () => {
  render(
    <PostContentAction html='<img src="/test.jpg" alt="테스트 이미지" />' />
  );
  const img = screen.getAllByAltText('테스트 이미지')[0];
  fireEvent.pointerDown(img, { clientX: 10, clientY: 10 });
  fireEvent.click(img, { clientX: 11, clientY: 11 });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

기존 테스트가 이미 `fireEvent`를 import하고 `getAllByAltText`로 본문·확대본 두 이미지를 구분하고 있으므로 같은 방식을 따른다. 새 import는 필요 없다.

> 기존 "이미지 클릭 시 확대 다이얼로그가 열린다" 테스트는 `pointerDown` 없이 바로 `click`한다. `clickOrigin` 초기값이 `{ x: 0, y: 0 }`이고 `fireEvent.click`의 기본 좌표도 `0`이라 이동 거리는 0으로 계산되어 그대로 통과한다.

- [x] **Step 3: 테스트를 돌려 실패를 확인**

Run: `npx vitest run "src/app/(main)/posts/[slug]/_actions/post-content.action.test.tsx"`
Expected: FAIL — 드래그 후 클릭에서도 다이얼로그가 열린다

- [x] **Step 4: 확대 충돌 처리와 핸들러 연결 구현**

`post-content.action.tsx`를 수정한다. import와 ref를 추가한다.

```tsx
import { GalleryNavHandler } from '../_handlers/gallery-nav.handler';
```

컴포넌트 안에 ref 두 개를 추가한다.

```tsx
const contentRef = useRef<HTMLDivElement>(null);
const clickOrigin = useRef({ x: 0, y: 0 });
```

`handleClick` 위에 pointerdown 핸들러를 추가한다.

```tsx
const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
  clickOrigin.current = { x: event.clientX, y: event.clientY };
};
```

`handleClick` 시작부에 이동 거리 검사를 넣는다.

```tsx
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'IMG') return;
    const moved =
      Math.abs(event.clientX - clickOrigin.current.x) > 5 ||
      Math.abs(event.clientY - clickOrigin.current.y) > 5;
    if (moved) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // ...기존 로직 유지
```

본문 div에 ref와 pointerdown을 연결하고 핸들러를 형제로 렌더한다.

```tsx
      <div
        ref={contentRef}
        className="prose prose-neutral max-w-none dark:prose-invert [&_img]:cursor-zoom-in"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <GalleryNavHandler containerRef={contentRef} />
```

- [x] **Step 5: 테스트 통과 확인**

Run: `npx vitest run "src/app/(main)/posts/[slug]/_actions/post-content.action.test.tsx"`
Expected: PASS

- [x] **Step 6: 전체 테스트·린트·빌드 확인**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 PASS

- [x] **Step 7: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/"
git commit -m "✨ 갤러리 화살표 버튼과 드래그·확대 충돌 처리 추가"
```

---

## Task 8: 마크다운 파이프라인 회귀 방지와 최종 검증

**Files:**

- Modify: `src/lib/markdown.test.ts`

**Interfaces:**

- Consumes: Task 2가 정의한 갤러리 HTML 구조

- [x] **Step 1: 갤러리 HTML이 변형되지 않는지 테스트 추가**

`src/lib/markdown.test.ts` 끝에 새 `describe` 블록을 추가한다.

```ts
describe('htmlToHtmlWithToc — 갤러리', () => {
  const gallery =
    '<div data-gallery>' +
    '<figure><img src="a.png" alt="가" width="1600" height="1067"><figcaption>거실</figcaption></figure>' +
    '<figure><img src="b.png" alt="나" width="1067" height="1600"></figure>' +
    '</div>';

  it('data-gallery 구조를 그대로 통과시킨다', async () => {
    const { html } = await htmlToHtmlWithToc(gallery);
    expect(html).toContain('data-gallery');
    expect(html).toContain('src="a.png"');
    expect(html).toContain('src="b.png"');
    expect(html).toContain('width="1600"');
  });

  it('갤러리 안의 figure를 rehypeImageCaption이 건드리지 않는다', async () => {
    const { html } = await htmlToHtmlWithToc(gallery);
    expect((html.match(/<figure/g) ?? []).length).toBe(2);
    expect(html).toContain('<figcaption>거실</figcaption>');
  });
});
```

> `rehypeImageCaption`은 `<p>` 안에 `<img>` 하나만 있는 경우에만 `figure`로 변환한다. 갤러리의 `figure`는 `div` 안에 있어 대상이 아니지만, 파이프라인이 바뀌어도 깨지지 않도록 잠가둔다.

- [x] **Step 2: 테스트 실행**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: PASS — 이미 통과하는 것이 정상이다(회귀 방지용 잠금).

- [x] **Step 3: 전체 검증**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 PASS

- [x] **Step 4: 발행 화면에서 갤러리 최종 확인**

`npm run dev` 후 갤러리를 넣은 글을 발행해 상세 페이지에서 확인한다.

- 갤러리가 본문(720px) 밖으로 980px까지 펼쳐진다
- 가로·세로 사진이 섞여도 아랫줄이 맞고 잘리지 않는다
- 트랙패드·터치로 스크롤되고, 화살표 버튼이 좌우 끝에서 사라진다
- 이미지를 드래그한 뒤 놓아도 확대 다이얼로그가 열리지 않고, 제자리 클릭에서는 열린다
- 세로로 긴 단일 이미지가 화면 높이의 80%에서 멈춘다

- [x] **Step 5: 모바일 폭에서 확인하고 높이를 확정**

브라우저 창을 375px로 줄여 확인한다.

- 갤러리 bleed가 해제되고 컨테이너 폭에 맞는다
- 슬라이드 높이 `260px`에서 세로 사진이 지나치게 작지 않은지 본다. 작다면 `prose.css`의 모바일 `height`를 `280px` 또는 `320px`로 조정하고 다시 확인한다.
- 조정했다면 그 값으로 커밋한다.

- [x] **Step 6: E2E 회귀 확인**

Run: `npm run test:e2e`
Expected: `e2e/ralli.spec.ts:45`("모바일 › 가로 스크롤이 발생하지 않는다")를 제외하고 통과. 이 1건은 `develop`에서도 재현되는 사전 존재 실패로 확인된 항목이다. **다른 테스트가 새로 깨지면 갤러리의 `overflow-x`가 페이지 전체 가로 스크롤을 유발한 것이므로 반드시 조사한다.**

- [x] **Step 7: 계획 문서 완료 표기와 커밋**

이 문서의 모든 `- [ ]`를 `- [x]`로 바꾸고 상단에 완료 일자와 결과 요약을 추가한다.

```bash
git add docs/superpowers/plans/2026-08-17-post-gallery.md src/styles/prose.css src/lib/markdown.test.ts
git commit -m "📝 갤러리 구현 완료 기록"
```

- [ ] **Step 8: PR 생성**

```bash
git push -u origin feature/post-gallery
```

`develop`을 대상으로 PR을 올린다. 머지는 `--no-ff`(squash 금지)로 한다.

---

## 검증 요약

| 항목                       | 확인 방법                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------ |
| 노드 직렬화 왕복           | `npx vitest run src/app/admin/posts/new/_utils/gallery-extension.test.ts`            |
| 슬라이드 편집              | `npx vitest run src/app/admin/posts/new/_components/_gallery/`                       |
| 이미지 정리(단일+갤러리)   | `npx vitest run src/app/admin/posts/new/_utils/collect-image-srcs.test.ts`           |
| 마크다운 파이프라인 무변형 | `npx vitest run src/lib/markdown.test.ts`                                            |
| 드래그·확대 충돌           | `npx vitest run "src/app/(main)/posts/[slug]/_actions/post-content.action.test.tsx"` |
| 전체                       | `npm run test:run && npm run lint && npm run build`                                  |
| 가로 스크롤 회귀           | `npm run test:e2e`                                                                   |

## 범위 밖 (이 계획에서 하지 않는 것)

- 드래그 앤 드롭 순서 변경 — `←` `→` 버튼으로 충분하다
- 갤러리 내 개별 이미지 크기 조절 — 높이 고정이 전제다
- 도트 인디케이터 — 스크롤바가 위치를 알려준다
- 마크다운 모드에서의 갤러리 작성 — HTML 전용이다
- 기존에 쌓인 고아 이미지 소급 정리 — Task 1은 앞으로의 삭제만 처리한다
- 모바일 edge-to-edge 갤러리
- `e2e/ralli.spec.ts:45`의 사전 존재 실패
