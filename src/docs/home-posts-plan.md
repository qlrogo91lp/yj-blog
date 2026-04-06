# 수정 계획: 홈 개편 · /posts 검색 · /posts 무한 스크롤

> 작성일: 2026-04-07
> 대상 roadmap 항목: #4 홈 페이지 개편(Phase 1), #5 /posts 검색 기능, #6 /posts 무한 스크롤 페이징

---

## 현재 구조

```
src/app/(main)/
├── page.tsx                          # 홈 — 글 목록(ViewToggle + PostListViewHandler)
├── layout.tsx
├── _actions/
│   └── view-toggle-action.tsx        # 카드/리스트 뷰 토글 (홈·/posts 공유)
├── _handlers/
│   └── post-list-view-handler.tsx    # viewType에 따라 PostCard / PostListItem 렌더
└── posts/
    ├── page.tsx                      # /posts — 카테고리 필터 + 페이지네이션 + 뷰 토글
    └── _actions/
        └── category-filter-action.tsx

src/db/queries/posts.ts               # getPosts({ categoryId, page, limit })
src/components/post/
├── post-card.tsx
└── post-list-item.tsx
```

---

## 분석 요약

| 문제 | 영향 |
|------|------|
| `/`와 `/posts`가 사실상 동일한 글 목록 UI — 역할 중복 | UX 혼선, 홈이 랜딩 역할을 못 함 |
| `ViewToggleAction`이 `/`와 `/posts`에 동시 사용 — 홈 개편 후 불필요 | 홈에서 제거 필요 |
| `getPosts`에 검색 파라미터 없음 | 서버에서 title/content ILIKE 검색 불가 |
| `/posts`가 서버 searchParams 기반 페이지네이션 — 클라이언트 무한 스크롤 전환 필요 | API 엔드포인트 추가 및 클라이언트 상태 관리 필요 |

---

## 수정 계획

---

### [#4] 홈 페이지 개편 — Phase 1 (Priority: High)

#### 4-1. 정적 프로필 상수 파일 생성

**신규 파일**: `src/app/(main)/_constants/profile.ts`

```ts
export const PROFILE = {
  name: 'YJ',
  headline: '개발하며 배운 것들을 기록합니다.',
  description: 'Frontend · Backend · 일상의 메모',
  ctaLabel: '글 보러가기',
  ctaHref: '/posts',
} as const;
```

**이유**: Hero 텍스트는 변경 빈도가 낮으므로 상수 파일로 관리. 추후 `/admin/settings` DB 연동 시 이 파일만 수정하면 됨.

---

#### 4-2. Hero 섹션 컴포넌트 생성

**신규 파일**: `src/app/(main)/_components/hero-section.tsx`

```tsx
import Link from 'next/link';
import { PROFILE } from '../_constants/profile';

export function HeroSection() {
  return (
    <section className="py-20 text-center">
      <h1 className="mb-3 text-4xl font-black tracking-tight">{PROFILE.name}</h1>
      <p className="mb-2 text-lg font-medium text-foreground">{PROFILE.headline}</p>
      <p className="mb-8 text-sm text-muted-foreground">{PROFILE.description}</p>
      <Link
        href={PROFILE.ctaHref}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
      >
        {PROFILE.ctaLabel}
      </Link>
    </section>
  );
}
```

---

#### 4-3. 최근 글 섹션 컴포넌트 생성

**신규 파일**: `src/app/(main)/_components/recent-posts-section.tsx`

```tsx
import Link from 'next/link';
import { PostCard } from '@/components/post/post-card';
import type { PostWithCategory } from '@/types';

type Props = {
  posts: PostWithCategory[];
};

export function RecentPostsSection({ posts }: Props) {
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
        <p className="py-12 text-center text-muted-foreground">아직 작성된 글이 없습니다.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
```

---

#### 4-4. 홈 page.tsx 교체

**파일**: `src/app/(main)/page.tsx`

**현재 코드**
```tsx
import { getPosts } from '@/db/queries/posts';
import { ViewToggleAction } from './_actions/view-toggle-action';
import { PostListViewHandler } from './_handlers/post-list-view-handler';

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { view } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';
  const { items: posts, total } = await getPosts({ limit: 10 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-bold text-primary">총{' '}{total}개</span>
        <ViewToggleAction viewType={viewType} />
      </div>
      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
```

**수정 후**
```tsx
import { getPosts } from '@/db/queries/posts';
import { HeroSection } from './_components/hero-section';
import { RecentPostsSection } from './_components/recent-posts-section';

export default async function Home() {
  const { items: posts } = await getPosts({ limit: 5 });

  return (
    <div className="mx-auto max-w-4xl px-4">
      <HeroSection />
      <RecentPostsSection posts={posts} />
    </div>
  );
}
```

**이유**: searchParams 의존 제거(뷰 토글 불필요), 최근 5개만 표시, Hero + 최근 글 구조로 역할 분리.

---

#### 4-5. ViewToggleAction·PostListViewHandler를 /posts 전용으로 이동

