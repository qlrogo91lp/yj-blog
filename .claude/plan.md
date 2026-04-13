# 글 작성 페이지 메타 영역 UI 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 작성 페이지(admin/posts/new)의 카테고리/태그/썸네일 배치를 개선하고, 태그 입력 UI를 Velog 스타일(입력과 Badge 분리)로 변경한다.

**Architecture:** page.tsx의 컴포넌트 배치 순서를 변경하고, TagSelectorAction 컴포넌트를 리팩토링한다. 카테고리+썸네일을 한 줄에 배치하고, 제목 아래에 태그 입력을 위치시킨다.

**Tech Stack:** React 19, Zustand, shadcn/ui (Badge, Input), Lucide Icons

---

### 변경 대상 파일

- **Modify:** `src/app/admin/posts/new/page.tsx` — 컴포넌트 배치 순서 변경
- **Modify:** `src/app/admin/posts/new/_actions/tag-selector-action.tsx` — Velog 스타일 태그 입력 UI로 리팩토링
- **Modify:** `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx` — mb-4 제거 (같은 줄 배치를 위해)

### 변경 후 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│  [기본모드 ▼] | B I U S ... | 정렬 | 블록 | 삽입 | ↩ ↪        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [카테고리 ▼]                            [🖼 썸네일 추가]       │
│                                                                 │
│  제목을 입력하세요                                               │
│  ─────────────────────────────────────────────                  │
│  태그 입력...                                                    │
│  [React ✕] [Next.js ✕] [TypeScript ✕]                          │
│                                                                 │
│  (에디터 본문 영역)                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [미리보기] 저장됨                          [임시저장] [발행]    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Task 1: page.tsx 배치 순서 변경

**Files:**
- Modify: `src/app/admin/posts/new/page.tsx:26-31`

- [ ] **Step 1: page.tsx 컴포넌트 배치 변경**

카테고리+썸네일을 한 줄에 `justify-between`으로 배치하고, 제목 아래에 태그를 위치시킨다.

```tsx
// 변경 전 (line 26-31):
// <div className="flex gap-3 mb-4">
//   <CategorySelectorAction categories={categories} />
//   <TagSelectorAction allTags={tags} />
// </div>
// <ThumbnailUploadAction />
// <TitleInputAction />

// 변경 후:
<div className="flex items-center justify-between mb-4">
  <CategorySelectorAction categories={categories} />
  <ThumbnailUploadAction />
</div>
<TitleInputAction />
<TagSelectorAction allTags={tags} />
```

- [ ] **Step 2: thumbnail-upload-action.tsx에서 mb-4 제거**

`ThumbnailUploadAction`이 독립 줄이 아닌 카테고리와 같은 줄에 오므로 외부 `mb-4`를 제거한다.

```tsx
// 변경 전 (line 53):
// <div className="mb-4">

// 변경 후:
<div>
```

- [ ] **Step 3: 개발 서버에서 배치 확인**

Run: `npm run dev`

