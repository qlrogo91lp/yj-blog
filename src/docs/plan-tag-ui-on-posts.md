# Posts 페이지 태그 필터 + 카드 태그 표시 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Posts 목록 페이지에서 태그 기반 필터링과 각 글 카드/리스트에 태그 표시를 추가한다.

**Architecture:** 카테고리 필터 아래에 태그 필터 행(flex-wrap)을 추가하고, searchParams `tag` 파라미터로 필터링한다. `getPosts` 쿼리에 `tagId` 옵션을 추가하고, 글 목록 조회 시 각 글의 태그 정보를 함께 가져온다. `PostCard`/`PostListItem`에 이미 존재하는 `tags` prop을 활용한다.

**Tech Stack:** Next.js App Router, Drizzle ORM, React, TypeScript

---

## 파일 구조

| 파일 | 작업 | 역할 |
|------|------|------|
| `src/db/queries/posts.ts` | 수정 | `getPosts`에 `tagId` 필터 옵션 추가, 글별 태그 조회 함수 추가 |
| `src/app/api/posts/route.ts` | 수정 | `tag` searchParam 파싱 및 `getPosts`에 전달 |
| `src/app/(main)/posts/page.tsx` | 수정 | 태그 목록 fetch + `TagFilterAction` 배치, `InfinitePostListAction`에 태그 데이터 전달 |
| `src/app/(main)/posts/_actions/tag-filter-action.tsx` | 생성 | 태그 필터 UI (flex-wrap `#태그` 칩) |
| `src/app/(main)/posts/_actions/infinite-post-list-action.tsx` | 수정 | 태그 데이터를 `PostListViewHandler`에 전달 |
| `src/app/(main)/_handlers/post-list-view-handler.tsx` | 수정 | `tags` 맵을 받아 `PostCard`/`PostListItem`에 전달 |

---

### Task 1: `getPosts`에 `tagId` 필터 옵션 추가

**Files:**
- Modify: `src/db/queries/posts.ts:8-57`

- [ ] **Step 1: `GetPostsOptions`에 `tagId` 추가 및 쿼리 수정**

`GetPostsOptions` 인터페이스에 `tagId?: number` 필드를 추가하고, `tagId`가 있으면 `postTags` 테이블을 `innerJoin`하여 해당 태그가 달린 글만 필터링한다.

```typescript
interface GetPostsOptions {
  categoryId?: number;
  tagId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getPosts({
  categoryId,
  tagId,
  page = 1,
  limit = 10,
  search,
}: GetPostsOptions = {}) {
  const offset = (page - 1) * limit;
  const where = and(
    eq(posts.status, 'published'),
    categoryId ? eq(posts.categoryId, categoryId) : undefined,
    tagId ? eq(postTags.tagId, tagId) : undefined,
    search
      ? or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.content, `%${search}%`)
        )
      : undefined
  );

  const baseQuery = tagId
    ? db
        .select({ post: posts, category: categories })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(categories, eq(posts.categoryId, categories.id))
    : db
        .select({ post: posts, category: categories })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id));

  const countQuery = tagId
    ? db
        .select({ total: count() })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
    : db.select({ total: count() }).from(posts);

  const [items, totalResult] = await Promise.all([
    baseQuery
      .where(where)
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset),
    countQuery.where(where),
  ]);

  return {
    items: items.map(({ post, category }) => ({
      ...post,
      category,
    })) as PostWithCategory[],
    total: totalResult[0].total,
    page,
    limit,
  };
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 통과

- [ ] **Step 3: Commit**

```bash
git add src/db/queries/posts.ts
git commit -m "feat: getPosts에 tagId 필터 옵션 추가"
```

---

### Task 2: 글 목록의 태그 정보를 일괄 조회하는 함수 추가

**Files:**
- Modify: `src/db/queries/tags.ts`

- [ ] **Step 1: `getTagsByPostIds` 함수 추가**

여러 글의 태그를 한 번에 조회하여 `Map<postId, TagSummary[]>` 형태로 반환하는 함수를 추가한다.

```typescript
import { inArray } from 'drizzle-orm';

/**
 * 여러 글의 태그를 일괄 조회 → Map<postId, TagSummary[]>
 */