- `src/app/(main)/_actions/view-toggle-action.tsx` → `src/app/(main)/posts/_actions/view-toggle-action.tsx`
- `src/app/(main)/_handlers/post-list-view-handler.tsx` → `src/app/(main)/posts/_handlers/post-list-view-handler.tsx`
- `src/app/(main)/_handlers/post-list-view-handler.test.tsx` → `src/app/(main)/posts/_handlers/post-list-view-handler.test.tsx`
- `src/app/(main)/posts/page.tsx`의 import 경로 수정 (상대 경로 → `_actions/`, `_handlers/` 기준)

**이유**: 홈에서 제거 후 `/posts` 전용이 됨. 루트 `_actions`/`_handlers`에 두는 것은 page-folder 컨벤션에 맞지 않음(해당 페이지 전용 폴더가 원칙).

---

### [#5] /posts 검색 기능 (Priority: High)

#### 5-1. getPosts 쿼리에 search 옵션 추가

**파일**: `src/db/queries/posts.ts`

**현재 코드**
```ts
interface GetPostsOptions {
  categoryId?: number;
  page?: number;
  limit?: number;
}

export async function getPosts({
  categoryId,
  page = 1,
  limit = 10,
}: GetPostsOptions = {}) {
  const offset = (page - 1) * limit;
  const where = and(
    eq(posts.status, 'published'),
    categoryId ? eq(posts.categoryId, categoryId) : undefined
  );
  ...
}
```

**수정 후**
```ts
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';

interface GetPostsOptions {
  categoryId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getPosts({
  categoryId,
  page = 1,
  limit = 10,
  search,
}: GetPostsOptions = {}) {
  const offset = (page - 1) * limit;
  const where = and(
    eq(posts.status, 'published'),
    categoryId ? eq(posts.categoryId, categoryId) : undefined,
    search
      ? or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.content, `%${search}%`)
        )
      : undefined
  );
  ...
}
```

**이유**: DB 레벨에서 ILIKE로 필터링. `title`과 `content` 모두 검색.

---

#### 5-2. SearchAction 컴포넌트 생성

**신규 파일**: `src/app/(main)/posts/_actions/search-action.tsx`

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import { Search } from 'lucide-react';

