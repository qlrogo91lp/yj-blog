# Newsroom 디자인 정렬 구현 계획

> **완료: 2026-08-06.** Task 1~10 전부 구현·리뷰·머지 완료. 실제 브라우저 검증 중 코드 리뷰만으로는 드러나지 않던 CSS 버그 3건을 추가로 발견해 수정했다: (1) `line-clamp-2`의 `overflow:hidden`이 스트레치드링크 가상요소를 클리핑해 카드 제목 텍스트만 클릭되던 문제(`PostTileVertical`/`PostTileHero`), (2) `PostTileHero`의 하단 텍스트 오버레이 div가 그 자체로 `position:absolute`라 containing block이 `article` 전체가 아닌 오버레이 높이(126px)로 좁아져 이미지 영역이 클릭되지 않던 문제, (3) `prose.css`의 `data-size="full"` bleed 규칙이 `data-align`과 specificity 동률로 충돌해 좌우 비대칭 bleed가 나던 문제(추가로 `data-align` 없는 이미지의 모바일 리셋 누락도 발견해 수정). 세 건 모두 fix round를 거쳐 재검토 통과했으며 상세 경위는 `.superpowers/sdd/2026-08-05-newsroom-design-alignment/progress.md` 원장에 기록되어 있다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apple Newsroom를 오마주해 콘텐츠 폭(980px)·radius(32px)·카드 3종·아카이브 행·다크 헤더를 하나의 일관된 시스템으로 정렬한다.

**Architecture:** `globals.css`에 폭·radius 토큰을 선언하고, 공용 `ContentContainer`로 레이아웃 폭을 통일한다. 재사용 카드는 `src/components/post/`에 hero/2up/3up 3종 + archive-row로 분리 생성하고, 홈·목록·리스트뷰가 이를 소비한다. 헤더는 `dark` 스코프를 걸어 항상 검정 서페이스로 만든다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, date-fns, Vitest + Testing Library.

## Global Constraints

- 날짜 포맷은 **date-fns** 사용 (네이티브 날짜 메서드 금지). 한국어 필요 시 `date-fns/locale`의 `ko`.
- 컴포넌트 파일명 kebab-case, `src/components/post/`·`src/components/layout/`에 배치.
- 테스트는 대상 파일 옆 `*.test.tsx`. `next/link`·`next/image`는 `vi.mock`으로 교체 (jsdom 미동작).
- 카드 radius는 `rounded-card`(=`--radius-card` 32px) 토큰 사용. 하드코딩된 `rounded-2xl` 금지.
- 그리드 gap은 Tailwind 기본 `gap-9`(=36px) 사용.
- 콘텐츠 폭은 `max-w-[var(--content-width)]`, 본문 폭은 `max-w-[var(--article-width)]`로 참조.
- 커밋 메시지는 **gitmoji** 사용. squash 머지 금지.
- import는 named import (`import { X } from 'react'`), `React.X` 금지.

---

### Task 1: 디자인 토큰 + ContentContainer

**Files:**

- Modify: `src/app/globals.css` (`:root` 블록, `@theme inline` 블록)
- Create: `src/components/layout/content-container.tsx`
- Test: `src/components/layout/content-container.test.tsx`

**Interfaces:**

- Consumes: 없음
- Produces:
  - CSS 변수 `--content-width: 980px`, `--article-width: 653px`, `--radius-card: 2rem`(→ `rounded-card` 유틸)
  - `ContentContainer({ className?: string; children: React.ReactNode }): JSX.Element`

- [x] **Step 1: 토큰 추가** — `src/app/globals.css`

`:root { ... }` 블록 안, `--radius: 0.625rem;` 바로 아래에 추가:

```css
--content-width: 980px;
--article-width: 653px;
```

`@theme inline { ... }` 블록 안, `--radius-4xl: ...;` 아래에 추가:

```css
--radius-card: 2rem;
```

- [x] **Step 2: 실패 테스트 작성** — `src/components/layout/content-container.test.tsx`

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentContainer } from './content-container';