export async function getTagsByPostIds(
  postIds: number[]
): Promise<Map<number, TagSummary[]>> {
  if (postIds.length === 0) return new Map();

  const rows = await db
    .select({
      postId: postTags.postId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  const map = new Map<number, TagSummary[]>();
  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    map.set(row.postId, list);
  }
  return map;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 통과

- [ ] **Step 3: Commit**

```bash
git add src/db/queries/tags.ts
git commit -m "feat: getTagsByPostIds 일괄 태그 조회 함수 추가"
```

---

### Task 3: API 라우트에 `tag` 파라미터 지원 추가

**Files:**
- Modify: `src/app/api/posts/route.ts`

- [ ] **Step 1: `tag` searchParam 파싱 및 전달**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/db/queries/posts';
import { getCategoryBySlug } from '@/db/queries/categories';
import { getTagBySlug } from '@/db/queries/tags';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const categorySlug = searchParams.get('category') ?? undefined;
  const tagSlug = searchParams.get('tag') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const [categoryData, tagData] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : null,
    tagSlug ? getTagBySlug(tagSlug) : null,
  ]);

  const result = await getPosts({
    categoryId: categoryData?.id,
    tagId: tagData?.id,
    page,
    limit,
    search,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/posts/route.ts
git commit -m "feat: posts API에 tag 필터 파라미터 추가"
```

---

### Task 4: 태그 필터 Action 컴포넌트 생성

**Files:**
- Create: `src/app/(main)/posts/_actions/tag-filter-action.tsx`

- [ ] **Step 1: `TagFilterAction` 컴포넌트 구현**

카테고리 필터와 동일한 searchParams 기반 네비게이션 패턴. `#태그명` 형식, outline 스타일로 카테고리 필터와 시각적 구분.

```tsx
'use client';

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

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 통과

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/posts/_actions/tag-filter-action.tsx
git commit -m "feat: 태그 필터 Action 컴포넌트 생성"
```

---

### Task 5: Posts 페이지에 태그 필터 통합 + 태그 데이터 전달

**Files:**
- Modify: `src/app/(main)/posts/page.tsx`
- Modify: `src/app/(main)/posts/_actions/infinite-post-list-action.tsx`
- Modify: `src/app/(main)/_handlers/post-list-view-handler.tsx`

- [ ] **Step 1: `posts/page.tsx`에 태그 관련 로직 추가**

`getAllTags`로 태그 목록 fetch, `getTagBySlug`로 현재 선택된 태그 확인, `getTagsByPostIds`로 초기 글의 태그 조회, `TagFilterAction` 배치.

```tsx
import { Suspense } from 'react';
import { getCategories, getCategoryBySlug } from '@/db/queries/categories';
import { getPosts } from '@/db/queries/posts';
import { getAllTags, getTagBySlug, getTagsByPostIds } from '@/db/queries/tags';
import { ViewToggleAction } from '../_actions/view-toggle-action';
import { CategoryFilterAction } from './_actions/category-filter-action';
import { SearchAction } from './_actions/search-action';
import { TagFilterAction } from './_actions/tag-filter-action';
import { InfinitePostListAction } from './_actions/infinite-post-list-action';

type Props = {
  searchParams: Promise<{
    category?: string;
    view?: string;
    search?: string;
    tag?: string;
  }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, view, search, tag: tagSlug } = await searchParams;
  const viewType = view === 'list' ? 'list' : 'card';

  const [categoriesData, categoryData, tagsData, tagData] = await Promise.all([
    getCategories(),
    categorySlug ? getCategoryBySlug(categorySlug) : null,
    getAllTags(),
    tagSlug ? getTagBySlug(tagSlug) : null,
  ]);

  const { items: posts, total } = await getPosts({
    categoryId: categoryData?.id,
    tagId: tagData?.id,
    page: 1,
    limit: 10,
    search,
  });

  const postTagsMap = await getTagsByPostIds(posts.map((p) => p.id));
  const serializedTagsMap = Object.fromEntries(postTagsMap);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">총 {total}개</span>
          <div className="flex items-center gap-4">
            <Suspense>
              <div className="max-[500px]:hidden">
                <SearchAction />
              </div>
              <ViewToggleAction viewType={viewType} />
            </Suspense>
          </div>
        </div>
        <Suspense>
          <div className="hidden max-[500px]:block">
            <SearchAction />
          </div>
        </Suspense>
        <Suspense>
          <CategoryFilterAction
            categories={categoriesData}
            currentSlug={categorySlug}
          />
        </Suspense>
        <Suspense>
          <TagFilterAction tags={tagsData} currentSlug={tagSlug} />
        </Suspense>
      </div>
      <Suspense>
        <InfinitePostListAction
          initialPosts={posts}
          initialTotal={total}
          viewType={viewType}
          initialTagsMap={serializedTagsMap}
        />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: `InfinitePostListAction`에 태그 맵 전달 로직 추가**

`initialTagsMap` prop을 받아 상태로 관리하고, 추가 로드 시 태그 정보도 함께 가져오도록 수정한다.

```tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PostListViewHandler } from '../../_handlers/post-list-view-handler';
import type { PostWithCategory, TagSummary } from '@/types';

type TagsMap = Record<number, TagSummary[]>;

type Props = {
  initialPosts: PostWithCategory[];
  initialTotal: number;
  viewType: 'card' | 'list';
  initialTagsMap?: TagsMap;
};

const LIMIT = 10;

export function InfinitePostListAction({
  initialPosts,
  initialTotal,
  viewType,
  initialTagsMap = {},
}: Props) {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostWithCategory[]>(initialPosts);
  const [tagsMap, setTagsMap] = useState<TagsMap>(initialTagsMap);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setTagsMap(initialTagsMap);
    setPage(1);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal, initialTagsMap]);

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);

    const nextPage = page + 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    params.set('limit', String(LIMIT));
    params.delete('view');

    try {
      const [postsRes, tagsRes] = await Promise.all([
        fetch(`/api/posts?${params.toString()}`),
        fetch(`/api/posts/tags?${params.toString()}`),
      ]);
      const postsData = await postsRes.json();
      const newTagsMap: TagsMap = await tagsRes.json();

      setPosts((prev) => {
        const updated = [...prev, ...postsData.items];
        setHasMore(updated.length < postsData.total);
        return updated;
      });
      setTagsMap((prev) => ({ ...prev, ...newTagsMap }));
      setPage(nextPage);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, page, searchParams]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <PostListViewHandler posts={posts} viewType={viewType} tagsMap={tagsMap} />
      <div
        ref={observerRef}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        {isFetching && '불러오는 중...'}
        {!isFetching && !hasMore && posts.length > 0 && '모든 글을 불러왔습니다.'}
      </div>
    </>
  );
}
```

- [ ] **Step 3: `PostListViewHandler`에 `tagsMap` prop 추가**

```tsx
import { PostCard } from '@/components/post/post-card';
import { PostListItem } from '@/components/post/post-list-item';
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
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} tags={tagsMap[post.id]} />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostListItem key={post.id} post={post} tags={tagsMap[post.id]} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 통과

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/posts/page.tsx \
  src/app/\(main\)/posts/_actions/infinite-post-list-action.tsx \
  src/app/\(main\)/_handlers/post-list-view-handler.tsx