확인 사항:
- 카테고리 셀렉트가 왼쪽, 썸네일 버튼이 오른쪽에 배치되는지
- 제목 입력이 그 아래에 위치하는지
- 태그 입력이 제목 아래에 위치하는지

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/posts/new/page.tsx src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx
git commit -m "refactor: 글 작성 페이지 메타 영역 배치 순서 변경"
```

---

### Task 2: TagSelectorAction Velog 스타일로 리팩토링

**Files:**
- Modify: `src/app/admin/posts/new/_actions/tag-selector-action.tsx`

- [ ] **Step 1: 태그 입력 UI를 입력/Badge 분리 구조로 변경**

기존: 하나의 border 박스 안에 Badge + Input이 혼재
변경: 상단에 독립 Input, 하단에 선택된 태그 Badge 나열

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { TagSummary } from '@/types';
import { useNewPostStore } from '../_store';
import { createTag } from '../_services/manage-tags';

type Props = {
  allTags: TagSummary[];
};

export function TagSelectorAction({ allTags: initialTags }: Props) {
  const tagIds = useNewPostStore((s) => s.tagIds);
  const setTagIds = useNewPostStore((s) => s.setTagIds);

  const [allTags, setAllTags] = useState<TagSummary[]>(initialTags);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));

  const filtered = input.trim()
    ? allTags.filter(
        (t) =>
          t.name.toLowerCase().includes(input.toLowerCase()) &&
          !tagIds.includes(t.id)
      )
    : allTags.filter((t) => !tagIds.includes(t.id));

  const addTag = useCallback(
    (tag: TagSummary) => {
      setTagIds([...tagIds, tag.id]);
      setInput('');
    },
    [tagIds, setTagIds]
  );

  const removeTag = useCallback(
    (id: number) => {
      setTagIds(tagIds.filter((tid) => tid !== id));
    },
    [tagIds, setTagIds]
  );

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      const exact = allTags.find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exact) {
        if (!tagIds.includes(exact.id)) addTag(exact);
        return;
      }

      const result = await createTag(trimmed);
      if (result.success) {
        if (!allTags.find((t) => t.id === result.tag.id)) {
          setAllTags((prev) => [...prev, result.tag]);
        }
        addTag(result.tag);
      } else {
        toast.error(result.error);
      }
    }

    if (e.key === 'Backspace' && !input && tagIds.length > 0) {
      removeTag(tagIds[tagIds.length - 1]);
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="태그를 입력하세요"
          className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent text-sm"
        />
        {isOpen && (filtered.length > 0 || input.trim()) && (
          <div className="absolute left-0 top-full z-50 w-48 rounded-md border bg-popover shadow-md mt-1">
            {filtered.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
              >
                {tag.name}
              </button>
            ))}
            {input.trim() &&
              !allTags.find(
                (t) => t.name.toLowerCase() === input.trim().toLowerCase()
              ) && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground border-t">
                  Enter로 &quot;{input.trim()}&quot; 생성
                </div>
              )}
          </div>
        )}
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="rounded-full hover:bg-muted cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

주요 변경 사항:
- 인풋: 독립 `Input` 컴포넌트, 하단 border만 있는 미니멀 스타일 (`border-0 border-b rounded-none`)
- 자동완성 드롭다운: 인풋 바로 아래 (`top-full`)
- 선택된 태그 Badge: 인풋 아래 별도 영역에 `flex-wrap`으로 나열
- Backspace로 마지막 태그 삭제 기능 유지

- [ ] **Step 2: 개발 서버에서 태그 입력 확인**

Run: `npm run dev`

확인 사항:
- 태그 입력 필드가 제목 아래에 단독으로 표시되는지
- 입력 시 자동완성 드롭다운이 아래에 뜨는지
- Enter로 태그 추가 시 인풋 아래에 Badge가 나열되는지
- Badge의 X 버튼으로 태그 제거가 되는지
- Backspace로 마지막 태그 삭제가 되는지
- 존재하지 않는 태그 입력 시 "Enter로 생성" 안내가 표시되는지

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/posts/new/_actions/tag-selector-action.tsx
git commit -m "refactor: 태그 입력 UI를 Velog 스타일로 변경 (입력/Badge 분리)"
```

---

### Task 3: 최종 확인 및 lint

- [ ] **Step 1: lint 실행**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 전체 흐름 확인**

개발 서버에서 글 작성 페이지 전체 흐름 확인:
1. 카테고리 선택 → 왼쪽 상단에서 정상 동작
2. 썸네일 추가 → 오른쪽 상단 버튼 클릭, 이미지 업로드 후 프리뷰 표시
3. 제목 입력 → 카테고리/썸네일 아래에서 정상 입력
4. 태그 입력 → 제목 아래에서 입력, 자동완성, Badge 표시 확인
5. 본문 작성 → 에디터 정상 동작
6. 임시저장/발행 → 정상 동작