describe('ContentContainer', () => {
  it('children을 렌더링한다', () => {
    render(<ContentContainer>내용</ContentContainer>);
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('content-width max-width 클래스를 적용한다', () => {
    const { container } = render(<ContentContainer>x</ContentContainer>);
    expect(container.firstElementChild?.className).toContain(
      'max-w-[var(--content-width)]'
    );
  });

  it('전달한 className을 병합한다', () => {
    const { container } = render(
      <ContentContainer className="py-6">x</ContentContainer>
    );
    expect(container.firstElementChild?.className).toContain('py-6');
  });
});
```

- [x] **Step 3: 테스트 실패 확인**

Run: `npm run test:run -- content-container`
Expected: FAIL — `Cannot find module './content-container'`

- [x] **Step 4: 구현** — `src/components/layout/content-container.tsx`

```tsx
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function ContentContainer({ className, children }: Props) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[var(--content-width)] px-4',
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [x] **Step 5: 테스트 통과 확인**

Run: `npm run test:run -- content-container`
Expected: PASS (3 tests)

- [x] **Step 6: 커밋**

```bash
git add src/app/globals.css src/components/layout/content-container.tsx src/components/layout/content-container.test.tsx
git commit -m "🎨 콘텐츠 폭·radius 토큰 및 ContentContainer 추가"
```

---

### Task 2: PostTileVertical 베이스 + PostTile2up

**Files:**

- Create: `src/components/post/post-tile-vertical.tsx`
- Create: `src/components/post/post-tile-2up.tsx`
- Test: `src/components/post/post-tile-2up.test.tsx`

**Interfaces:**

- Consumes: `rounded-card` (Task 1)
- Produces:
  - `PostTileVertical({ post: PostWithCategory; tags?: TagSummary[]; priority?: boolean; size: 'md' | 'sm' })` — 내부 공용 세로형 타일
  - `PostTile2up({ post: PostWithCategory; tags?: TagSummary[]; priority?: boolean })`

- [x] **Step 1: 베이스 구현** — `src/components/post/post-tile-vertical.tsx`

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
  size: 'md' | 'sm';
};

export function PostTileVertical({
  post,
  tags,
  priority = false,
  size,
}: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative h-full overflow-hidden rounded-card bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) calc(100vw - 32px), 470px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className={cn(size === 'md' ? 'p-5' : 'p-4')}>
        <div className="mb-3 flex items-center justify-between">
          {post.category ? (
            <Link
              href={`/categories/${post.category.slug}`}
              className="relative z-10 text-[10px] font-black tracking-widest text-muted-foreground uppercase hover:text-foreground"
            >
              {post.category.name}
            </Link>
          ) : (
            <span />
          )}
          {publishedAt && (
            <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {publishedAt}
            </time>
          )}
        </div>

        <h2
          className={cn(
            'line-clamp-2 font-bold leading-snug tracking-tight',
            size === 'md' ? 'text-lg' : 'text-base'
          )}
        >
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>

        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="relative z-10 text-[10px] font-medium text-muted-foreground hover:text-foreground"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
```

- [x] **Step 2: 실패 테스트 작성** — `src/components/post/post-tile-2up.test.tsx`

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostTile2up } from './post-tile-2up';

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockPost = {
  id: 1,
  title: '테스트 글 제목',
  slug: 'test-post',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: '요약',
  thumbnailUrl: 'https://example.com/t.jpg',
  status: 'published' as const,
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  category: { id: 1, name: '개발', slug: 'dev' },
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
} as unknown as PostWithCategory;

describe('PostTile2up', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostTile2up post={mockPost} />);
    const link = screen.getByRole('link', { name: '테스트 글 제목' });
    expect(link).toHaveAttribute('href', '/posts/test-post');
  });

  it('카테고리를 렌더링한다', () => {
    render(<PostTile2up post={mockPost} />);
    expect(screen.getByRole('link', { name: '개발' })).toHaveAttribute(
      'href',
      '/categories/dev'
    );
  });

  it('썸네일 alt에 제목을 사용한다', () => {
    render(<PostTile2up post={mockPost} />);
    expect(screen.getByAltText('테스트 글 제목')).toBeInTheDocument();
  });
});
```

- [x] **Step 3: 테스트 실패 확인**

Run: `npm run test:run -- post-tile-2up`
Expected: FAIL — `Cannot find module './post-tile-2up'`

- [x] **Step 4: 구현** — `src/components/post/post-tile-2up.tsx`

```tsx
import type { PostWithCategory, TagSummary } from '@/types';
import { PostTileVertical } from './post-tile-vertical';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
};

export function PostTile2up(props: Props) {
  return <PostTileVertical {...props} size="md" />;
}
```

- [x] **Step 5: 테스트 통과 확인**

Run: `npm run test:run -- post-tile-2up`
Expected: PASS (3 tests)

- [x] **Step 6: 커밋**

```bash
git add src/components/post/post-tile-vertical.tsx src/components/post/post-tile-2up.tsx src/components/post/post-tile-2up.test.tsx
git commit -m "✨ 세로형 타일 베이스 및 PostTile2up 추가"
```

---

### Task 3: PostTile3up

**Files:**

- Create: `src/components/post/post-tile-3up.tsx`
- Test: `src/components/post/post-tile-3up.test.tsx`

**Interfaces:**

- Consumes: `PostTileVertical` (Task 2)
- Produces: `PostTile3up({ post: PostWithCategory; tags?: TagSummary[]; priority?: boolean })`

- [x] **Step 1: 실패 테스트 작성** — `src/components/post/post-tile-3up.test.tsx`

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostTile3up } from './post-tile-3up';

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockPost = {
  id: 2,
  title: '세 번째 카드',
  slug: 'third-card',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published' as const,
  views: 0,
  categoryId: null,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  category: null,
  publishedAt: new Date('2024-02-20'),
  createdAt: new Date('2024-02-20'),
  updatedAt: new Date('2024-02-20'),
} as unknown as PostWithCategory;