git commit -m "feat: posts 페이지에 태그 필터 통합 및 카드 태그 표시"
```

---

### Task 6: 무한 스크롤 태그 API 엔드포인트 추가

**Files:**
- Create: `src/app/api/posts/tags/route.ts`

- [ ] **Step 1: 글 ID 목록으로 태그 맵을 반환하는 API 생성**

무한 스크롤로 추가 로드된 글들의 태그 정보를 가져오기 위한 엔드포인트. 동일한 필터 조건으로 글 목록을 조회한 뒤 해당 글들의 태그를 반환한다.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/db/queries/posts';
import { getCategoryBySlug } from '@/db/queries/categories';
import { getTagBySlug, getTagsByPostIds } from '@/db/queries/tags';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const categorySlug = searchParams.get('category') ?? undefined;
  const tagSlug = searchParams.get('tag') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const [categoryData, tagData] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : null,
    tagSlug ? getTagBySlug(tagSlug) : null,
  ]);

  const { items: posts } = await getPosts({
    categoryId: categoryData?.id,
    tagId: tagData?.id,
    page,
    limit,
    search,
  });

  const tagsMap = await getTagsByPostIds(posts.map((p) => p.id));
  const serialized = Object.fromEntries(tagsMap);

  return NextResponse.json(serialized);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/posts/tags/route.ts
git commit -m "feat: 무한 스크롤용 태그 맵 API 엔드포인트 추가"
```

---

### Task 7: 개발 서버에서 기능 확인

- [ ] **Step 1: 개발 서버 실행 및 확인**

Run: `npm run dev`

확인 항목:
1. `/posts` 페이지에서 카테고리 필터 아래에 태그 필터가 `#태그명` 형태로 표시되는지
2. 태그 클릭 시 URL에 `?tag=slug`가 추가되고 해당 태그의 글만 필터링되는지
3. 활성화된 태그 재클릭 시 필터 해제되는지
4. 카테고리 필터와 태그 필터가 동시에 작동하는지
5. 카드 뷰에서 각 카드 하단에 `#태그명`이 표시되는지
6. 리스트 뷰에서 각 아이템에 `#태그명`이 표시되는지
7. 무한 스크롤로 추가 로드된 글에도 태그가 표시되는지

- [ ] **Step 2: lint 확인**

Run: `npm run lint`
Expected: 에러 없이 통과

- [ ] **Step 3: 최종 Commit (필요시)**

lint/타입 수정 후 커밋.
