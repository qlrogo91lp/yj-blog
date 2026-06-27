# SEO 풀패키지 개선 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 작성 폼에 SEO 메타 입력 UI를 추가하고, 글 상세 페이지가 OG·Twitter Cards·canonical·JSON-LD `BlogPosting`·이미지 alt까지 완전한 SEO 메타데이터를 출력하도록 한다.

**Architecture:** 세 영역 — (1) 글 작성/수정 폼에 collapsible "SEO 설정" 섹션 + excerpt 자동 채움 handler, (2) 글 상세의 `generateMetadata` 확장 + JSON-LD `<script>` 컴포넌트, (3) `ImageToolbar`에 alt 입력 popover.

**Tech Stack:** Next.js 16 Metadata API, React 19, TipTap, Zustand, shadcn/ui (Popover), Vitest, @testing-library/react

**참고 design:** `.claude/seo-design.md`

---

## Task 1: `extractExcerpt` 헬퍼

**Files:**
- Create: `src/app/admin/posts/new/_utils/extract-excerpt.ts`
- Test: `src/app/admin/posts/new/_utils/extract-excerpt.test.ts`

- [ ] **Step 1: failing test 작성**

`src/app/admin/posts/new/_utils/extract-excerpt.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { extractExcerpt } from './extract-excerpt';

describe('extractExcerpt', () => {
  it('HTML 태그를 제거한다', () => {
    expect(extractExcerpt('<h2>제목</h2><p>본문 내용</p>')).toBe(
      '제목 본문 내용',
    );
  });

  it('연속 공백을 단일 공백으로 압축한다', () => {
    expect(extractExcerpt('<p>안녕   하세요\n\n오늘은</p>')).toBe(
      '안녕 하세요 오늘은',
    );
  });

  it('&nbsp; 등 엔티티를 공백으로 변환한다', () => {
    expect(extractExcerpt('<p>안녕&nbsp;하세요</p>')).toBe('안녕 하세요');
  });

  it('maxLength 초과 시 단어 경계에서 자르고 …를 붙인다', () => {
    const long = '<p>' + '가나다라마바사 '.repeat(50) + '</p>';
    const result = extractExcerpt(long, 20);
    expect(result.length).toBeLessThanOrEqual(21);
    expect(result.endsWith('…')).toBe(true);
  });

  it('빈 문자열을 입력하면 빈 문자열을 반환한다', () => {
    expect(extractExcerpt('')).toBe('');
  });

  it('태그만 있고 텍스트가 없으면 빈 문자열을 반환한다', () => {
    expect(extractExcerpt('<p></p><img src="x" /><br>')).toBe('');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/extract-excerpt.test.ts`
Expected: FAIL with "Cannot find module './extract-excerpt'"

- [ ] **Step 3: 구현**

`src/app/admin/posts/new/_utils/extract-excerpt.ts`:

```typescript
export function extractExcerpt(html: string, maxLength = 200): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_utils/extract-excerpt.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_utils/extract-excerpt.ts \
  src/app/admin/posts/new/_utils/extract-excerpt.test.ts
git commit -m "feat: extractExcerpt 헬퍼 추가 (본문 첫 N자 추출)"
```

---

## Task 2: `_store.ts`에 SEO 필드 추가

**Files:**
- Modify: `src/app/admin/posts/new/_store.ts`

- [ ] **Step 1: State 타입에 새 필드 3개 추가**

`src/app/admin/posts/new/_store.ts`의 `type State`에 다음 3줄 추가 (excerpt 옆에):

```typescript
excerpt: string;
excerptIsManual: boolean;
metaTitle: string;
metaDescription: string;
```

- [ ] **Step 2: Action 타입에 새 setter 3개 추가**

`type Action`에 추가:

```typescript
setExcerptIsManual: (manual: boolean) => void;
setMetaTitle: (title: string) => void;
setMetaDescription: (description: string) => void;
```

- [ ] **Step 3: initializePost 인자에 새 필드 추가**

`initializePost` 인자 타입에 추가:

```typescript
excerpt: string;
metaTitle: string;
metaDescription: string;
```

- [ ] **Step 4: 초기값 / setter / reset / initializePost 구현**

`useNewPostStore` 안에 다음 추가:

```typescript
// 초기값 영역
excerptIsManual: false,
metaTitle: '',
metaDescription: '',

// setter 영역
setExcerptIsManual: (excerptIsManual) => set({ excerptIsManual }),
setMetaTitle: (metaTitle) => set({ metaTitle }),
setMetaDescription: (metaDescription) => set({ metaDescription }),
```