export function SearchAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    router.push(`/posts?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        defaultValue={searchParams.get('search') ?? ''}
        type="text"
        placeholder="글 제목 또는 내용 검색"
        className="w-full rounded-full border bg-muted px-4 py-2 pl-10 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
      />
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </form>
  );
}
```

**이유**: searchParams 기반 URL 검색 — SEO 친화적, 뒤로가기 지원. `page` 파라미터는 검색 시 초기화.

---

#### 5-3. /posts/page.tsx에 search 파라미터 및 SearchAction 추가

**파일**: `src/app/(main)/posts/page.tsx`

**수정 후**
```tsx
import { Suspense } from 'react';
import { getCategories, getCategoryBySlug } from '@/db/queries/categories';
import { getPosts } from '@/db/queries/posts';
import { ViewToggleAction } from './_actions/view-toggle-action';
import { PostListViewHandler } from './_handlers/post-list-view-handler';
import { CategoryFilterAction } from './_actions/category-filter-action';
import { SearchAction } from './_actions/search-action';

type Props = {
  searchParams: Promise<{ category?: string; page?: string; view?: string; search?: string }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, page: pageStr, view, search } = await searchParams;
  const page = Number(pageStr) || 1;
  const viewType = view === 'list' ? 'list' : 'card';

  const [categoriesData, categoryData] = await Promise.all([
    getCategories(),
    categorySlug ? getCategoryBySlug(categorySlug) : null,
  ]);

  const { items: posts, total } = await getPosts({
    categoryId: categoryData?.id,
    page,
    limit: 10,
    search,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">총 {total}개</span>
          <ViewToggleAction viewType={viewType} />
        </div>
        <Suspense>
          <SearchAction />
        </Suspense>
        <Suspense>
          <CategoryFilterAction categories={categoriesData} currentSlug={categorySlug} />
        </Suspense>
      </div>
      <PostListViewHandler posts={posts} viewType={viewType} />
    </div>
  );
}
```

---

### [#6] /posts 무한 스크롤 페이징 (Priority: Medium)

현재 `/posts`는 서버 searchParams 기반 페이지네이션(`page` param). 이를 클라이언트 무한 스크롤로 전환한다.  
서버 컴포넌트(`posts/page.tsx`)는 초기 데이터만 렌더링, 이후 데이터는 Route Handler API를 통해 클라이언트에서 fetch.

---

#### 6-1. Route Handler 생성

**신규 파일**: `src/app/api/posts/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/db/queries/posts';
import { getCategoryBySlug } from '@/db/queries/categories';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const categorySlug = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const categoryData = categorySlug ? await getCategoryBySlug(categorySlug) : null;

  const result = await getPosts({
    categoryId: categoryData?.id,
    page,
    limit,
    search,
  });

  return NextResponse.json(result);
}
```

**이유**: 클라이언트 컴포넌트에서 추가 페이지를 fetch할 엔드포인트. query string으로 page, category, search를 받음.

---

#### 6-2. InfinitePostListAction 클라이언트 컴포넌트 생성

**신규 파일**: `src/app/(main)/posts/_actions/infinite-post-list-action.tsx`

```tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PostListViewHandler } from '../_handlers/post-list-view-handler';
import type { PostWithCategory } from '@/types';

type Props = {
  initialPosts: PostWithCategory[];
  initialTotal: number;
  viewType: 'card' | 'list';
};

const LIMIT = 10;

export function InfinitePostListAction({ initialPosts, initialTotal, viewType }: Props) {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostWithCategory[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const observerRef = useRef<HTMLDivElement>(null);

  // searchParams가 바뀌면(카테고리·검색어) 목록 초기화
  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal]);

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);

    const nextPage = page + 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    params.set('limit', String(LIMIT));

    try {
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(prev => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(posts.length + data.items.length < data.total);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, searchParams, posts.length]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <PostListViewHandler posts={posts} viewType={viewType} />
      <div ref={observerRef} className="py-8 text-center text-sm text-muted-foreground">
        {isFetching && '불러오는 중...'}
        {!hasMore && posts.length > 0 && '모든 글을 불러왔습니다.'}
      </div>
    </>
  );
}
```

**이유**: 
- 초기 데이터는 서버에서 렌더(SSR 유지).
- 이후 스크롤 시 IntersectionObserver가 트리거 → `/api/posts` fetch.
- `searchParams`(카테고리·검색어) 변경 시 `useEffect`로 목록 초기화 → 필터와 무한 스크롤 연동.

---

#### 6-3. /posts/page.tsx에서 페이지네이션 제거 + InfinitePostListAction 교체

**파일**: `src/app/(main)/posts/page.tsx`

```tsx
// searchParams에서 page 파라미터 제거
// PostListViewHandler 대신 InfinitePostListAction 사용

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, view, search } = await searchParams;  // page 제거
  const viewType = view === 'list' ? 'list' : 'card';

  ...

  const { items: posts, total } = await getPosts({
    categoryId: categoryData?.id,
    page: 1,       // 서버는 항상 1페이지만 렌더
    limit: 10,
    search,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3">
        ...필터/검색 UI...
      </div>
      <Suspense>
        <InfinitePostListAction
          initialPosts={posts}
          initialTotal={total}
          viewType={viewType}
        />
      </Suspense>
    </div>
  );
}
```

**이유**: page searchParam 의존 제거. 서버에서 1페이지만 내려주고, 클라이언트가 이어서 로드.

---

## 변경 후 구조

```
src/app/(main)/
├── page.tsx                             # Hero + 최근 글 5개 (간소화)
├── layout.tsx
├── _constants/
│   └── profile.ts                       # [NEW] Hero 정적 텍스트
├── _components/
│   ├── hero-section.tsx                 # [NEW] Hero 섹션
│   └── recent-posts-section.tsx         # [NEW] 최근 글 섹션
└── posts/
    ├── page.tsx                         # search 파라미터 추가, page 제거, InfinitePostListAction 사용
    ├── _actions/
    │   ├── view-toggle-action.tsx        # [이동] (main)/_actions/ → posts/_actions/
    │   ├── category-filter-action.tsx
    │   ├── search-action.tsx             # [NEW] 검색 입력 폼
    │   └── infinite-post-list-action.tsx # [NEW] 무한 스크롤 클라이언트 컴포넌트
    └── _handlers/
        ├── post-list-view-handler.tsx    # [이동] (main)/_handlers/ → posts/_handlers/
        └── post-list-view-handler.test.tsx

src/app/api/
└── posts/
    └── route.ts                         # [NEW] 무한 스크롤 fetch용 Route Handler

src/db/queries/posts.ts                  # search 옵션 추가 (ilike)
```

---

## 체크리스트

### #4 홈 페이지 개편
- [ ] `src/app/(main)/_constants/profile.ts` 생성
- [ ] `src/app/(main)/_components/hero-section.tsx` 생성
- [ ] `src/app/(main)/_components/recent-posts-section.tsx` 생성
- [ ] `src/app/(main)/page.tsx` 교체 (Hero + 최근 글 5개)
- [ ] `view-toggle-action.tsx` → `posts/_actions/`로 이동
- [ ] `post-list-view-handler.tsx` + `.test.tsx` → `posts/_handlers/`로 이동
- [ ] `posts/page.tsx` import 경로 수정

### #5 검색 기능
- [ ] `src/db/queries/posts.ts` — `search` 옵션 추가 (`ilike`)
- [ ] `src/app/(main)/posts/_actions/search-action.tsx` 생성
- [ ] `src/app/(main)/posts/page.tsx` — `search` searchParam 연결 + SearchAction 추가

### #6 무한 스크롤
- [ ] `src/app/api/posts/route.ts` 생성 (Route Handler)
- [ ] `src/app/(main)/posts/_actions/infinite-post-list-action.tsx` 생성
- [ ] `src/app/(main)/posts/page.tsx` — `page` searchParam 제거, InfinitePostListAction으로 교체
