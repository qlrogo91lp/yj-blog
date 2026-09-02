# UI 리프레시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Header(rounded pill nav + 원형 로고), 포스트 상세 히어로, 댓글 섹션 UI를 참조 디자인 스타일로 개선하고, 본문·댓글 폭을 정렬하며, 본문 이미지 클릭 확대 기능을 추가한다.

**Architecture:** 순수 UI 작업이 대부분이며 데이터 모델·서버 액션은 변경하지 않는다. nav/logo는 `src/components/nav/`에, 포스트 히어로·본문 래퍼는 `posts/[slug]/_components/`에 둔다. 이미지 확대는 기존 shadcn `Dialog`를 재사용하는 클라이언트 컴포넌트로 구현한다(추가 의존성 없음).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui(Dialog/Badge/Button), lucide-react, date-fns, Vitest + Testing Library.

## Global Constraints

- 색상은 참조 디자인을 따르지 않는다. 기존 토큰(`background`/`muted`/`card`/`primary`/`foreground`/`border`)만 사용한다.
- 데이터(DB/모델)에 없는 항목은 구현하지 않는다(작성자명, 읽기시간, 언어, 리액션, 좋아요, 이미지첨부, AUTHOR 뱃지).
- 날짜 포맷은 date-fns(`format` + `ko` 로케일)만 사용한다. 네이티브 날짜 메서드 금지.
- lucide 아이콘 크기는 `size` 속성으로 지정한다(`className` 금지).
- 조건부 클래스는 `cn()`으로 처리한다.
- 파일명 kebab-case, 컴포넌트명 PascalCase, props 타입은 `type Props = {}`.
- 작성/수정/삭제·대댓글 시스템, 데이터 모델, 서버 액션은 변경하지 않는다.
- 검증 명령: `npm run test:run`, `npm run lint`, `npm run build`.

---

### Task 1: 원형 로고 컴포넌트

**Files:**
- Create: `src/components/nav/logo.tsx`
- Test: `src/components/nav/logo.test.tsx`

**Interfaces:**
- Produces: `LogoMark({ className }: { className?: string })` — `currentColor`로 채워지는 인라인 SVG. `Logo({ className }: { className?: string })` — 원형 배경 + LogoMark를 합친 마크.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/nav/logo.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo, LogoMark } from './logo';

describe('Logo', () => {
  it('LogoMark는 currentColor를 사용하는 svg를 렌더한다', () => {
    const { container } = render(<LogoMark className="size-4" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveClass('size-4');
  });

  it('Logo는 원형 배경 컨테이너 안에 마크를 렌더한다', () => {
    render(<Logo />);
    const mark = screen.getByLabelText('YJlogs 로고');
    expect(mark).toHaveClass('rounded-full');
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm run test:run -- src/components/nav/logo.test.tsx`
Expected: FAIL ("Cannot find module './logo'")

- [ ] **Step 3: 최소 구현 작성**

`src/components/nav/logo.tsx` (path/circle 좌표는 `public/yjlogs-logo.svg`에서 그대로 가져오고 개별 `fill`은 제거, svg 루트만 `fill="currentColor"`):

```tsx
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export function LogoMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 543 657"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.4044 103.583C48.6917 81.6407 88.2757 84.7563 110.354 110.93L271.034 301.419L431.711 110.935C453.789 84.7618 493.373 81.6456 519.66 103.588C545.948 125.53 549.737 164.85 527.659 191.023L337 417.053V556.96C337 612.188 292.229 656.96 237 656.96H198V408.671L14.4064 191.018C-7.67141 164.845 -3.88276 125.525 22.4044 103.583Z" />
      <circle cx="270" cy="70" r="70" transform="rotate(-90 270 70)" />
    </svg>
  );
}

export function Logo({ className }: Props) {
  return (
    <span
      aria-label="YJlogs 로고"
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
        className
      )}
    >
      <LogoMark className="size-4" />
    </span>
  );
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm run test:run -- src/components/nav/logo.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/nav/logo.tsx src/components/nav/logo.test.tsx
git commit -m "feat: 원형 배경 로고 컴포넌트 추가"
```

---

### Task 2: NavLinks pill 스타일 + 링크 갱신

**Files:**
- Modify: `src/components/nav/nav-links.tsx`
- Test: `src/components/nav/nav-links.test.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `NavLinks({ className?, onLinkClick?, variant? }: Props)` — `variant`는 `'pill' | 'plain'`(기본 `'pill'`). 링크 목록: `블로그`(/posts), `Tags`(/tags), `Apps`(/apps).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/nav/nav-links.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavLinks } from './nav-links';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/posts',
}));

