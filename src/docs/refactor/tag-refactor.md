# 태그 목록 버튼 + 태그 삭제 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** posts 페이지에 태그 목록(`/tags`) 이동 버튼을 추가하고, admin에서 태그를 삭제할 수 있는 관리 기능을 구현한다.

**Architecture:** (1) posts 페이지의 태그 필터 영역 왼쪽에 "태그 목록" 버튼을 동일한 pill UI로 추가한다. (2) admin 사이드바에 "태그 관리" 메뉴를 추가하고, `/admin/tags` 페이지에서 태그 목록 조회 + 삭제(확인 다이얼로그 포함)를 지원한다. 태그 삭제 시 `post_tags`의 `onDelete: 'cascade'`에 의해 게시글-태그 연결이 자동 제거된다.

**Tech Stack:** Next.js App Router, Drizzle ORM, shadcn/ui (DataTable, Dialog, Badge, Button), Lucide Icons, sonner (toast)

---

### 변경 대상 파일

**태그 목록 버튼 (posts 페이지)**
- **Modify:** `src/app/(main)/posts/_actions/tag-filter-action.tsx` — 태그 목록 이동 링크 추가

**태그 삭제 기능 (admin)**
- **Modify:** `src/app/admin/_components/admin-sidebar.tsx` — 사이드바에 태그 관리 메뉴 추가
- **Create:** `src/db/queries/tags.ts` 에 `deleteTag` 함수 추가 (기존 파일 수정)
- **Create:** `src/app/admin/tags/page.tsx` — 태그 관리 페이지
- **Create:** `src/app/admin/tags/_components/tag-table.tsx` — 태그 테이블 컴포넌트
- **Create:** `src/app/admin/tags/_components/columns.tsx` — 테이블 컬럼 정의
- **Create:** `src/app/admin/tags/_components/tag-actions-cell.tsx` — 액션 버튼 셀
- **Create:** `src/app/admin/tags/_components/_actions/delete-tag-action.tsx` — 삭제 버튼 Action
- **Create:** `src/app/admin/tags/_components/_delete-tag/index.tsx` — 삭제 확인 다이얼로그
- **Create:** `src/app/admin/tags/_services/delete-tag.ts` — 태그 삭제 server action

---

### Task 1: posts 페이지 태그 필터 영역에 "태그 목록" 버튼 추가

**Files:**
- Modify: `src/app/(main)/posts/_actions/tag-filter-action.tsx:31-49`

- [ ] **Step 1: TagFilterAction에 태그 목록 링크 추가**

태그 필터 pill 목록 왼쪽에 동일한 스타일의 "태그 목록" 링크를 추가한다. `next/link`를 사용한다.

```tsx
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { TagSummary } from '@/types';

type TagWithCount = TagSummary & { postCount: number };

type Props = {
  tags: TagWithCount[];
  currentSlug?: string;
};

export function TagFilterAction({ tags, currentSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (slug) {
      params.set('tag', slug);
    } else {
      params.delete('tag');
    }
    router.push(`/posts?${params.toString()}`);
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      <Link
        href="/tags"
        className="px-3 py-1 rounded-full text-sm font-medium transition-colors border bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
      >
        태그 목록
      </Link>
      {tags.map((tag) => {
        const isActive = tag.slug === currentSlug;
        return (
          <button
            key={tag.id}
            onClick={() => navigate(isActive ? undefined : tag.slug)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer border',
              isActive
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground',
            )}
          >
            #{tag.name}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 개발 서버에서 확인**

Run: `npm run dev`

확인 사항:
- `/posts` 페이지에서 태그 필터 영역 왼쪽에 "태그 목록" pill이 표시되는지
- 클릭 시 `/tags` 페이지로 이동하는지
- 기존 태그 필터 동작에 영향이 없는지

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/posts/_actions/tag-filter-action.tsx
git commit -m "feat: posts 페이지 태그 필터에 태그 목록 이동 버튼 추가"
```

---

### Task 2: 태그 삭제 DB 쿼리 + Server Action

**Files:**
- Modify: `src/db/queries/tags.ts` — `deleteTag` 함수 추가
- Create: `src/app/admin/tags/_services/delete-tag.ts` — server action

- [ ] **Step 1: tags 쿼리에 deleteTag 함수 추가**

`src/db/queries/tags.ts` 파일 끝에 추가:

```ts
/**
 * 태그 삭제 (post_tags cascade 삭제됨)
 */
export async function deleteTag(id: number): Promise<void> {
  await db.delete(tags).where(eq(tags.id, id));
}
```

- [ ] **Step 2: 태그 삭제 server action 생성**

`src/app/admin/tags/_services/delete-tag.ts`:

```ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deleteTag } from '@/db/queries/tags';

type Result = { success: true } | { success: false; error: string };

export async function deleteTagAction(id: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    await deleteTag(id);
    revalidateTag(CACHE_TAGS.tags, 'default');
    revalidateTag(CACHE_TAGS.posts, 'default');
    revalidatePath('/admin/tags');
    return { success: true };
  } catch {
    return { success: false, error: '태그 삭제에 실패했습니다' };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/db/queries/tags.ts src/app/admin/tags/_services/delete-tag.ts
git commit -m "feat: 태그 삭제 쿼리 및 server action 추가"
```

---

### Task 3: admin 태그 관리 페이지 UI

**Files:**
- Create: `src/app/admin/tags/page.tsx`
- Create: `src/app/admin/tags/_components/tag-table.tsx`
- Create: `src/app/admin/tags/_components/columns.tsx`
- Create: `src/app/admin/tags/_components/tag-actions-cell.tsx`
- Create: `src/app/admin/tags/_components/_actions/delete-tag-action.tsx`
- Create: `src/app/admin/tags/_components/_delete-tag/index.tsx`
- Modify: `src/app/admin/_components/admin-sidebar.tsx:1-56`

