# 수정 계획: 우선순위 1~3 (다크모드, 글 목록 Actions, 글 삭제)

> 작성일: 2026-04-01

## 현재 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (ClerkProvider > html > body)
│   ├── globals.css                   # :root + .dark CSS 변수 정의 완료
│   └── admin/posts/
│       ├── page.tsx                  # 글 목록 테이블 (Actions 컬럼 없음)
│       ├── [id]/edit/               # 글 수정 페이지 (구현 완료)
│       └── new/_services/
│           ├── save-post.ts         # 글 저장/수정 Server Action
│           └── submit-post.ts       # 글 발행 Server Action
├── components/
│   ├── layout/header.tsx            # 공개 페이지 Header (테마 토글 없음)
│   └── ui/                          # shadcn 컴포넌트 (dialog, dropdown-menu 등 이미 존재)
├── db/
│   ├── schema.ts                    # posts 테이블 (soft delete 없음, 물리 삭제)
│   ├── cache-tags.ts                # CACHE_TAGS.posts, categories, comments
│   └── queries/posts.ts             # getAllPostsForAdmin, getPostById 등
└── styles/
    ├── prose.css                    # .prose 글 상세 스타일
    └── highlight.css                # highlight.js 토큰 색상 (하드코딩 색상)
```

## 분석 요약

1. **다크모드**: `.dark` CSS 변수와 shadcn `dark:` 스타일은 이미 정의되어 있으나, `next-themes` 패키지 미설치, `ThemeProvider` 미적용, 토글 UI 미구현. `<html>` 태그에 `suppressHydrationWarning` 누락.
2. **글 목록 Actions**: `/admin/posts/page.tsx` 테이블에 수정/삭제 버튼 없음. 수정 페이지(`/admin/posts/[id]/edit`)는 이미 구현되어 있으므로 링크만 추가하면 됨.
3. **글 삭제**: Server Action 미구현. `posts` 테이블에 `isDeleted` 컬럼 없음(물리 삭제 방식). 댓글은 `onDelete: 'cascade'`로 설정되어 있어 글 삭제 시 자동 삭제됨.

---

## 수정 계획

### 1. 다크모드 (Priority: High)

#### 1-1. `next-themes` 설치

```bash
npm install next-themes
```

#### 1-2. `ThemeProvider` 컴포넌트 생성

**새 파일**: `src/components/theme-provider.tsx`

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Props = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

**이유**: `attribute="class"`로 설정하면 `<html>`에 `class="dark"`가 추가되어 기존 `.dark` CSS 변수와 자연스럽게 연동됨. `disableTransitionOnChange`로 테마 전환 시 깜빡임 방지.

#### 1-3. 루트 레이아웃에 ThemeProvider 적용

**파일**: `src/app/layout.tsx`

**현재 코드**
```tsx
<ClerkProvider>
  <html lang="ko">
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <TooltipProvider>
        <PageTracker />
        {children}
      </TooltipProvider>
    </body>
  </html>
</ClerkProvider>
```

**수정 후**
```tsx
<ClerkProvider>
  <html lang="ko" suppressHydrationWarning>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ThemeProvider>
        <TooltipProvider>
          <PageTracker />
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </body>
  </html>
