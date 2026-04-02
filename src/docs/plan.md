# 수정 계획: 관리자 테이블 tanstack-table 통합 리팩토링

> 작성일: 2026-04-03

## 현재 구조

```
src/app/admin/
├── posts/
│   ├── page.tsx                          # Server Component, <table> 직접 렌더링
│   ├── loading.tsx                       # Skeleton
│   ├── _components/
│   │   ├── post-actions-menu.tsx          # DropdownMenu (수정 링크 + 삭제 Dialog)
│   │   └── delete-post-dialog.tsx         # 삭제 확인 Dialog
│   └── _services/
│       └── delete-post.ts                # Server Action
│
├── categories/
│   ├── page.tsx                          # Server Component → CategoryTable에 데이터 전달
│   ├── loading.tsx                       # Skeleton
│   └── _components/
│       ├── category-table.tsx            # Client Component, <table> + Dialog 상태 관리
│       ├── _category-form/
│       │   ├── index.tsx                 # 생성/수정 Dialog (react-hook-form)
│       │   └── _services/
│       │       ├── create-category.ts    # Server Action
│       │       └── update-category.ts    # Server Action
│       └── _delete-category/
│           ├── index.tsx                 # 삭제 확인 Dialog
│           └── _services/
│               └── delete-category.ts    # Server Action
```

## 분석 요약

### 중복 패턴
- `<table>` 마크업 구조가 거의 동일: `.rounded-lg.border` > `table.w-full.text-sm` > thead (`bg-muted/50`) > tbody (`hover:bg-muted/30`)
- 빈 데이터 empty state 패턴 동일 (`colSpan` + "~가 없습니다")
- 날짜 포맷 동일 (`date-fns` format + ko locale)
- loading.tsx 구조 거의 동일

### 구조 불일치
| | Posts | Categories |
|---|---|---|
| page.tsx | Server Component에서 `<table>` 직접 렌더링 | Server Component → Client Component 위임 |
| 액션 UI | DropdownMenu | 인라인 아이콘 버튼 |
| 생성 | 별도 라우트 (`/new`) | 페이지 내 Dialog |
| 수정 | 별도 라우트 (`/[id]/edit`) | Dialog |
| 삭제 | Dialog (useTransition) | Dialog (useState) |
| 폴더 규칙 | `_services/`가 `_components/` 바깥 (올바름) | `_services/`가 `_components/_category-form/` 안에 중첩 |

### 컨벤션 위반
1. **Categories `_services` 위치**: `_category-form/_services/`, `_delete-category/_services/` 처럼 컴포넌트 하위에 서비스가 중첩됨 → page-folder 규칙에 따르면 `_services/`는 페이지 직속이어야 함
2. **Lucide 아이콘 사이즈**: `category-table.tsx`에서 `className="size-4"` 사용 → `size={16}` 사용해야 함

## 수정 계획

### 1. 패키지 설치 [High]

```bash
npm install @tanstack/react-table
npx shadcn@latest add table
```

- `@tanstack/react-table`: headless 테이블 로직
- `shadcn/ui table`: `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>` 컴포넌트 생성 → `src/components/ui/table.tsx`

---

### 2. 공통 DataTable 컴포넌트 생성 [High]

**파일**: `src/components/data-table.tsx`

tanstack-table의 `useReactTable` + shadcn Table을 조합한 제네릭 테이블 컴포넌트.
테이블 wrapper에 `overflow-x-auto`를 적용하여 좁은 화면에서 가로 스크롤 지원.

```tsx
'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = '데이터가 없습니다.',
}: Props<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**설계 포인트**:
- 제네릭 `<TData, TValue>`로 posts, categories 모두 수용
- `overflow-x-auto`로 좁은 화면에서 가로 스크롤 (반응형 컬럼 숨김 불필요)
- `emptyMessage` prop으로 빈 상태 메시지 커스터마이징
- 향후 정렬/필터/페이지네이션 확장 가능 (getCoreRowModel만 사용하므로 추가 용이)

---

### 3. Posts 테이블 리팩토링 [High]

#### 3-1. 컬럼 정의 파일 생성

**파일**: `src/app/admin/posts/_components/columns.tsx`

`createColumnHelper`를 사용하여 타입 안전하게 컬럼 정의. 별도의 `.d.ts` 타입 확장 없이도 `row.original`에 대한 타입 추론이 자동으로 동작.

```tsx
'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { PostWithCategory } from '@/types';
import { PostActionsCell } from './post-actions-cell';