describe('PostTile3up', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostTile3up post={mockPost} />);
    expect(screen.getByRole('link', { name: '세 번째 카드' })).toHaveAttribute(
      'href',
      '/posts/third-card'
    );
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- post-tile-3up`
Expected: FAIL — `Cannot find module './post-tile-3up'`

- [x] **Step 3: 구현** — `src/components/post/post-tile-3up.tsx`

```tsx
import type { PostWithCategory, TagSummary } from '@/types';
import { PostTileVertical } from './post-tile-vertical';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
};

export function PostTile3up(props: Props) {
  return <PostTileVertical {...props} size="sm" />;
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- post-tile-3up`
Expected: PASS (1 test)

- [x] **Step 5: 커밋**

```bash
git add src/components/post/post-tile-3up.tsx src/components/post/post-tile-3up.test.tsx
git commit -m "✨ PostTile3up(3-col 축소 타일) 추가"
```

---

### Task 4: PostTileHero

**Files:**

- Create: `src/components/post/post-tile-hero.tsx`
- Test: `src/components/post/post-tile-hero.test.tsx`

**Interfaces:**

- Consumes: `rounded-card` (Task 1)
- Produces: `PostTileHero({ post: PostWithCategory; tags?: TagSummary[]; priority?: boolean })`

- [x] **Step 1: 실패 테스트 작성** — `src/components/post/post-tile-hero.test.tsx`

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostTileHero } from './post-tile-hero';

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockPost = {
  id: 3,
  title: '히어로 글',
  slug: 'hero-post',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: '요약',
  thumbnailUrl: 'https://example.com/hero.jpg',
  status: 'published' as const,
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  category: { id: 1, name: '공지', slug: 'notice' },
  publishedAt: new Date('2024-03-10'),
  createdAt: new Date('2024-03-10'),
  updatedAt: new Date('2024-03-10'),
} as unknown as PostWithCategory;

describe('PostTileHero', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostTileHero post={mockPost} />);
    expect(screen.getByRole('link', { name: '히어로 글' })).toHaveAttribute(
      'href',
      '/posts/hero-post'
    );
  });

  it('카테고리명을 표시한다', () => {
    render(<PostTileHero post={mockPost} />);
    expect(screen.getByText('공지')).toBeInTheDocument();
  });

  it('썸네일 alt에 제목을 사용한다', () => {
    render(<PostTileHero post={mockPost} />);
    expect(screen.getByAltText('히어로 글')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- post-tile-hero`
Expected: FAIL — `Cannot find module './post-tile-hero'`

- [x] **Step 3: 구현** — `src/components/post/post-tile-hero.tsx`

이미지 풀블리드 배경 + 하단 그라데이션 위 eyebrow·제목 오버레이. 카테고리는 오버레이 z-index 충돌을 피하려 링크가 아닌 텍스트로 표기(타일 전체가 제목 링크의 `after:inset-0`로 클릭됨).

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
};