</ClerkProvider>
```

**이유**: `suppressHydrationWarning`은 `next-themes`가 `<html>`의 class를 클라이언트에서 변경하므로 hydration 경고를 방지하기 위해 필요.

#### 1-4. 테마 토글 버튼 컴포넌트 생성

**새 파일**: `src/components/theme-toggle.tsx`

```tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="테마 전환"
    >
      {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
```

**이유**: `resolvedTheme`을 사용해 system 테마를 실제 값으로 해석. `isMounted` 패턴으로 SSR 불일치 방지. lucide-react 아이콘은 `size` prop 사용 (컨벤션 준수).

#### 1-5. Header에 테마 토글 배치

**파일**: `src/components/layout/header.tsx`

**현재 코드**
```tsx
<div className="flex items-center gap-4">
  <MobileMenu />
  <SignedOut>
```

**수정 후**
```tsx
<div className="flex items-center gap-4">
  <ThemeToggle />
  <MobileMenu />
  <SignedOut>
```

**이유**: 로그인 상태와 무관하게 모든 사용자가 테마를 전환할 수 있도록 인증 버튼 앞에 배치.

#### 1-6. prose/highlight 스타일 다크모드 대응 검토

- `src/styles/prose.css`: 대부분 CSS 변수(`var(--border)`, `var(--muted-foreground)` 등)를 사용하므로 자동 대응됨. 단, `.prose a` 색상(`oklch(0.55 0.18 250)`)과 `.prose pre` 배경색(`oklch(0.15 0 0)`)이 하드코딩 — 다크모드에서 검토 필요.
  - `.prose a`: 다크모드에서 밝은 링크 색상으로 변경 필요
  - `.prose pre`: 이미 어두운 배경이므로 다크모드에서도 유지 가능

**수정 후** (`src/styles/prose.css` 하단에 추가)
```css
.dark .prose a {
  color: oklch(0.7 0.15 250);
}
```

- `src/styles/highlight.css`: github-dark 기반으로 어두운 배경에 맞는 색상 → 다크모드에서는 그대로 유지. 라이트모드에서 `.prose pre` 배경이 이미 어둡기 때문에 변경 불필요.

---

### 2. 글 목록 테이블 Actions 컬럼 추가 (Priority: High)

#### 2-1. 관리자 글 목록 테이블에 Actions 컬럼 추가

**파일**: `src/app/admin/posts/page.tsx`

**현재 코드** (thead)
```tsx
<th className="px-4 py-3 text-left font-medium">상태</th>
```

**수정 후** (thead에 Actions 컬럼 추가)
```tsx
<th className="px-4 py-3 text-left font-medium">상태</th>
<th className="px-4 py-3 text-right font-medium">Actions</th>
```

**현재 코드** (tbody - 각 행의 마지막 td 뒤)
```tsx
              <Badge
                variant={
                  post.status === 'published' ? 'default' : 'secondary'
                }
              >
                {post.status === 'published' ? '발행' : '임시저장'}
              </Badge>
            </td>
          </tr>
```

**수정 후** (Actions td 추가)
```tsx
              <Badge
                variant={
                  post.status === 'published' ? 'default' : 'secondary'
                }
              >
                {post.status === 'published' ? '발행' : '임시저장'}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <PostActionsMenu postId={post.id} postTitle={post.title} />
            </td>
          </tr>
```

- `colSpan`을 4 → 5로 변경 (빈 목록일 때)

**이유**: 수정/삭제 버튼을 드롭다운 메뉴로 묶어 깔끔하게 제공. shadcn `DropdownMenu` 활용.

#### 2-2. PostActionsMenu 컴포넌트 생성

**새 파일**: `src/app/admin/posts/_components/post-actions-menu.tsx`

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeletePostDialog } from './delete-post-dialog';

type Props = {
  postId: number;
  postTitle: string;
};

export function PostActionsMenu({ postId, postTitle }: Props) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/posts/${postId}/edit`}>
              <Pencil size={14} />
              수정
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={14} />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeletePostDialog
        postId={postId}
        postTitle={postTitle}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
```

**이유**: `DropdownMenu` + `Dialog` 조합으로 수정 링크와 삭제 확인 다이얼로그를 제공.

#### 2-3. DeletePostDialog 컴포넌트 생성

**새 파일**: `src/app/admin/posts/_components/delete-post-dialog.tsx`

```tsx
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deletePost } from '../../_services/delete-post';