const columnHelper = createColumnHelper<PostWithCategory>();

export const postColumns = [
  columnHelper.accessor('title', {
    header: '제목',
    cell: (info) => (
      <Link
        href={`/posts/${info.row.original.slug}`}
        className="font-medium hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor((row) => row.category?.name, {
    id: 'category',
    header: '카테고리',
    cell: (info) => (
      <span className="text-muted-foreground">
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  columnHelper.accessor('updatedAt', {
    header: '수정일',
    cell: (info) => (
      <span className="text-muted-foreground">
        {format(new Date(info.getValue()), 'yyyy년 M월 d일', { locale: ko })}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    header: '상태',
    cell: (info) => (
      <Badge variant={info.getValue() === 'published' ? 'default' : 'secondary'}>
        {info.getValue() === 'published' ? '발행' : '임시저장'}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '관리',
    cell: (info) => (
      <PostActionsCell postId={info.row.original.id} postTitle={info.row.original.title} />
    ),
  }),
];
```

#### 3-2. PostActionsCell 컴포넌트 생성

**파일**: `src/app/admin/posts/_components/post-actions-cell.tsx`

기존 `PostActionsMenu`(DropdownMenu)를 카테고리와 동일한 인라인 아이콘 버튼 방식으로 교체.

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeletePostDialog } from './delete-post-dialog';

type Props = {
  postId: number;
  postTitle: string;
};

export function PostActionsCell({ postId, postTitle }: Props) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/admin/posts/${postId}/edit`}>
          <PencilIcon size={16} />
          <span className="sr-only">수정</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setIsDeleteOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>

      <DeletePostDialog
        postId={postId}
        postTitle={postTitle}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
}
```

**이유**: 카테고리 테이블과 동일한 UX 통일. DropdownMenu 제거로 클릭 한 번에 바로 액션 수행.

#### 3-3. 기존 파일 삭제

- `src/app/admin/posts/_components/post-actions-menu.tsx` → **삭제** (PostActionsCell로 대체)

#### 3-4. page.tsx 수정

**현재 코드** (`src/app/admin/posts/page.tsx`):
```tsx
// 80줄의 직접 <table> 마크업
export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();
  return (
    <div>
      <h1>...</h1>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          ...posts.map(...)
        </table>
      </div>
    </div>
  );
}
```

**수정 후**:
```tsx
import { getAllPostsForAdmin } from '@/db/queries/posts';
import { DataTable } from '@/components/data-table';
import { postColumns } from './_components/columns';

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">글 관리</h1>
      <DataTable columns={postColumns} data={posts} emptyMessage="작성된 글이 없습니다." />
    </div>
  );
}
```

**이유**: page.tsx는 Server Component로 유지하면서, 테이블 렌더링을 DataTable에 위임. 컬럼 정의만 `_components/columns.tsx`에 분리.

> **참고**: `DataTable`은 `'use client'`이므로 Server Component인 page.tsx에서 import해도 posts 데이터는 서버에서 fetch 후 props로 전달됨 (직렬화 가능한 plain object).

---

### 4. Categories 테이블 리팩토링 [High]

#### 4-1. 컬럼 정의 파일 생성

**파일**: `src/app/admin/categories/_components/columns.tsx`

Posts와 동일하게 `createColumnHelper` 사용.

```tsx
'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Category } from '@/types';
import { CategoryActionsCell } from './category-actions-cell';

const columnHelper = createColumnHelper<Category>();

export const categoryColumns = [
  columnHelper.accessor('name', {
    header: '이름',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('description', {
    header: '설명',
    cell: (info) => (
      <span className="max-w-48 truncate text-muted-foreground">
        {info.getValue() ?? '—'}
      </span>
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
    cell: (info) => <CategoryActionsCell category={info.row.original} />,
  }),
];
```

#### 4-2. EditCategoryAction 컴포넌트 생성

**파일**: `src/app/admin/categories/_components/_actions/edit-category-action.tsx`

수정 버튼 + CategoryFormDialog 상태를 독립 Action 컴포넌트로 분리.

```tsx
'use client';

import { useState } from 'react';
import { PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import { CategoryFormDialog } from '../_category-form';

type Props = {
  category: Category;
};

export function EditCategoryAction({ category }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <PencilIcon size={16} />
        <span className="sr-only">수정</span>
      </Button>
      <CategoryFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        category={category}
      />
    </>
  );
}
```

#### 4-3. DeleteCategoryAction 컴포넌트 생성

**파일**: `src/app/admin/categories/_components/_actions/delete-category-action.tsx`

삭제 버튼 + DeleteCategoryDialog 상태를 독립 Action 컴포넌트로 분리.

```tsx
'use client';

import { useState } from 'react';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import { DeleteCategoryDialog } from '../_delete-category';

type Props = {
  category: Category;
};

export function DeleteCategoryAction({ category }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <TrashIcon size={16} />
        <span className="sr-only">삭제</span>
      </Button>
      <DeleteCategoryDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        category={category}
      />
    </>
  );
}
```

#### 4-4. CategoryActionsCell 컴포넌트 생성

**파일**: `src/app/admin/categories/_components/category-actions-cell.tsx`

Action 컴포넌트들을 조합하는 셀 컴포넌트. 자체 상태 없이 레이아웃만 담당.

```tsx
import type { Category } from '@/types';
import { EditCategoryAction } from './_actions/edit-category-action';
import { DeleteCategoryAction } from './_actions/delete-category-action';

type Props = {
  category: Category;
};

export function CategoryActionsCell({ category }: Props) {
  return (
    <div className="flex items-center justify-end gap-1">
      <EditCategoryAction category={category} />
      <DeleteCategoryAction category={category} />
    </div>
  );
}
```

**이유**: page-folder 컨벤션에 따라 상태가 필요한 로직은 Action 컴포넌트로 분리. CategoryActionsCell은 레이아웃 역할만 수행.

#### 4-5. category-table.tsx 수정

**현재**: 125줄의 Client Component (테이블 + Dialog 상태 관리 통합)

**수정 후**: `src/app/admin/categories/_components/category-table.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import type { Category } from '@/types';
import { CategoryFormDialog } from './_category-form';
import { categoryColumns } from './columns';

type Props = {
  categories: Category[];
};

export function CategoryTable({ categories }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={() => setFormOpen(true)}>새 카테고리</Button>
      </div>

      <DataTable
        columns={categoryColumns}
        data={categories}
        emptyMessage="카테고리가 없습니다."
      />

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
```

**이유**: "새 카테고리" 버튼의 Dialog 상태만 이 컴포넌트에서 관리. 수정/삭제 Dialog는 `CategoryActionsCell`로 이동.

---

### 5. Categories _services 위치 정리 [Medium]

현재 `_services/`가 `_components/_category-form/_services/`와 `_components/_delete-category/_services/`에 중첩되어 있음.

**수정**: `src/app/admin/categories/_services/`로 이동

```
# Before
categories/_components/_category-form/_services/create-category.ts
categories/_components/_category-form/_services/update-category.ts
categories/_components/_delete-category/_services/delete-category.ts

# After
categories/_services/create-category.ts
categories/_services/update-category.ts
categories/_services/delete-category.ts
```

**영향받는 import**:
- `_category-form/index.tsx` → `create-category`, `update-category` import 경로 변경
- `_delete-category/index.tsx` → `delete-category` import 경로 변경

---

### 6. Lucide 아이콘 사이즈 수정 [Low]

**현재 코드** (`category-table.tsx`, 리팩토링 후 `category-actions-cell.tsx`):
```tsx
<PencilIcon className="size-4" />
<TrashIcon className="size-4" />
```

**수정 후**:
```tsx
<PencilIcon size={16} />
<TrashIcon size={16} />
```

**이유**: 코딩 컨벤션 (`coding-conventions.md`) — Lucide 아이콘은 `size` 속성으로 지정

---

## 변경 후 구조

```
src/
├── components/
│   ├── data-table.tsx                    # [NEW] 공통 DataTable (overflow-x-auto 스크롤)
│   └── ui/
│       └── table.tsx                     # [NEW] shadcn/ui Table (자동 생성)
│
├── app/admin/
│   ├── posts/
│   │   ├── page.tsx                      # [MODIFIED] DataTable 사용
│   │   ├── loading.tsx                   # (유지)
│   │   ├── _components/
│   │   │   ├── columns.tsx               # [NEW] createColumnHelper로 컬럼 정의
│   │   │   ├── post-actions-cell.tsx      # [NEW] 인라인 아이콘 버튼 (수정 Link + 삭제 Dialog)
│   │   │   ├── post-actions-menu.tsx      # [DELETE] DropdownMenu 제거
│   │   │   └── delete-post-dialog.tsx    # (유지)
│   │   └── _services/
│   │       └── delete-post.ts            # (유지)
│   │
│   └── categories/
│       ├── page.tsx                      # (유지)
│       ├── loading.tsx                   # (유지)
│       ├── _services/                    # [MOVED] 서비스 파일 이동
│       │   ├── create-category.ts
│       │   ├── update-category.ts
│       │   └── delete-category.ts
│       └── _components/
│           ├── category-table.tsx        # [MODIFIED] DataTable 사용, 상태 최소화
│           ├── columns.tsx               # [NEW] createColumnHelper로 컬럼 정의
│           ├── category-actions-cell.tsx  # [NEW] 행별 액션 셀 (레이아웃만 담당)
│           ├── _actions/
│           │   ├── edit-category-action.tsx   # [NEW] 수정 버튼 + Dialog Action
│           │   └── delete-category-action.tsx # [NEW] 삭제 버튼 + Dialog Action
│           ├── _category-form/
│           │   └── index.tsx             # [MODIFIED] import 경로 변경
│           └── _delete-category/
│               └── index.tsx             # [MODIFIED] import 경로 변경
```

## 체크리스트

- [ ] `@tanstack/react-table` 설치
- [ ] `shadcn/ui table` 추가 (`npx shadcn@latest add table`)
- [ ] `src/components/data-table.tsx` — 공통 DataTable 컴포넌트 (`overflow-x-auto` 스크롤)
- [ ] `src/app/admin/posts/_components/columns.tsx` — `createColumnHelper`로 post 컬럼 정의
- [ ] `src/app/admin/posts/_components/post-actions-cell.tsx` — 인라인 아이콘 버튼 (수정/삭제)
- [ ] `src/app/admin/posts/_components/post-actions-menu.tsx` — 삭제
- [ ] `src/app/admin/posts/page.tsx` — DataTable로 교체
- [ ] `src/app/admin/categories/_components/columns.tsx` — `createColumnHelper`로 category 컬럼 정의
- [ ] `src/app/admin/categories/_components/_actions/edit-category-action.tsx` — 수정 Action
- [ ] `src/app/admin/categories/_components/_actions/delete-category-action.tsx` — 삭제 Action
- [ ] `src/app/admin/categories/_components/category-actions-cell.tsx` — 행별 액션 셀 (레이아웃)
- [ ] `src/app/admin/categories/_components/category-table.tsx` — DataTable로 교체
- [ ] `src/app/admin/categories/_services/` — 서비스 파일 이동
- [ ] `_category-form/index.tsx`, `_delete-category/index.tsx` — import 경로 수정
- [ ] Lucide 아이콘 `size` 속성 수정
- [ ] `npm run build` 빌드 확인
- [ ] `npm run lint` 린트 통과 확인