`reset` 함수의 set 객체에 추가:

```typescript
excerptIsManual: false,
metaTitle: '',
metaDescription: '',
```

`initializePost` 함수 내부 set 인자 다음으로 변경:

```typescript
initializePost: (data) =>
  set({
    ...data,
    mode: data.contentFormat === 'markdown' ? 'markdown' : 'wysiwyg',
    excerptIsManual: !!data.excerpt,
    saveStatus: 'idle',
    lastSavedAt: null,
  }),
```

- [ ] **Step 5: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 새 필드 관련 에러 없음 (다른 곳의 기존 에러는 무관)

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_store.ts
git commit -m "feat: store에 SEO 필드(metaTitle, metaDescription, excerptIsManual) 추가"
```

---

## Task 3: `CharacterCounter` 컴포넌트

**Files:**
- Create: `src/app/admin/posts/new/_components/character-counter.tsx`
- Test: `src/app/admin/posts/new/_components/character-counter.test.tsx`

- [ ] **Step 1: failing test 작성**

`src/app/admin/posts/new/_components/character-counter.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterCounter } from './character-counter';

describe('CharacterCounter', () => {
  it('현재 글자수와 권장 최대를 "n / max" 형식으로 표시한다', () => {
    render(<CharacterCounter value="안녕하세요" recommendedMax={60} />);
    expect(screen.getByText('5 / 60')).toBeInTheDocument();
  });

  it('권장 범위 내일 때 muted 색상 클래스를 가진다', () => {
    const { container } = render(
      <CharacterCounter value="짧음" recommendedMax={60} />,
    );
    expect(container.firstChild).toHaveClass('text-muted-foreground');
  });

  it('권장 초과 시 yellow 색상 클래스를 가진다', () => {
    const { container } = render(
      <CharacterCounter value={'가'.repeat(61)} recommendedMax={60} />,
    );
    expect(container.firstChild).toHaveClass('text-yellow-600');
  });

  it('hardMax 초과 시 destructive 색상 클래스를 가진다', () => {
    const { container } = render(
      <CharacterCounter
        value={'가'.repeat(101)}
        recommendedMax={60}
        hardMax={100}
      />,
    );
    expect(container.firstChild).toHaveClass('text-destructive');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/character-counter.test.tsx`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 구현**

`src/app/admin/posts/new/_components/character-counter.tsx`:

```typescript
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  recommendedMax: number;
  hardMax?: number;
};

export function CharacterCounter({ value, recommendedMax, hardMax }: Props) {
  const length = value.length;
  const overHard = hardMax !== undefined && length > hardMax;
  const overRecommended = !overHard && length > recommendedMax;

  return (
    <span
      className={cn(
        'text-xs',
        !overRecommended && !overHard && 'text-muted-foreground',
        overRecommended && 'text-yellow-600',
        overHard && 'text-destructive',
      )}
    >
      {length} / {recommendedMax}
    </span>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/character-counter.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_components/character-counter.tsx \
  src/app/admin/posts/new/_components/character-counter.test.tsx
git commit -m "feat: CharacterCounter 컴포넌트 추가"
```

---

## Task 4: `SeoSectionAction` (collapsible SEO 입력 섹션)

**Files:**
- Create: `src/app/admin/posts/new/_actions/seo-section-action.tsx`
- Test: `src/app/admin/posts/new/_actions/seo-section-action.test.tsx`

- [ ] **Step 1: failing test 작성**

`src/app/admin/posts/new/_actions/seo-section-action.test.tsx`:

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeoSectionAction } from './seo-section-action';
import { useNewPostStore } from '../_store';

describe('SeoSectionAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('토글 버튼이 보이고 클릭 시 입력 필드가 펼쳐진다', () => {
    render(<SeoSectionAction />);
    expect(screen.queryByLabelText('요약 (excerpt)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    expect(screen.getByLabelText('요약 (excerpt)')).toBeInTheDocument();
    expect(screen.getByLabelText('SEO 제목 (meta title)')).toBeInTheDocument();
    expect(
      screen.getByLabelText('SEO 설명 (meta description)'),
    ).toBeInTheDocument();
  });

  it('excerpt 입력 시 store가 업데이트되고 excerptIsManual=true로 바뀐다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    fireEvent.change(screen.getByLabelText('요약 (excerpt)'), {
      target: { value: '직접 입력한 요약' },
    });
    expect(useNewPostStore.getState().excerpt).toBe('직접 입력한 요약');
    expect(useNewPostStore.getState().excerptIsManual).toBe(true);
  });

  it('metaTitle 입력 시 store가 업데이트된다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    fireEvent.change(screen.getByLabelText('SEO 제목 (meta title)'), {
      target: { value: '검색용 제목' },
    });
    expect(useNewPostStore.getState().metaTitle).toBe('검색용 제목');
  });

  it('metaDescription 입력 시 store가 업데이트된다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    fireEvent.change(screen.getByLabelText('SEO 설명 (meta description)'), {
      target: { value: '검색용 설명' },
    });
    expect(useNewPostStore.getState().metaDescription).toBe('검색용 설명');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/seo-section-action.test.tsx`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 구현**

`src/app/admin/posts/new/_actions/seo-section-action.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNewPostStore } from '../_store';
import { CharacterCounter } from '../_components/character-counter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function SeoSectionAction() {
  const [open, setOpen] = useState(false);
  const excerpt = useNewPostStore((s) => s.excerpt);
  const setExcerpt = useNewPostStore((s) => s.setExcerpt);
  const setExcerptIsManual = useNewPostStore((s) => s.setExcerptIsManual);
  const metaTitle = useNewPostStore((s) => s.metaTitle);
  const setMetaTitle = useNewPostStore((s) => s.setMetaTitle);
  const metaDescription = useNewPostStore((s) => s.metaDescription);
  const setMetaDescription = useNewPostStore((s) => s.setMetaDescription);

  return (
    <section className="mt-6 rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 cursor-pointer"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        SEO 설정
      </button>
      <div className={cn('space-y-4 px-4 pb-4', !open && 'hidden')}>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="seo-excerpt">요약 (excerpt)</Label>
            <CharacterCounter
              value={excerpt}
              recommendedMax={200}
              hardMax={500}
            />
          </div>
          <Textarea
            id="seo-excerpt"
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              setExcerptIsManual(true);
            }}
            placeholder="글 목록과 SEO 설명에 쓰입니다. 비우면 본문에서 자동 추출됩니다."
            rows={3}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="seo-meta-title">SEO 제목 (meta title)</Label>
            <CharacterCounter
              value={metaTitle}
              recommendedMax={60}
              hardMax={100}
            />
          </div>
          <Input
            id="seo-meta-title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="비우면 글 제목이 그대로 사용됩니다 (50–60자 권장)"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="seo-meta-description">
              SEO 설명 (meta description)
            </Label>
            <CharacterCounter
              value={metaDescription}
              recommendedMax={160}
              hardMax={200}
            />
          </div>
          <Textarea
            id="seo-meta-description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="비우면 요약(excerpt)이 사용됩니다 (150–160자 권장)"
            rows={3}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/seo-section-action.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_actions/seo-section-action.tsx \
  src/app/admin/posts/new/_actions/seo-section-action.test.tsx
git commit -m "feat: SeoSectionAction collapsible 입력 섹션 추가"
```

---

## Task 5: `ExcerptAutoFillHandler`

**Files:**
- Create: `src/app/admin/posts/new/_handlers/excerpt-auto-fill-handler.tsx`

- [ ] **Step 1: 구현**

`src/app/admin/posts/new/_handlers/excerpt-auto-fill-handler.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useNewPostStore } from '../_store';
import { extractExcerpt } from '../_utils/extract-excerpt';

export function ExcerptAutoFillHandler() {
  const content = useNewPostStore((s) => s.content);
  const excerptIsManual = useNewPostStore((s) => s.excerptIsManual);
  const setExcerpt = useNewPostStore((s) => s.setExcerpt);

  useEffect(() => {
    if (excerptIsManual) return;
    setExcerpt(extractExcerpt(content));
  }, [content, excerptIsManual, setExcerpt]);

  return null;
}
```

- [ ] **Step 2: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 새 파일 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_handlers/excerpt-auto-fill-handler.tsx
git commit -m "feat: ExcerptAutoFillHandler — 본문 변경 시 excerpt 자동 채움"
```

---

## Task 6: `save-post.ts` / `submit-post.ts`에 메타 필드 저장

**Files:**
- Modify: `src/app/admin/posts/new/_services/save-post.ts`
- Modify: `src/app/admin/posts/new/_services/submit-post.ts`

- [ ] **Step 1: `SavePostInput` 타입에 필드 추가**

`save-post.ts`의 `SavePostInput`에 추가:

```typescript
metaTitle?: string;
metaDescription?: string;
```

- [ ] **Step 2: `parsed.data`에서 새 필드 destructure**

`save-post.ts:40` 라인을 다음으로 교체:

```typescript
const {
  title,
  slug,
  content,
  contentFormat,
  excerpt,
  categoryId,
  status,
  metaTitle,
  metaDescription,
} = parsed.data;
```

- [ ] **Step 3: UPDATE / INSERT payload에 필드 추가**

`save-post.ts:48~58`의 `updateData` 객체에 추가:

```typescript
metaTitle: metaTitle ?? null,
metaDescription: metaDescription ?? null,
```

`save-post.ts:77~88`의 INSERT `.values({...})`에 동일 추가:

```typescript
metaTitle: metaTitle ?? null,
metaDescription: metaDescription ?? null,
```

또한 INSERT/UPDATE 모두 `excerpt`가 빈 문자열이면 `null`로 변환되도록 다음 보장:

```typescript
excerpt: excerpt && excerpt.length > 0 ? excerpt : null,
```

(빈 문자열도 null로 통일)

- [ ] **Step 4: `submit-post.ts`에 store 필드 전달**

`submit-post.ts`의 `savePost` 호출 인자에 추가:

```typescript
const result = await savePost({
  postId: store.postId,
  title: store.title,
  slug,
  content: store.content,
  contentFormat: store.contentFormat,
  excerpt: store.excerpt,
  categoryId: store.categoryId,
  tagIds: store.tagIds,
  thumbnailUrl: store.thumbnailUrl,
  status,
  publishedAt: store.publishedAt,
  metaTitle: store.metaTitle,
  metaDescription: store.metaDescription,
});
```

- [ ] **Step 5: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_services/save-post.ts \
  src/app/admin/posts/new/_services/submit-post.ts
git commit -m "feat: save-post에 metaTitle/metaDescription 저장 추가"
```

---

## Task 7: `PostInitHandler`에 새 필드 초기화

**Files:**
- Modify: `src/app/admin/posts/[id]/edit/_handlers/post-init-handler.tsx`

- [ ] **Step 1: `initializePost` 호출에 새 필드 3개 추가**

`post-init-handler.tsx:14~26` 블록을 다음으로 교체:

```typescript
useNewPostStore.getState().initializePost({
  postId: post.id,
  title: post.title,
  content: post.content,
  contentFormat: post.contentFormat as 'markdown' | 'html',
  categoryId: post.categoryId,
  tagIds: initialTagIds,
  slug: post.slug,
  excerpt: post.excerpt ?? '',
  metaTitle: post.metaTitle ?? '',
  metaDescription: post.metaDescription ?? '',
  thumbnailUrl: post.thumbnailUrl ?? null,
  status: post.status,
  publishedAt: post.publishedAt,
});
```

- [ ] **Step 2: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/[id]/edit/_handlers/post-init-handler.tsx
git commit -m "feat: 글 수정 진입 시 metaTitle/metaDescription 초기화"
```

---

## Task 8: `new/page.tsx` + `edit/page.tsx`에 SEO 섹션 + handler 등록

**Files:**
- Modify: `src/app/admin/posts/new/page.tsx`
- Modify: `src/app/admin/posts/[id]/edit/page.tsx`

- [ ] **Step 1: import 추가 (new)**

`src/app/admin/posts/new/page.tsx` 상단 imports에 추가:

```typescript
import { SeoSectionAction } from './_actions/seo-section-action';
import { ExcerptAutoFillHandler } from './_handlers/excerpt-auto-fill-handler';
```

- [ ] **Step 2: JSX 구성 변경 (new)**

`<EditorViewHandler />` 다음, `</div>` 닫기 전에 `<SeoSectionAction />` 추가하고, `<EditorProvider>` 직접 자식으로 `<ExcerptAutoFillHandler />` 추가:

```tsx
<EditorProvider>
  <ExcerptAutoFillHandler />
  <div className="flex flex-1 flex-col">
    <EditorToolbarAction />
    <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
      <CategorySelectorAction categories={categories} />
      <TagSelectorAction allTags={tags} />
      <ThumbnailUploadAction />
      <TitleInputAction />
      <div className="mt-4 flex-1">
        <EditorViewHandler />
      </div>
      <SeoSectionAction />
    </div>
    <BottomBar />
  </div>

  <AutoSaveProvider />
</EditorProvider>
```

- [ ] **Step 3: import 추가 (edit)**

`src/app/admin/posts/[id]/edit/page.tsx` 상단 imports에 추가:

```typescript
import { SeoSectionAction } from '../../new/_actions/seo-section-action';
import { ExcerptAutoFillHandler } from '../../new/_handlers/excerpt-auto-fill-handler';
```

- [ ] **Step 4: JSX 구성 변경 (edit)**

new와 동일한 위치에 두 컴포넌트 삽입:

```tsx
<EditorProvider>
  <PostInitHandler post={post} initialTagIds={postTagList.map((t) => t.id)} />
  <ExcerptAutoFillHandler />
  <div className="flex flex-1 flex-col">
    <EditorToolbarAction />
    <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
      <CategorySelectorAction categories={categories} />
      <TagSelectorAction allTags={allTags} />
      <ThumbnailUploadAction />
      <TitleInputAction />
      <div className="mt-4 flex-1">
        <EditorViewHandler />
      </div>
      <SeoSectionAction />
    </div>
    <BottomBar />
  </div>
  <AutoSaveProvider />
</EditorProvider>
```

- [ ] **Step 5: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/page.tsx \
  src/app/admin/posts/[id]/edit/page.tsx
git commit -m "feat: 글 작성/수정 페이지에 SEO 섹션과 자동 채움 handler 등록"
```

---

## Task 9: `ImageToolbar`에 alt 입력 popover 추가

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx`
- Modify: `src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`

- [ ] **Step 1: failing test 추가**

`image-toolbar.test.tsx`의 `describe` 블록 안에 다음 테스트 추가:

```typescript
it('alt 설정 톱니 버튼이 렌더된다', () => {
  render(<ImageToolbar {...baseProps} alt="" onAltChange={vi.fn()} />);
  expect(
    screen.getByRole('button', { name: '대체 텍스트 설정' }),
  ).toBeInTheDocument();
});

it('톱니 버튼 클릭 시 alt input이 표시된다', () => {
  render(<ImageToolbar {...baseProps} alt="기존 alt" onAltChange={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '대체 텍스트 설정' }));
  const input = screen.getByLabelText('대체 텍스트 (alt)');
  expect(input).toHaveValue('기존 alt');
});

it('alt input 변경 시 onAltChange가 호출된다', () => {
  const onAltChange = vi.fn();
  render(
    <ImageToolbar {...baseProps} alt="" onAltChange={onAltChange} />,
  );
  fireEvent.click(screen.getByRole('button', { name: '대체 텍스트 설정' }));
  fireEvent.change(screen.getByLabelText('대체 텍스트 (alt)'), {
    target: { value: '바뀐 alt' },
  });
  expect(onAltChange).toHaveBeenCalledWith('바뀐 alt');
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`
Expected: FAIL — 톱니 버튼 없음

- [ ] **Step 3: `ImageToolbar` 본 구현 변경**

`image-toolbar.tsx` 전체를 다음으로 교체:

```typescript
'use client';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronsLeftRight,
  LucideIcon,
  Settings,
  Trash2,
} from 'lucide-react';
import type { ImageAlign, ImageSize } from '../../_utils/image-extension';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  size: ImageSize;
  align: ImageAlign;
  alt: string;
  onSizeChange: (size: ImageSize) => void;
  onAlignChange: (align: ImageAlign) => void;
  onAltChange: (alt: string) => void;
  onDelete: () => void;
};

const sizeOptions: { value: ImageSize; label: string; icon?: LucideIcon }[] = [
  { value: 'small', label: '40%' },
  { value: 'medium', label: '70%' },
  { value: 'full', label: '100%', icon: ChevronsLeftRight },
];

const alignOptions: {
  value: ImageAlign;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'left', label: '왼쪽 정렬', icon: AlignLeft },
  { value: 'center', label: '가운데 정렬', icon: AlignCenter },
  { value: 'right', label: '오른쪽 정렬', icon: AlignRight },
];

export function ImageToolbar({
  size,
  align,
  alt,
  onSizeChange,
  onAlignChange,
  onAltChange,
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
          className={cn(
            'rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer',
            align === value &&
              !alignDisabled &&
              'bg-primary text-primary-foreground hover:bg-muted-foreground',
            alignDisabled && 'cursor-not-allowed',
          )}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      {sizeOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={size === value}
          onClick={() => onSizeChange(value)}
          className={cn(
            'rounded px-2 py-1 text-xs hover:bg-accent cursor-pointer',
            size === value &&
              'bg-primary text-primary-foreground hover:bg-muted-foreground',
          )}
        >
          {Icon ? <Icon size={16} /> : label}
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="대체 텍스트 설정"
            className="rounded p-1.5 hover:bg-accent cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="w-72">
          <Label htmlFor="image-alt-input" className="mb-1 block text-xs">
            대체 텍스트 (alt)
          </Label>
          <Input
            id="image-alt-input"
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="이미지를 설명하는 짧은 문장"
          />
        </PopoverContent>
      </Popover>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        aria-label="이미지 삭제"
        onClick={onDelete}
        className="rounded p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 기존 테스트의 baseProps에 alt/onAltChange 추가**

`image-toolbar.test.tsx`의 `baseProps`를 다음으로 교체:

```typescript
const baseProps = {
  size: 'medium' as const,
  align: 'center' as const,
  alt: '',
  onSizeChange: vi.fn(),
  onAlignChange: vi.fn(),
  onAltChange: vi.fn(),
  onDelete: vi.fn(),
};
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx \
  src/app/admin/posts/new/_components/_image-block/image-toolbar.test.tsx
git commit -m "feat: ImageToolbar에 alt 입력 popover 추가"
```

---

## Task 10: `ImageNodeView`에서 alt prop 연결

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx`

- [ ] **Step 1: ImageToolbar 호출에 alt/onAltChange 전달**

`image-node-view.tsx`의 `<ImageToolbar>` 호출을 다음으로 교체:

```tsx
<ImageToolbar
  size={size}
  align={align}
  alt={alt}
  onSizeChange={(next) => updateAttributes({ size: next })}
  onAlignChange={(next) => updateAttributes({ align: next })}
  onAltChange={(next) => updateAttributes({ alt: next })}
  onDelete={() => deleteNode()}
/>
```

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-node-view.tsx
git commit -m "feat: ImageNodeView에서 alt 양방향 바인딩"
```

---

## Task 11: 사이트 기본 OG 이미지 안내

**Files:**
- Create: `public/og-default.png` (수동 작업)

- [ ] **Step 1: 1200×630 OG 기본 이미지 준비**

사용자가 직접 1200×630 PNG를 만들어 `public/og-default.png`로 저장. 다음 조건 만족:
- 1200×630 픽셀 (Facebook 권장 비율)
- 제목·로고가 한눈에 보이는 디자인
- 파일 크기 1MB 이하

> 임시로 빈 placeholder 이미지를 둬도 빌드는 진행 가능하지만, 실제 SNS 카드 미리보기 검증은 디자인 완성 후 수행.

- [ ] **Step 2: git add & 커밋 (이미지 파일이 준비된 후)**

```bash
git add public/og-default.png
git commit -m "feat: 사이트 기본 OG 이미지 추가"
```

---

## Task 12: root `layout.tsx`에 `metadataBase` + 기본 OG/Twitter

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: `generateMetadata` 확장**

`src/app/layout.tsx`의 `generateMetadata` 함수를 다음으로 교체:

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlogSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const siteName = settings?.blogName ?? SITE_NAME;
  const description = settings?.defaultMetaDescription ?? SITE_DESCRIPTION;

  return {
    metadataBase: new URL(baseUrl),
    title: siteName,
    description,
    alternates: {
      types: {
        'application/rss+xml': '/feed.xml',
      },
    },
    openGraph: {
      siteName,
      type: 'website',
      images: ['/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-default.png'],
    },
  };
}
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공 (warning 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/app/layout.tsx
git commit -m "feat: root layout에 metadataBase와 기본 OG/Twitter 메타 추가"
```

---

## Task 13: `posts/[slug]/page.tsx` `generateMetadata` 확장 (OG/Twitter/canonical)

**Files:**
- Modify: `src/app/(main)/posts/[slug]/page.tsx`

- [ ] **Step 1: `generateMetadata` 확장**

`src/app/(main)/posts/[slug]/page.tsx`의 `generateMetadata`를 다음으로 교체:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const ogImage = post.thumbnailUrl ?? '/og-default.png';
  const url = `/posts/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      images: [ogImage],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : undefined,
      tags: post.tags.map((t) => t.name),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/\(main\)/posts/\[slug\]/page.tsx
git commit -m "feat: 글 상세 generateMetadata에 OG/Twitter/canonical 추가"
```

---

## Task 14: `buildArticleJsonLd` 헬퍼 + 테스트

**Files:**
- Create: `src/app/(main)/posts/[slug]/_utils/build-article-json-ld.ts`
- Test: `src/app/(main)/posts/[slug]/_utils/build-article-json-ld.test.ts`

- [ ] **Step 1: failing test 작성**

`src/app/(main)/posts/[slug]/_utils/build-article-json-ld.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildArticleJsonLd } from './build-article-json-ld';

const basePost = {
  title: '테스트 글',
  slug: 'test-post',
  excerpt: '요약',
  metaTitle: null,
  metaDescription: null,
  thumbnailUrl: null,
  publishedAt: new Date('2026-04-20T00:00:00Z'),
  updatedAt: new Date('2026-04-25T00:00:00Z'),
};

describe('buildArticleJsonLd', () => {
  it('필수 필드를 모두 포함한다', () => {
    const json = buildArticleJsonLd({
      post: basePost,
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });

    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('BlogPosting');
    expect(json.headline).toBe('테스트 글');
    expect(json.description).toBe('요약');
    expect(json.url).toBe('https://yjlogs.com/posts/test-post');
    expect(json.mainEntityOfPage).toBe('https://yjlogs.com/posts/test-post');
    expect(json.datePublished).toBe('2026-04-20T00:00:00.000Z');
    expect(json.dateModified).toBe('2026-04-25T00:00:00.000Z');
  });

  it('thumbnailUrl이 없으면 og-default.png 절대 URL이 image로 채워진다', () => {
    const json = buildArticleJsonLd({
      post: basePost,
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.image).toBe('https://yjlogs.com/og-default.png');
  });

  it('thumbnailUrl이 있으면 그대로 image에 사용된다', () => {
    const json = buildArticleJsonLd({
      post: { ...basePost, thumbnailUrl: 'https://r2/thumb.png' },
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.image).toBe('https://r2/thumb.png');
  });

  it('metaTitle/metaDescription이 있으면 우선 사용한다', () => {
    const json = buildArticleJsonLd({
      post: {
        ...basePost,
        metaTitle: 'SEO 제목',
        metaDescription: 'SEO 설명',
      },
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.headline).toBe('SEO 제목');
    expect(json.description).toBe('SEO 설명');
  });

  it('author와 publisher에 blogName을 사용한다', () => {
    const json = buildArticleJsonLd({
      post: basePost,
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.author).toEqual({ '@type': 'Person', name: 'YJlogs' });
    expect(json.publisher).toEqual({
      '@type': 'Organization',
      name: 'YJlogs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yjlogs.com/og-default.png',
      },
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/\(main\)/posts/\[slug\]/_utils/build-article-json-ld.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 구현**

`src/app/(main)/posts/[slug]/_utils/build-article-json-ld.ts`:

```typescript
type PostInput = {
  title: string;
  slug: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
};

type Args = {
  post: PostInput;
  blogName: string;
  baseUrl: string;
};

export function buildArticleJsonLd({
  post,
  blogName,
  baseUrl,
}: Args): Record<string, unknown> {
  const url = `${baseUrl}/posts/${post.slug}`;
  const image = post.thumbnailUrl ?? `${baseUrl}/og-default.png`;
  const headline = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? '';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    image,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : undefined,
    author: { '@type': 'Person', name: blogName },
    publisher: {
      '@type': 'Organization',
      name: blogName,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-default.png`,
      },
    },
    url,
    mainEntityOfPage: url,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/\(main\)/posts/\[slug\]/_utils/build-article-json-ld.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add 'src/app/(main)/posts/[slug]/_utils/build-article-json-ld.ts' \
  'src/app/(main)/posts/[slug]/_utils/build-article-json-ld.test.ts'
git commit -m "feat: buildArticleJsonLd 헬퍼 추가"
```

---

## Task 15: `ArticleJsonLd` 컴포넌트

**Files:**
- Create: `src/app/(main)/posts/[slug]/_components/article-json-ld.tsx`

- [ ] **Step 1: 구현**

`src/app/(main)/posts/[slug]/_components/article-json-ld.tsx`:

```typescript
import { buildArticleJsonLd } from '../_utils/build-article-json-ld';

type Props = {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
    updatedAt: Date | null;
  };
  blogName: string;
  baseUrl: string;
};

export function ArticleJsonLd({ post, blogName, baseUrl }: Props) {
  const json = buildArticleJsonLd({ post, blogName, baseUrl });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add 'src/app/(main)/posts/[slug]/_components/article-json-ld.tsx'
git commit -m "feat: ArticleJsonLd 컴포넌트 추가"
```

---

## Task 16: 글 상세 페이지에 `<ArticleJsonLd />` 등록

**Files:**
- Modify: `src/app/(main)/posts/[slug]/page.tsx`

- [ ] **Step 1: import 추가**

`src/app/(main)/posts/[slug]/page.tsx` 상단에 추가:

```typescript
import { ArticleJsonLd } from './_components/article-json-ld';
import { getBlogSettings } from '@/db/queries/settings';
import { SITE_NAME } from '@/lib/constants';
```

- [ ] **Step 2: 페이지 컴포넌트에서 settings 조회 + 컴포넌트 출력**

`PostPage` 함수 안 `getPostBySlug` 호출과 병렬로 settings 조회:

```typescript
const [post, settings] = await Promise.all([
  getPostBySlug(slug),
  getBlogSettings(),
]);
```

JSX 최상단(`<>` 바로 다음)에 `<ArticleJsonLd>` 추가:

```tsx
return (
  <>
    <ArticleJsonLd
      post={post}
      blogName={settings?.blogName ?? SITE_NAME}
      baseUrl={process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}
    />
    <div className="mx-auto max-w-5xl px-4 py-8">
      ...
```

- [ ] **Step 3: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 관련 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add 'src/app/(main)/posts/[slug]/page.tsx'
git commit -m "feat: 글 상세 페이지에 ArticleJsonLd 출력"
```

---

## Task 17: 수동 검증 + 마무리

- [ ] **Step 1: 개발 서버 실행 + 작성 흐름 확인**

Run: `npm run dev`

- [ ] `/admin/posts/new` 진입 → "SEO 설정" 토글 보임 → 클릭 시 펼쳐짐
- [ ] 본문 입력 시 excerpt textarea가 자동으로 채워짐
- [ ] excerpt를 직접 수정하면 이후 본문이 바뀌어도 자동으로 안 바뀜
- [ ] metaTitle 60자 초과 시 카운터가 yellow, 100자 초과 시 destructive 색상
- [ ] metaDescription 160자 / 200자 동일
- [ ] 이미지 클릭 → 툴바에 톱니 버튼 보임 → 클릭 시 툴바 아래(이미지 위)에 popover로 alt input 노출 → 입력 후 외부 클릭 시 닫힘 + 값 유지

- [ ] **Step 2: 글 발행 후 상세 페이지 메타 검증**

브라우저 view source로 확인:

- [ ] `<title>`, `<meta name="description">`
- [ ] `<link rel="canonical" href="https://...../posts/...">`
- [ ] `<meta property="og:type" content="article">`
- [ ] `<meta property="og:title">`, `og:description`, `og:image`, `og:url`
- [ ] `<meta property="article:published_time">`, `article:modified_time`, `article:tag`
- [ ] `<meta name="twitter:card" content="summary_large_image">`, `twitter:title`, `twitter:description`, `twitter:image`
- [ ] `<script type="application/ld+json">` 안에 `BlogPosting` JSON

- [ ] **Step 3: Rich Results Test**

브라우저에서 https://search.google.com/test/rich-results 접속 → 발행한 글의 절대 URL 입력 (로컬 dev이면 ngrok 등으로 노출 후 검사) → `BlogPosting` 인식 + 오류 0건 확인

- [ ] **Step 4: SNS 카드 미리보기**

카카오톡 / Slack / Discord 임의 채팅창에 글 URL 붙여넣기 → 카드(제목·설명·이미지) 정상 표시

- [ ] **Step 5: 썸네일 없는 글의 fallback 확인**

`thumbnailUrl`이 비어 있는 글 작성 → 위 검증 반복 → OG 이미지가 `og-default.png`로 fallback

- [ ] **Step 6: 회귀 테스트**

Run: `npx vitest run`
Expected: 모든 테스트 PASS

Run: `npm run lint`
Expected: 경고/에러 없음

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 7: develop 브랜치로 PR 준비**

`feature/seo-improvements` 브랜치에서 작업했다면 develop으로 PR 생성. Task별 커밋 보존.

---

## Self-Review

- ✅ **Spec coverage**: design 변경 단위 3영역(글 작성 폼 / 글 상세 메타데이터 / alt 입력)이 Task 1~16에 모두 매핑. 입력 UI(Task 1~8), alt(Task 9~10), OG/Twitter/canonical(Task 12~13), JSON-LD(Task 14~16), 기본 자산(Task 11)
- ✅ **Placeholder scan**: TBD/TODO 없음, 모든 코드 블록이 완전한 형태
- ✅ **Type consistency**: store 필드명(`metaTitle`/`metaDescription`/`excerptIsManual`), 헬퍼 시그니처(`extractExcerpt(html, maxLength)`, `buildArticleJsonLd({post, blogName, baseUrl})`), props 이름(`alt`/`onAltChange`)이 task 간 일관됨
- ✅ **fallback 일관성**: `NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'`을 root layout, posts/[slug] page, sitemap 모두 동일하게 사용