- [ ] **Step 1: 태그 관리 페이지 생성**

`src/app/admin/tags/page.tsx`:

```tsx
import { getAllTags } from '@/db/queries/tags';
import { TagTable } from './_components/tag-table';

export default async function AdminTagsPage() {
  const tags = await getAllTags();

  return <TagTable tags={tags} />;
}
```

- [ ] **Step 2: 테이블 컬럼 정의**

`src/app/admin/tags/_components/columns.tsx`:

```tsx
'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TagActionsCell } from './tag-actions-cell';

type TagRow = {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  postCount: number;
};

const columnHelper = createColumnHelper<TagRow>();

export type { TagRow };

export const tagColumns = [
  columnHelper.accessor('name', {
    header: '이름',
    cell: (info) => (
      <span className="font-medium">#{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('postCount', {
    header: '글 수',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}개</span>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: '생성일',
    cell: (info) => (
      <span className="text-muted-foreground">
        {format(new Date(info.getValue()), 'yyyy년 M월 d일', { locale: ko })}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '관리',
    cell: (info) => <TagActionsCell tag={info.row.original} />,
  }),
];
```

- [ ] **Step 3: 태그 액션 셀 컴포넌트 생성**

`src/app/admin/tags/_components/tag-actions-cell.tsx`:

```tsx
import type { TagRow } from './columns';
import { DeleteTagAction } from './_actions/delete-tag-action';

type Props = {
  tag: TagRow;
};

export function TagActionsCell({ tag }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <DeleteTagAction tag={tag} />
    </div>
  );
}
```

- [ ] **Step 4: 삭제 버튼 Action 컴포넌트 생성**

`src/app/admin/tags/_components/_actions/delete-tag-action.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TagRow } from '../columns';
import { DeleteTagDialog } from '../_delete-tag';

type Props = {
  tag: TagRow;
};

export function DeleteTagAction({ tag }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>
      <DeleteTagDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        tag={tag}
      />
    </>
  );
}
```

- [ ] **Step 5: 삭제 확인 다이얼로그 생성**

`src/app/admin/tags/_components/_delete-tag/index.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TagRow } from '../columns';
import { deleteTagAction } from '../../_services/delete-tag';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: TagRow;
};

export function DeleteTagDialog({ open, onOpenChange, tag }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteTagAction(tag.id);

    setIsDeleting(false);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>태그 삭제</DialogTitle>
          <DialogDescription>
            &ldquo;{tag.name}&rdquo; 태그를 삭제하시겠습니까?
            {tag.postCount > 0 && (
              <> 이 태그가 연결된 {tag.postCount}개의 글에서 태그가 제거됩니다.</>
            )}
            {' '}이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: 태그 테이블 컴포넌트 생성**

`src/app/admin/tags/_components/tag-table.tsx`:

```tsx
'use client';

import { DataTable } from '@/components/data-table';
import { tagColumns, type TagRow } from './columns';

type Props = {
  tags: TagRow[];
};

export function TagTable({ tags }: Props) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">태그 관리</h1>
      </div>

      <DataTable
        columns={tagColumns}
        data={tags}
        emptyMessage="태그가 없습니다."
      />
    </>
  );
}
```

- [ ] **Step 7: admin 사이드바에 태그 관리 메뉴 추가**

`src/app/admin/_components/admin-sidebar.tsx`의 `menuGroups` 콘텐츠 그룹에 태그 관리 항목을 추가한다. import에 `Tag` 아이콘을 추가한다.

```tsx
// import 변경: Tag 추가
import {
  BarChart3,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Tag,
} from 'lucide-react';

// menuGroups 콘텐츠 그룹 변경:
{
  label: '콘텐츠',
  items: [
    { label: '글 관리', icon: FileText, href: '/admin/posts' },
    { label: '카테고리 관리', icon: FolderOpen, href: '/admin/categories' },
    { label: '태그 관리', icon: Tag, href: '/admin/tags' },
    { label: '댓글 관리', icon: MessageSquare, href: '/admin/comments' },
  ],
},
```

- [ ] **Step 8: 개발 서버에서 확인**

Run: `npm run dev`

확인 사항:
- admin 사이드바에 "태그 관리" 메뉴가 표시되는지
- `/admin/tags` 페이지에서 태그 목록이 테이블로 표시되는지 (이름, slug, 글 수, 생성일, 관리)
- 삭제 버튼 클릭 시 확인 다이얼로그가 열리는지
- 글이 연결된 태그의 경우 "N개의 글에서 태그가 제거됩니다" 안내가 표시되는지
- 삭제 실행 후 태그가 목록에서 사라지는지

- [ ] **Step 9: Commit**

```bash
git add src/app/admin/tags/ src/app/admin/_components/admin-sidebar.tsx
git commit -m "feat: admin 태그 관리 페이지 및 삭제 기능 추가"
```

---

### Task 4: lint 및 빌드 확인

- [ ] **Step 1: lint 실행**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 최종 확인**

개발 서버에서 전체 흐름 확인:
1. `/posts` 페이지 → "태그 목록" pill 클릭 → `/tags` 페이지로 이동
2. `/admin/tags` → 태그 테이블 표시, 글 수 확인
3. 글이 연결된 태그 삭제 → 경고 메시지 표시 후 삭제 → 해당 글에서 태그 연결 해제 확인
4. 글이 없는 태그 삭제 → 정상 삭제