describe('NavLinks', () => {
  it('블로그·Tags·Apps 링크를 렌더하고 플레이그라운드는 없다', () => {
    render(<NavLinks />);
    expect(screen.getByRole('link', { name: '블로그' })).toHaveAttribute('href', '/posts');
    expect(screen.getByRole('link', { name: 'Tags' })).toHaveAttribute('href', '/tags');
    expect(screen.getByRole('link', { name: 'Apps' })).toHaveAttribute('href', '/apps');
    expect(screen.queryByRole('link', { name: '플레이그라운드' })).not.toBeInTheDocument();
  });

  it('현재 경로(/posts) 링크가 활성 스타일을 가진다', () => {
    render(<NavLinks />);
    expect(screen.getByRole('link', { name: '블로그' })).toHaveClass('bg-background');
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm run test:run -- src/components/nav/nav-links.test.tsx`
Expected: FAIL (Tags 링크 없음 / `plain` 스타일이라 `bg-background` 없음)

- [ ] **Step 3: 구현 작성**

`src/components/nav/nav-links.tsx` 전체 교체:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/posts', label: '블로그' },
  { href: '/tags', label: 'Tags' },
  { href: '/apps', label: 'Apps' },
];

type Props = {
  className?: string;
  onLinkClick?: () => void;
  variant?: 'pill' | 'plain';
};

export function NavLinks({ className, onLinkClick, variant = 'pill' }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        variant === 'pill' && 'flex items-center gap-1 rounded-full bg-muted p-1',
        className
      )}
    >
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              variant === 'pill' && isActive
                ? 'bg-background text-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              variant === 'plain' && isActive && 'text-foreground font-bold'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm run test:run -- src/components/nav/nav-links.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/nav/nav-links.tsx src/components/nav/nav-links.test.tsx
git commit -m "feat: nav를 pill 스타일로 변경하고 Tags 추가·플레이그라운드 제거"
```

---

### Task 3: Header 조립 (로고 + pill nav)

**Files:**
- Modify: `src/components/nav/header.tsx`
- Modify: `src/components/nav/mobile-menu.tsx` (NavLinks에 `variant="plain"` 전달)

**Interfaces:**
- Consumes: `Logo` (Task 1), `NavLinks` (Task 2)
- Produces: 없음 (페이지 조립)

- [ ] **Step 1: header.tsx 수정**

`src/components/nav/header.tsx`에서 텍스트 로고 자리를 `Logo` + 텍스트로 바꾸고 NavLinks를 우측 그룹에서 가운데/좌측 pill로 배치. 전체 교체:

```tsx
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/nav/logo';
import { NavLinks } from '@/components/nav/nav-links';
import { MobileMenu } from '@/components/nav/mobile-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-black text-lg">
          <Logo />
          {SITE_NAME}
        </Link>

        <NavLinks className="hidden md:flex" />

        <div className="flex items-center gap-1">
          <SignedIn>
            <Link href="/admin" className="mr-1">
              <Button variant="default" size="sm">
                대시보드
              </Button>
            </Link>
          </SignedIn>
          <ThemeToggle />
          <MobileMenu />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: mobile-menu.tsx 수정**

`src/components/nav/mobile-menu.tsx`의 `NavLinks` 사용부에 `variant="plain"`을 추가한다 (드롭다운은 세로 텍스트 목록 유지):

```tsx
          <NavLinks
            variant="plain"
            className="flex flex-col gap-3"
            onLinkClick={() => setIsOpen(false)}
          />
```

- [ ] **Step 3: lint + 빌드 검증**

Run: `npm run lint && npm run build`
Expected: 에러 없이 완료

- [ ] **Step 4: 수동 확인**

`npm run dev` 후 `http://localhost:3000`에서 확인:
- light/dark 모두 로고 원형 배경·대비 정상
- pill nav 활성 탭 칩 표시, 플레이그라운드 없음
- 모바일 폭에서 햄버거 메뉴 정상

- [ ] **Step 5: 커밋**

```bash
git add src/components/nav/header.tsx src/components/nav/mobile-menu.tsx
git commit -m "feat: 헤더에 원형 로고와 pill nav 적용"
```

---

### Task 4: PostHeader 히어로 컴포넌트

**Files:**
- Create: `src/app/(main)/posts/[slug]/_components/post-header.tsx`
- Test: `src/app/(main)/posts/[slug]/_components/post-header.test.tsx`

**Interfaces:**
- Consumes: `PostWithCategoryAndTags` from `@/types`
- Produces: `PostHeader({ post }: { post: PostWithCategoryAndTags })`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/posts/[slug]/_components/post-header.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategoryAndTags } from '@/types';
import { PostHeader } from './post-header';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockPost: PostWithCategoryAndTags = {
  id: 1,
  title: 'AI가 기획·개발·디자인의 경계를 지운다면',
  slug: 'ai-boundary',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published',
  views: 1234,
  categoryId: 1,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2026-06-12'),
  createdAt: new Date('2026-06-12'),
  updatedAt: new Date('2026-06-12'),
  category: {
    id: 1,
    name: 'essay',
    slug: 'essay',
    description: null,
    createdAt: new Date('2026-01-01'),
  },
  tags: [
    { id: 1, name: 'ai', slug: 'ai' },
    { id: 2, name: 'essay', slug: 'essay' },
  ],
};

describe('PostHeader', () => {
  it('제목·카테고리·태그·조회수를 렌더한다', () => {
    render(<PostHeader post={mockPost} />);
    expect(screen.getByRole('heading', { name: /AI가 기획/ })).toBeInTheDocument();
    expect(screen.getByText('essay')).toBeInTheDocument();
    expect(screen.getByText('#ai')).toBeInTheDocument();
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });

  it('목록으로 돌아가는 링크를 렌더한다', () => {
    render(<PostHeader post={mockPost} />);
    expect(screen.getByRole('link', { name: /back to index/i })).toHaveAttribute('href', '/posts');
  });

  it('작성자명을 표시하지 않는다', () => {
    render(<PostHeader post={mockPost} />);
    expect(screen.queryByText('yjlogs')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm run test:run -- src/app/\(main\)/posts/\[slug\]/_components/post-header.test.tsx`
Expected: FAIL ("Cannot find module './post-header'")

- [ ] **Step 3: 구현 작성**

`src/app/(main)/posts/[slug]/_components/post-header.tsx`:

```tsx
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { PostWithCategoryAndTags } from '@/types';

type Props = {
  post: PostWithCategoryAndTags;
};

export function PostHeader({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <header className="mb-10">
      <Link
        href="/posts"
        className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex size-7 items-center justify-center rounded-full border">
          <ChevronLeft size={14} />
        </span>
        Back to index
      </Link>

      {post.category && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="text-primary">◆</span>
          {post.category.name}
        </p>
      )}

      <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
        {post.title}
      </h1>

      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        {publishedAt && <time>{publishedAt}</time>}
        <span>·</span>
        <span>{post.views.toLocaleString()}회 조회</span>
      </div>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge variant="outline" className="rounded-full">
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm run test:run -- src/app/\(main\)/posts/\[slug\]/_components/post-header.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/_components/post-header.tsx" "src/app/(main)/posts/[slug]/_components/post-header.test.tsx"
git commit -m "feat: 포스트 상세 히어로(PostHeader) 컴포넌트 추가"
```

---

### Task 5: PostContent 본문 래퍼 + 이미지 확대

**Files:**
- Create: `src/app/(main)/posts/[slug]/_components/post-content.tsx`
- Test: `src/app/(main)/posts/[slug]/_components/post-content.test.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogTitle` from `@/components/ui/dialog`
- Produces: `PostContent({ html }: { html: string })` — 본문 HTML을 렌더하고 `<img>` 클릭 시 모달 확대.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/(main)/posts/[slug]/_components/post-content.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostContent } from './post-content';

describe('PostContent', () => {
  it('전달된 HTML을 렌더한다', () => {
    render(<PostContent html='<p>본문 단락</p>' />);
    expect(screen.getByText('본문 단락')).toBeInTheDocument();
  });

  it('이미지 클릭 시 확대 다이얼로그가 열린다', () => {
    render(<PostContent html='<img src="/test.jpg" alt="테스트 이미지" />' />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const imgs = screen.getAllByAltText('테스트 이미지');
    fireEvent.click(imgs[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // 다이얼로그 내부에도 동일 alt 이미지가 존재(본문 + 확대본 = 2개)
    expect(screen.getAllByAltText('테스트 이미지').length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm run test:run -- src/app/\(main\)/posts/\[slug\]/_components/post-content.test.tsx`
Expected: FAIL ("Cannot find module './post-content'")

- [ ] **Step 3: 구현 작성**

`src/app/(main)/posts/[slug]/_components/post-content.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type Props = {
  html: string;
};

type ZoomedImage = {
  src: string;
  alt: string;
};

export function PostContent({ html }: Props) {
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setZoomed({ src: img.src, alt: img.alt });
    }
  };

  return (
    <>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert [&_img]:cursor-zoom-in"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <Dialog
        open={zoomed !== null}
        onOpenChange={(open) => {
          if (!open) setZoomed(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-[95vw] border-0 bg-transparent p-0 shadow-none sm:max-w-[90vw]"
        >
          <DialogTitle className="sr-only">이미지 확대 보기</DialogTitle>
          {zoomed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={zoomed.src}
              alt={zoomed.alt}
              className="mx-auto max-h-[85vh] w-auto rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm run test:run -- src/app/\(main\)/posts/\[slug\]/_components/post-content.test.tsx`
Expected: PASS

> 참고: jsdom에서 radix Dialog가 `matchMedia`/`ResizeObserver`를 요구해 실패하면 `src/test.setup.ts`에 폴리필을 추가한다:
> ```ts
> import { vi } from 'vitest';
> if (!window.matchMedia) {
>   window.matchMedia = vi.fn().mockImplementation((query: string) => ({
>     matches: false, media: query, onchange: null,
>     addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
>     addListener: vi.fn(), removeListener: vi.fn(),
>   }));
> }
> ```

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/_components/post-content.tsx" "src/app/(main)/posts/[slug]/_components/post-content.test.tsx" src/test.setup.ts
git commit -m "feat: 본문 이미지 클릭 시 모달 확대(PostContent) 추가"
```

---

### Task 6: page.tsx 통합 (히어로·본문 래퍼·너비 3xl·TOC 재배치)

**Files:**
- Modify: `src/app/(main)/posts/[slug]/page.tsx`

**Interfaces:**
- Consumes: `PostHeader` (Task 4), `PostContent` (Task 5), 기존 `PostToc`, `CommentSection`

- [ ] **Step 1: page.tsx 본문 부분 교체**

`src/app/(main)/posts/[slug]/page.tsx`의 `return (...)` 블록을 교체한다. 기존 `header`/`prose div`/하단 `footer 태그`를 제거하고 `PostHeader` + `PostContent`로 대체하며, 컨테이너 폭을 `max-w-3xl`로, TOC는 컨테이너 우측 바깥(xl 이상)에 배치한다:

```tsx
  return (
    <>
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <article>
          <PostHeader post={post} />
          <PostContent html={contentHtml} />
        </article>

        {toc.length > 0 && (
          <div className="absolute left-[calc(100%+2rem)] top-8 hidden w-[220px] xl:block">
            <PostToc toc={toc} />
          </div>
        )}
      </div>

      <CommentSection postId={post.id} postSlug={post.slug} />
    </>
  );
```

import 정리: 더 이상 쓰지 않는 `Link`, `Badge`, `cn`을 제거하고 `PostHeader`, `PostContent`를 추가한다. `markdownToHtmlWithToc`/`htmlToHtmlWithToc`, `format`/`ko`(generateMetadata에서 미사용 시 제거) 사용 여부를 확인해 미사용 import를 모두 제거한다. (히어로의 `publishedAt` 포맷은 PostHeader 내부로 이동했으므로 page.tsx의 `publishedAt` 계산도 삭제한다.)

최종 import 블록 예시:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/db/queries/posts';
import { markdownToHtmlWithToc, htmlToHtmlWithToc } from '@/lib/markdown';
import { CommentSection } from './_components/comment-section';
import { PostToc } from './_components/post-toc';
import { PostHeader } from './_components/post-header';
import { PostContent } from './_components/post-content';
```

- [ ] **Step 2: lint + 빌드 검증**

Run: `npm run lint && npm run build`
Expected: 에러 없이 완료 (미사용 import 경고 없음)

- [ ] **Step 3: 수동 확인**

`npm run dev` 후 발행된 글 상세 페이지에서:
- 히어로(Back to index/카테고리/제목/날짜·조회수/태그) 표시, 하단 footer 태그 사라짐
- 본문과 댓글의 좌우 경계가 동일(둘 다 max-w-3xl)
- TOC 있는 글: xl 폭에서 우측에 목차 표시, 좁은 폭에서 숨김
- 본문 이미지 클릭 시 모달 확대

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/page.tsx"
git commit -m "feat: 포스트 상세에 히어로·본문 래퍼 적용, 폭 3xl 정렬, TOC 재배치"
```

---

### Task 7: 댓글 섹션 UI 개선

**Files:**
- Modify: `src/app/(main)/posts/[slug]/_components/comment-section.tsx`
- Modify: `src/app/(main)/posts/[slug]/_components/comment-form.tsx`
- Modify: `src/app/(main)/posts/[slug]/_components/comment-item.tsx`

**Interfaces:**
- Consumes: 기존 `CommentForm`, `CommentList`, `getCommentsByPostId`
- Produces: 없음 (UI만 변경, props/액션 불변)

- [ ] **Step 1: comment-section.tsx 수정**

폭을 `max-w-3xl`로 유지(이미 동일)하고, 작성 폼을 카드로 감싼다. `h2`/`h3` 톤을 정리한다. 전체 교체:

```tsx
import { getCommentsByPostId } from '@/db/queries/comments';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';

type Props = {
  postId: number;
  postSlug: string;
};

export async function CommentSection({ postId, postSlug }: Props) {
  const comments = await getCommentsByPostId(postId);

  return (
    <section className="mx-auto max-w-3xl border-t px-4 py-8">
      <h2 className="mb-6 text-xl font-bold">댓글 {comments.length}개</h2>

      <div className="mb-8 rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold">댓글 작성</h3>
        <CommentForm postId={postId} postSlug={postSlug} />
      </div>

      <CommentList comments={comments} postSlug={postSlug} />
    </section>
  );
}
```

> 변경점: 입력 폼을 카드로 감싸고 목록 위로 이동(참조 디자인 순서: 입력창 → 댓글 목록). 댓글 수 헤더는 "댓글 N개"만 유지(리액션 미표시).

- [ ] **Step 2: comment-item.tsx 대댓글 보더 적용**

`src/app/(main)/posts/[slug]/_components/comment-item.tsx`에서 대댓글 래퍼 클래스를 보더 라인이 있는 들여쓰기로 바꾼다. `isReply ? 'ml-8 mt-4'` 두 곳(삭제된 댓글 분기, 일반 분기)을 모두 다음으로 교체:

```tsx
isReply ? 'mt-4 ml-4 border-l border-border pl-4' : ''
```

(파일 내 `className={isReply ? 'ml-8 mt-4' : ''}` 패턴 2곳 모두 변경.)

- [ ] **Step 3: comment-form.tsx 제출 버튼 정리(선택적 톤 조정)**

`src/app/(main)/posts/[slug]/_components/comment-form.tsx`의 제출 버튼을 카드 폭에 맞게 우측 정렬로 변경한다. 마지막 `<Button>`을 감싸는 래퍼를 추가:

```tsx
      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '등록 중...' : '댓글 등록'}
        </Button>
      </div>
```

(기존 `<Button type="submit" ...>...</Button>`을 위 블록으로 교체. 필드/검증/액션은 그대로 둔다.)

- [ ] **Step 4: lint + 빌드 검증**

Run: `npm run lint && npm run build`
Expected: 에러 없이 완료

- [ ] **Step 5: 수동 확인**

`npm run dev` 후 글 상세 하단에서:
- "댓글 N개" 헤더, 작성 폼이 카드 안에 표시
- 댓글 작성·대댓글 작성·삭제 동작 정상
- 대댓글이 좌측 보더 라인으로 들여쓰기 표시

- [ ] **Step 6: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/_components/comment-section.tsx" "src/app/(main)/posts/[slug]/_components/comment-form.tsx" "src/app/(main)/posts/[slug]/_components/comment-item.tsx"
git commit -m "feat: 댓글 섹션 카드 입력창·대댓글 보더 스타일 적용"
```

---

### Task 8: 코드 리뷰

**Files:** 없음 (Task 1~7 변경분 전체 대상)

**Interfaces:**
- Consumes: Task 1~7의 모든 변경분

- [ ] **Step 1: 전체 검증 선행**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 통과 (리뷰 전 그린 상태 확보)

- [ ] **Step 2: 코드 리뷰 실행**

`/code-review` 스킬로 현재 브랜치 diff를 리뷰한다 (correctness 버그 + 재사용·단순화 정리). 효과 우선순위가 높으면 `--fix`로 적용 검토.

Run: `/code-review`
또는 REQUIRED SUB-SKILL: superpowers:requesting-code-review 로 요구사항 충족 여부까지 검증.

- [ ] **Step 3: 리뷰 피드백 반영**

리뷰 지적사항을 superpowers:receiving-code-review 원칙(맹목적 수용 금지, 기술적 검증 후 반영)에 따라 처리한다. 각 수정은 관련 task의 테스트가 여전히 통과하는지 확인 후 개별 커밋한다.

```bash
git add -A
git commit -m "refactor: 코드 리뷰 피드백 반영"
```

- [ ] **Step 4: 재검증**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 통과

---

## 최종 검증

- [ ] `npm run test:run` 전체 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `/code-review` 수행 및 피드백 반영 완료 (Task 8)
- [ ] 수동: light/dark 헤더 로고·nav, 포스트 히어로, 본문·댓글 폭 정렬, 이미지 확대, 댓글 작성/대댓글/삭제

---

## Self-Review 결과

**Spec 커버리지**
- spec §1 Header → Task 1·2·3 ✅
- spec §2 포스트 상단 → Task 4 (BACK TO INDEX/카테고리 라벨/제목/메타/태그 상단 이동, 작성자·통계블록 제외) ✅
- spec §3 댓글 → Task 7 (댓글 N개 헤더, 카드 입력창, 대댓글 보더, 리액션/좋아요 제외) ✅
- spec §4 너비 정렬 → Task 6 (본문 max-w-3xl, 댓글 max-w-3xl, TOC 우측 재배치) ✅
- spec §5 이미지 확대 → Task 5 (Dialog 모달, 이벤트 위임, 추가 의존성 없음) ✅

**Placeholder 스캔:** 없음 (모든 step에 실제 코드/명령 포함).

**타입 일관성:** `Logo`/`LogoMark`, `NavLinks(variant)`, `PostHeader({post})`, `PostContent({html})` 시그니처가 정의·소비처에서 일치.