type Props = {
  postId: number;
  postTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeletePostDialog({ postId, postTitle, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result.success) {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>글 삭제</DialogTitle>
          <DialogDescription>
            &ldquo;{postTitle}&rdquo;을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 관련 댓글도 함께 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**이유**: 확인 다이얼로그로 실수 방지. `useTransition`으로 삭제 중 UI 피드백 제공. 댓글 cascade 삭제 안내 포함.

---

### 3. 글 삭제 Server Action (Priority: High)

> **참고**: 기존 패턴 — `src/app/admin/categories/_components/_delete-category/_services/delete-category.ts` (`deleteCategoryAction`)

#### 3-1. DB 쿼리 함수 추가

**파일**: `src/db/queries/posts.ts` (기존 파일에 추가)

```ts
/**
 * 글 삭제 (물리 삭제, 댓글 cascade)
 */
export async function deletePostById(id: number) {
  return db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
}
```

**이유**: 기존 `deleteCategory` 함수가 `db/queries/categories.ts`에 있고, Server Action에서 이를 호출하는 패턴을 따름. DB 조작 로직은 queries에, 인증/캐시 로직은 Server Action에 분리.

#### 3-2. delete-post Server Action 생성

**새 파일**: `src/app/admin/posts/_services/delete-post.ts`

```ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { deletePostById } from '@/db/queries/posts';

type Result = { success: true } | { success: false; error: string };

export async function deletePost(postId: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    const result = await deletePostById(postId);

    if (result.length === 0) {
      return { success: false, error: '글을 찾을 수 없습니다' };
    }

    revalidateTag(CACHE_TAGS.posts, 'default');
    revalidateTag(CACHE_TAGS.comments, 'default');
    revalidatePath('/admin/posts');

    return { success: true };
  } catch {
    return { success: false, error: '삭제에 실패했습니다' };
  }
}
```

**이유**: 기존 `deleteCategoryAction` 패턴과 동일 구조 (auth 검증 → 쿼리 함수 호출 → revalidateTag + revalidatePath). 컨벤션에 따라 파일명은 `delete-post.ts`, 함수명은 `deletePost`로 작성 (`-action` 접미사 없이). `CACHE_TAGS.comments`도 revalidate — 댓글이 cascade 삭제되므로 댓글 캐시도 갱신 필요.

---

## 변경 후 구조

```
src/
├── app/
│   ├── layout.tsx                           # + ThemeProvider, suppressHydrationWarning
│   └── admin/posts/
│       ├── page.tsx                          # + Actions 컬럼, PostActionsMenu 사용
│       ├── _components/                      # (신규 폴더)
│       │   ├── post-actions-menu.tsx         # 수정/삭제 드롭다운
│       │   └── delete-post-dialog.tsx        # 삭제 확인 다이얼로그
│       └── _services/                        # (신규 폴더)
│           └── delete-post.ts               # 글 삭제 Server Action
├── components/
│   ├── layout/header.tsx                    # + ThemeToggle
│   ├── theme-provider.tsx                   # (신규) next-themes 래퍼
│   └── theme-toggle.tsx                     # (신규) 테마 토글 버튼
└── styles/
    └── prose.css                            # + .dark .prose a 색상 오버라이드
```

## 체크리스트

- [ ] `npm install next-themes`
- [ ] `src/components/theme-provider.tsx` 생성
- [ ] `src/components/theme-toggle.tsx` 생성
- [ ] `src/app/layout.tsx`에 `ThemeProvider` + `suppressHydrationWarning` 적용
- [ ] `src/components/layout/header.tsx`에 `ThemeToggle` 추가
- [ ] `src/styles/prose.css`에 다크모드 링크 색상 추가
- [ ] 다크모드 전체 페이지 육안 검수 (라이트/다크 전환 확인)
- [ ] `src/app/admin/posts/page.tsx`에 Actions 컬럼 추가
- [ ] `src/app/admin/posts/_components/post-actions-menu.tsx` 생성
- [ ] `src/app/admin/posts/_components/delete-post-dialog.tsx` 생성
- [ ] `src/db/queries/posts.ts`에 `deletePostById` 함수 추가
- [ ] `src/app/admin/posts/_services/delete-post.ts` 생성
- [ ] 글 삭제 후 목록 갱신 확인 (revalidateTag 동작)
- [ ] 글 삭제 시 댓글 cascade 삭제 확인