export function PostTileHero({ post, priority = false }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative aspect-[980/362] w-full overflow-hidden rounded-card bg-muted">
      {post.thumbnailUrl ? (
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          sizes="(max-width: 980px) 100vw, 980px"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/80 uppercase">
          {post.category && <span>{post.category.name}</span>}
          {post.category && publishedAt && (
            <span className="text-white/40">·</span>
          )}
          {publishedAt && <time>{publishedAt}</time>}
        </div>
        <h2 className="line-clamp-2 max-w-2xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>
      </div>
    </article>
  );
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- post-tile-hero`
Expected: PASS (3 tests)

- [x] **Step 5: 커밋**

```bash
git add src/components/post/post-tile-hero.tsx src/components/post/post-tile-hero.test.tsx
git commit -m "✨ PostTileHero(가로 대형 타일) 추가"
```

---

### Task 5: PostArchiveRow

**Files:**

- Create: `src/components/post/post-archive-row.tsx`
- Test: `src/components/post/post-archive-row.test.tsx`

**Interfaces:**

- Consumes: 없음
- Produces: `PostArchiveRow({ post: PostWithCategory; tags?: TagSummary[] })`

- [x] **Step 1: 실패 테스트 작성** — `src/components/post/post-archive-row.test.tsx`

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostArchiveRow } from './post-archive-row';

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockPost = {
  id: 4,
  title: '아카이브 항목',
  slug: 'archive-item',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: '요약',
  thumbnailUrl: null,
  status: 'published' as const,
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  category: { id: 1, name: '메모', slug: 'memo' },
  publishedAt: new Date('2024-04-01'),
  createdAt: new Date('2024-04-01'),
  updatedAt: new Date('2024-04-01'),
} as unknown as PostWithCategory;

describe('PostArchiveRow', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostArchiveRow post={mockPost} />);
    expect(screen.getByRole('link', { name: '아카이브 항목' })).toHaveAttribute(
      'href',
      '/posts/archive-item'
    );
  });

  it('카테고리명을 표시한다', () => {
    render(<PostArchiveRow post={mockPost} />);
    expect(screen.getByText('메모')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- post-archive-row`
Expected: FAIL — `Cannot find module './post-archive-row'`

- [x] **Step 3: 구현** — `src/components/post/post-archive-row.tsx`

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
};

export function PostArchiveRow({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMM dd, yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative flex items-center gap-4 border-b border-border py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          {post.category && <span>{post.category.name}</span>}
          {post.category && publishedAt && (
            <span className="text-muted-foreground/40">·</span>
          )}
          {publishedAt && <time>{publishedAt}</time>}
        </div>
        <h2 className="line-clamp-2 text-base font-bold leading-snug tracking-tight">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>
      </div>
    </article>
  );
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- post-archive-row`
Expected: PASS (2 tests)

- [x] **Step 5: 커밋**

```bash
git add src/components/post/post-archive-row.tsx src/components/post/post-archive-row.test.tsx
git commit -m "✨ PostArchiveRow(아카이브 행) 추가"
```

---

### Task 6: 홈 그리드 재구성

**Files:**

- Modify: `src/app/(main)/_components/recent-posts-section.tsx`
- Modify: `src/app/(main)/page.tsx`
- Test: `src/app/(main)/_components/recent-posts-section.test.tsx`

**Interfaces:**

- Consumes: `PostTileHero` (Task 4), `PostTile2up` (Task 2), `ContentContainer` (Task 1)
- Produces: 없음 (페이지 조합)

- [x] **Step 1: 실패 테스트 작성** — `src/app/(main)/_components/recent-posts-section.test.tsx`

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { RecentPostsSection } from './recent-posts-section';

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const base = {
  content: '본문',
  contentFormat: 'markdown',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published' as const,
  views: 0,
  categoryId: null,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  category: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const posts = [
  {
    ...base,
    id: 1,
    title: '히어로 글',
    slug: 'hero',
    publishedAt: new Date('2024-03-01'),
  },
  {
    ...base,
    id: 2,
    title: '두 번째 글',
    slug: 'second',
    publishedAt: new Date('2024-02-01'),
  },
] as unknown as PostWithCategory[];

describe('RecentPostsSection', () => {
  it('글이 없으면 빈 상태 메시지를 렌더링한다', () => {
    render(<RecentPostsSection posts={[]} />);
    expect(screen.getByText('아직 작성된 글이 없습니다.')).toBeInTheDocument();
  });

  it('첫 글(히어로)과 나머지 글 제목이 모두 보인다', () => {
    render(<RecentPostsSection posts={posts} />);
    expect(screen.getByRole('link', { name: '히어로 글' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '두 번째 글' })
    ).toBeInTheDocument();
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- recent-posts-section`
Expected: FAIL — 현재 구현은 `sm:grid-cols-2`에 `PostCard`만 사용하므로 히어로 링크 단언은 통과할 수 있으나, 구현 교체 후를 기준으로 작성됨. 실패하면 다음 단계로.

> 참고: 이 테스트는 교체 전에도 우연히 통과할 수 있다. 그럴 경우 Step 3 구현 후 재실행으로 회귀만 방지한다.

- [x] **Step 3: 구현** — `src/app/(main)/_components/recent-posts-section.tsx`

```tsx
import Link from 'next/link';
import { PostTile2up } from '@/components/post/post-tile-2up';
import { PostTileHero } from '@/components/post/post-tile-hero';
import type { PostWithCategory } from '@/types';

type Props = {
  posts: PostWithCategory[];
};

export function RecentPostsSection({ posts }: Props) {
  const [hero, ...rest] = posts;

  return (
    <section className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">최근 글</h2>
        <Link
          href="/posts"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          모든 글 보기 →
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          아직 작성된 글이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-9">
          <PostTileHero post={hero} priority />
          {rest.length > 0 && (
            <div className="grid gap-9 sm:grid-cols-2">
              {rest.map((post) => (
                <PostTile2up key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
```

- [x] **Step 4: 홈 컨테이너 교체** — `src/app/(main)/page.tsx`

`import { RecentPostsSection } ...` 아래에 추가:

```tsx
import { ContentContainer } from '@/components/layout/content-container';
```

`return (...)`의 `<div className="mx-auto max-w-4xl px-4">...</div>`를 다음으로 교체:

```tsx
<ContentContainer>
  <HeroSection
    blogName={settings?.blogName}
    tagline={settings?.tagline}
    authorBio={settings?.authorBio}
  />
  <RecentPostsSection posts={posts} />
</ContentContainer>
```

- [x] **Step 5: 테스트 통과 확인**

Run: `npm run test:run -- recent-posts-section`
Expected: PASS (2 tests)

- [x] **Step 6: 커밋**

```bash
git add "src/app/(main)/_components/recent-posts-section.tsx" "src/app/(main)/_components/recent-posts-section.test.tsx" "src/app/(main)/page.tsx"
git commit -m "💄 홈 최근 글을 히어로+2up 그리드로 재구성"
```

---

### Task 7: 글 목록 뷰 전환 (2up 카드 / 아카이브 행)

**Files:**

- Modify: `src/app/(main)/_handlers/post-list-view.handler.tsx`
- Modify: `src/app/(main)/posts/page.tsx`
- Test: `src/app/(main)/_handlers/post-list-view.handler.test.tsx` (기존 테스트 유지 확인)

**Interfaces:**

- Consumes: `PostTile2up` (Task 2), `PostArchiveRow` (Task 5), `ContentContainer` (Task 1)
- Produces: 없음

- [x] **Step 1: 핸들러 구현 교체** — `src/app/(main)/_handlers/post-list-view.handler.tsx`

```tsx
import { PostArchiveRow } from '@/components/post/post-archive-row';
import { PostTile2up } from '@/components/post/post-tile-2up';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  posts: PostWithCategory[];
  viewType: 'card' | 'list';
  tagsMap?: Record<number, TagSummary[]>;
};

export function PostListViewHandler({ posts, viewType, tagsMap = {} }: Props) {
  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        아직 작성된 글이 없습니다.
      </p>
    );
  }

  return viewType === 'card' ? (
    <div className="grid gap-9 sm:grid-cols-2">
      {posts.map((post) => (
        <PostTile2up key={post.id} post={post} tags={tagsMap[post.id]} />
      ))}
    </div>
  ) : (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostArchiveRow key={post.id} post={post} tags={tagsMap[post.id]} />
      ))}
    </div>
  );
}
```

> 기존 핸들러 테스트(`post-list-view.handler.test.tsx`)는 `.grid`(card)와 `.flex.flex-col`(list) 및 제목 렌더를 검증한다. 위 구현은 두 클래스와 제목을 그대로 유지하므로 수정 불필요.

- [x] **Step 2: 목록 페이지 컨테이너 교체** — `src/app/(main)/posts/page.tsx`

import 목록에 추가:

```tsx
import { ContentContainer } from '@/components/layout/content-container';
```

`return (`의 최상위 `<div className="mx-auto max-w-3xl px-4 py-8"> ... </div>`에서 여는 태그를 `<ContentContainer className="py-8">`로, 닫는 태그를 `</ContentContainer>`로 교체 (내부 내용은 그대로).

- [x] **Step 3: 테스트 실행** — 핸들러 회귀 확인

Run: `npm run test:run -- post-list-view.handler`
Expected: PASS (5 tests)

- [x] **Step 4: 커밋**

```bash
git add "src/app/(main)/_handlers/post-list-view.handler.tsx" "src/app/(main)/posts/page.tsx"
git commit -m "💄 글 목록 카드뷰 2up·리스트뷰 아카이브 행으로 전환"
```

---

### Task 8: 기존 PostCard/PostListItem 제거

**Files:**

- Delete: `src/components/post/post-card.tsx`
- Delete: `src/components/post/post-card.test.tsx`
- Delete: `src/components/post/post-list-item.tsx`

**Interfaces:**

- Consumes: 없음
- Produces: 없음

- [x] **Step 1: 잔여 참조 확인**

Run: `grep -rn "post-card\|post-list-item\|PostCard\|PostListItem" src`
Expected: **매치 없음** (Task 6·7에서 모두 교체됨). 매치가 있으면 해당 파일을 신규 컴포넌트로 먼저 교체한 뒤 진행.

- [x] **Step 2: 파일 삭제**

```bash
git rm src/components/post/post-card.tsx src/components/post/post-card.test.tsx src/components/post/post-list-item.tsx
```

- [x] **Step 3: 전체 테스트 + 빌드 확인**

Run: `npm run test:run`
Expected: 전체 PASS

Run: `npm run build`
Expected: 빌드 성공 (타입 에러 없음)

- [x] **Step 4: 커밋**

```bash
git commit -m "🔥 신규 타일로 대체된 PostCard·PostListItem 제거"
```

---

### Task 9: 헤더 다크 서페이스 + 푸터 폭 통일

**Files:**

- Modify: `src/components/nav/header.tsx`
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/components/nav/nav-links.tsx` (pill active 대비 조정)

**Interfaces:**

- Consumes: `ContentContainer` (Task 1)
- Produces: 없음

- [x] **Step 1: pill 변형 사용처 확인**

Run: `grep -rn "NavLinks" src`
Expected: `header.tsx`(pill 기본), `mobile-menu`(variant plain 예상). pill 변형이 Header에서만 쓰이는지 확인한 뒤 Step 2 진행.

- [x] **Step 2: 헤더 구현 교체** — `src/components/nav/header.tsx`

`import { ContentContainer } from '@/components/layout/content-container';` 추가 후, `Header` 함수를 다음으로 교체:

```tsx
export function Header() {
  return (
    <header className="dark sticky top-0 z-50 border-b border-white/10 bg-black/80 text-white backdrop-blur-xl backdrop-saturate-150">
      <ContentContainer className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-black">
          <Logo />
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks className="hidden md:flex" />
          <HeaderAdminLink />
          <ThemeToggle />
          <MobileMenu />
          <HeaderAuthButtons />
        </div>
      </ContentContainer>
    </header>
  );
}
```

> `dark` 스코프로 `Logo`의 `dark:bg-zinc-100 dark:text-zinc-900`가 자동 활성화되어 밝은 배경으로 반전된다. `text-white`로 사이트명·기본 상속 텍스트를 밝게 만든다.

- [x] **Step 3: pill active 대비 조정** — `src/components/nav/nav-links.tsx`

`variant === 'pill'`의 active 배경 `bg-background`(다크 스코프에서 어두워 대비 약함)을 밝은 반투명으로 교체. 아래 라인의 `bg-background`를 `bg-white/15`로 변경:

```tsx
<motion.span
  layoutId="nav-pill"
  className="absolute inset-0 rounded-full bg-white/15 shadow-sm"
  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
/>
```

- [x] **Step 4: 푸터 폭 통일** — `src/components/layout/footer.tsx`

```tsx
import { ContentContainer } from '@/components/layout/content-container';
import { SITE_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <ContentContainer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </ContentContainer>
    </footer>
  );
}
```

- [x] **Step 5: 브라우저 시각 검증**

- `preview_start`로 dev 서버(`.claude/launch.json`의 dev 설정, 없으면 생성) 실행 후 `/` 접속.
- 확인 항목: 헤더가 검정 서페이스 + blur, 로고 밝은 배경으로 반전, nav 텍스트·pill active 대비 양호, 콘텐츠·푸터가 980px 폭. 라이트/다크 페이지 테마 모두에서 헤더는 검정 유지.
- `read_console_messages`로 에러 없음 확인. 스크린샷으로 결과 공유.

- [x] **Step 6: 커밋**

```bash
git add src/components/nav/header.tsx src/components/nav/nav-links.tsx src/components/layout/footer.tsx
git commit -m "💄 헤더 다크 서페이스 적용 및 푸터 폭 980px 통일"
```

---

### Task 10: 글 상세 본문 653px + 이미지 bleed

**Files:**

- Modify: `src/app/(main)/posts/[slug]/page.tsx`
- Modify: `src/styles/prose.css`

**Interfaces:**

- Consumes: `--article-width`, `--content-width` (Task 1)
- Produces: 없음

- [x] **Step 1: 본문 컨테이너 폭 변경** — `src/app/(main)/posts/[slug]/page.tsx`

본문 래퍼의 `max-w-3xl`을 본문 폭 토큰으로 교체. 아래 라인을 변경:

```tsx
      <div className="relative mx-auto max-w-[var(--article-width)] px-4 py-8">
```

(기존: `<div className="relative mx-auto max-w-3xl px-4 py-8">`)

- [x] **Step 2: 이미지 bleed 규칙 추가** — `src/styles/prose.css`

`figure[data-size="full"]` / `img[data-size="full"]`가 653 본문을 넘어 콘텐츠 폭(980)까지 확장되도록 교체. 기존 블록:

```css
.prose figure[data-size='full'],
.prose img[data-size='full'] {
  width: 100%;
}
```

을 다음으로 교체:

```css
.prose figure[data-size='full'],
.prose img[data-size='full'] {
  width: var(--content-width);
  max-width: calc(100vw - 2rem);
  margin-left: 50%;
  transform: translateX(-50%);
}
```

그리고 파일 하단 모바일 미디어쿼리에서 bleed 리셋을 추가. 기존:

```css
@media (max-width: 640px) {
  .prose figure[data-size],
  .prose img[data-size] {
    width: 100%;
  }
}
```

을 다음으로 교체:

```css
@media (max-width: 640px) {
  .prose figure[data-size],
  .prose img[data-size] {
    width: 100%;
  }
  .prose figure[data-size='full'],
  .prose img[data-size='full'] {
    margin-left: 0;
    transform: none;
  }
}
```

- [x] **Step 3: 브라우저 시각 검증**

- dev 서버에서 발행된 글 상세(`/posts/<slug>`) 접속.
- 확인: 본문 텍스트 컬럼 653px, `data-size="full"` 이미지가 좌우로 대칭 bleed(≈980px), 데스크톱/모바일 모두 뷰포트 넘침 없음, TOC(≥1340px) 위치 정상.
- `read_console_messages` 에러 없음 확인. 스크린샷 공유.

- [x] **Step 4: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/page.tsx" src/styles/prose.css
git commit -m "💄 글 상세 본문 653px 및 full 이미지 콘텐츠 폭 bleed"
```

---

## Self-Review (작성자 확인 완료)

**Spec coverage**

- §1 토큰 → Task 1 ✅ / §2 컨테이너 → Task 1 + 각 페이지 교체(6·7·9) ✅
- §3 카드 3종 → Task 2·3·4 ✅ / §6 아카이브 행 → Task 5·7 ✅
- §4 홈 재구성 → Task 6 ✅ / §5 목록 → Task 7 ✅
- §7 글 상세 653+bleed → Task 10 ✅ / §8 다크 헤더 → Task 9 ✅
- 기존 컴포넌트 제거·테스트 정리 → Task 8 ✅

**Placeholder scan** — "TODO/적절히 처리" 등 없음. 모든 코드 스텝에 실제 코드 포함.

**Type consistency** — 카드 3종·아카이브 행 props(`post`/`tags?`/`priority?`)와 `PostTileVertical`의 `size` 인터페이스가 Task 간 일치. `PostListViewHandler` props 시그니처 불변(소비처 영향 없음).

## 비고

- 이 계획은 브랜치 `refactor/newsroom-design-alignment`에서 실행한다. 완료 후 `develop`으로 `--no-ff` PR.
- 3-col 실제 배치·아카이브 월별 그룹핑은 범위 밖(YAGNI). `PostTile3up`은 생성만 하고 미사용.
