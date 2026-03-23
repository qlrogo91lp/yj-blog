# 수정 계획: Admin 페이지 캐싱 전략

> 작성일: 2026-03-23

## 현재 구조

```
src/app/admin/
├── layout.tsx                          # Clerk auth guard (auth() 호출 → 전체 dynamic)
├── page.tsx                            # 대시보드 (posts/comments 카운트 인라인 쿼리)
├── categories/
│   ├── page.tsx                        # getCategories() 호출
│   └── _components/
│       ├── _category-form/_services/   # create/update → revalidatePath('/admin/categories') 존재
│       └── _delete-category/_services/ # delete → revalidatePath('/admin/categories') 존재
├── comments/
│   ├── page.tsx                        # getAllCommentsForAdmin() 호출
│   └── _components/
│       └── _delete-comment/_services/  # softDelete → revalidatePath('/admin/comments') 존재
├── posts/
│   ├── page.tsx                        # getAllPostsForAdmin() 호출
│   ├── new/
│   │   ├── page.tsx                    # getCategories() 호출
│   │   └── _services/save-post.ts      # revalidatePath 없음 ← 버그
│   └── [id]/edit/
│       └── page.tsx                    # getPostById() + getCategories() 호출
├── settings/
│   └── page.tsx                        # DB 쿼리 없는 정적 페이지
└── statistics/
    ├── page.tsx                        # getStatsSummary() + getDailyStatsForRange(30)
    └── referrers/
        └── page.tsx                    # 정적 페이지 (준비 중)
```

**현재 캐싱 설정**: 모든 페이지에 `export const revalidate` 선언 없음.
`layout.tsx`에서 `auth()`를 호출하므로 admin 하위 전체가 **매 요청마다 DB 쿼리를 실행**하는 상태.

**revalidatePath 사용 현황**:
- categories CRUD 3개 서비스 → `revalidatePath('/admin/categories')` 존재
- `adminDeleteCommentAction` → `revalidatePath('/admin/comments')` 존재
- `save-post.ts` → `revalidatePath` **없음 (버그)**

---

## 분석 요약

| 페이지 | 호출 쿼리 | 변경 빈도 | 캐시 전략 |
|--------|-----------|-----------|-----------|
| `/admin` (대시보드) | posts/comments COUNT | 글·댓글 작성 시마다 | `unstable_cache` + tag 기반 무효화 |
| `/admin/categories` | `getCategories()` | 관리자 수동 조작 시만 | `unstable_cache` + tag, revalidatePath 이미 존재 |
| `/admin/comments` | `getAllCommentsForAdmin()` | 독자 댓글 작성·삭제 시 | `unstable_cache` + tag, revalidatePath 이미 존재 |
| `/admin/posts` | `getAllPostsForAdmin()` | 글 저장/발행 시 | `unstable_cache` + tag, **savePost에 revalidatePath 누락** |
| `/admin/posts/new` | `getCategories()` | 관리자 수동 조작 시만 | `unstable_cache` 재사용 |
| `/admin/posts/[id]/edit` | `getPostById()` + `getCategories()` | 글 저장 시 | `unstable_cache` 재사용 |
| `/admin/statistics` | `getStatsSummary()` + `getDailyStatsForRange(30)` | 방문 발생 시 자동 집계 | `export const revalidate = 60` |
| `/admin/settings` | 없음 | 해당 없음 | `export const revalidate = false` |
| `/admin/statistics/referrers` | 없음 | 해당 없음 | `export const revalidate = false` |

> admin 페이지는 인증된 단일 관리자만 접근한다. CDN 엣지 캐시보다 **서버 Data Cache** (`unstable_cache`) 위주로 전략을 잡는다.

---

## 수정 계획

### 1. [긴급] `save-post.ts` — `revalidateTag` + `revalidatePath` 누락 수정

**현재 코드** (`src/app/admin/posts/new/_services/save-post.ts`)

```typescript
// revalidatePath, revalidateTag 호출 없음
// 글 저장/발행 후 /admin/posts 목록이 갱신되지 않는 버그
```

**수정 후**

```typescript
import { revalidatePath, revalidateTag } from 'next/cache';

// INSERT/UPDATE 성공 후
revalidateTag('posts');
revalidatePath('/admin/posts');
```

**이유**: 현재 글을 저장해도 `/admin/posts` 목록이 갱신되지 않는다. 가장 시급한 수정 사항.

---

### 2. `getCategories` — `unstable_cache` 적용

**현재 코드** (`src/db/queries/categories.ts`)

```typescript
export async function getCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(categories.name);
}
```

**수정 후**

```typescript
import { unstable_cache } from 'next/cache';

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    return db.select().from(categories).orderBy(categories.name);
  },
  ['categories-list'],
  { tags: ['categories'] }
);
```

**이유**: categories는 관리자 직접 조작 시에만 변경된다. `unstable_cache`로 감싸면 CRUD 후 `revalidateTag('categories')` 호출 시까지 캐시를 재사용한다.

---

### 3. `getAllPostsForAdmin` — `unstable_cache` 적용

**현재 코드** (`src/db/queries/posts.ts`)

```typescript
export async function getAllPostsForAdmin() {
  return db
    .select({ ... })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .orderBy(desc(posts.updatedAt));
}
```

**수정 후**

```typescript
import { unstable_cache } from 'next/cache';

export const getAllPostsForAdmin = unstable_cache(
  async () => {
    return db
      .select({ ... })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.updatedAt));
  },
  ['admin-posts-list'],
  { tags: ['posts'] }
);
```

**이유**: 글 저장/발행 시 `revalidateTag('posts')`로 무효화하면 정확하게 캐시를 갱신할 수 있다.

---

### 4. `getAllCommentsForAdmin` — `unstable_cache` 적용

**현재 코드** (`src/db/queries/comments.ts`)

```typescript
export async function getAllCommentsForAdmin(...) {
  // 댓글 목록 조회
}
```

**수정 후**

```typescript
import { unstable_cache } from 'next/cache';

export const getAllCommentsForAdmin = unstable_cache(
  async (page: number = 1, limit: number = 20) => {
    // 댓글 목록 조회
  },
  ['admin-comments-list'],
  { tags: ['comments'] }
);
```

**이유**: 독자 댓글 작성/삭제 시 `revalidateTag('comments')`로 무효화.

---

### 5. 대시보드 `getStats` 함수 분리 + `unstable_cache` 적용

**현재 코드** (`src/app/admin/page.tsx`)

```typescript
async function getStats() {
  const [totalPosts, publishedPosts, draftPosts, totalComments] =
    await Promise.all([
      db.select({ count: count() }).from(posts),
      db.select({ count: count() }).from(posts).where(eq(posts.status, 'published')),
      db.select({ count: count() }).from(posts).where(eq(posts.status, 'draft')),
      db.select({ count: count() }).from(comments),
    ]);
  ...
}
```

**수정 방향**: 인라인 함수를 `src/db/queries/posts.ts`에 `getAdminDashboardStats`로 추출하고 `unstable_cache` 적용. 태그는 `['posts', 'comments']` 둘 다 포함 (글·댓글 변경 시 모두 무효화).

```typescript
// src/db/queries/posts.ts
export const getAdminDashboardStats = unstable_cache(
  async () => {
    const [totalPosts, publishedPosts, draftPosts, totalComments] =
      await Promise.all([...]);
    return { totalPosts, publishedPosts, draftPosts, totalComments };
  },
  ['admin-dashboard-stats'],
  { tags: ['posts', 'comments'] }
);
```

---

### 6. Server Action에 `revalidateTag` 추가

현재 `revalidatePath` 방식을 유지하되, `unstable_cache` 태그 무효화를 위해 `revalidateTag`를 함께 호출한다.

**카테고리** (3개 서비스 모두)

```typescript
import { revalidatePath, revalidateTag } from 'next/cache';

revalidateTag('categories');           // unstable_cache 무효화
revalidatePath('/admin/categories');   // 기존 유지
```

**댓글**

```typescript
revalidateTag('comments');
revalidatePath('/admin/comments');
```

**글** (save-post.ts — 현재 둘 다 없음)

```typescript
revalidateTag('posts');
revalidatePath('/admin/posts');
```

---

### 7. `/admin/statistics` — `export const revalidate = 60`

**수정 후** (`src/app/admin/statistics/page.tsx` 상단)

```typescript
export const revalidate = 60; // 1분 단위 갱신
```

**이유**: `daily_stats` 테이블은 블로그 방문 시 자동 집계되는 데이터다. 관리자가 직접 조작하지 않으므로 on-demand revalidation 대신 시간 기반이 적합하다. 1분 지연은 통계 확인에 허용 범위다.

---

### 8. `loading.tsx` 추가 — 즉각적인 UI 피드백

DB 쿼리가 있는 모든 admin 페이지에 Suspense 스켈레톤을 추가한다.

| 파일 경로 | 스켈레톤 내용 |
|-----------|---------------|
| `src/app/admin/loading.tsx` | 4개 카드 스켈레톤 |
| `src/app/admin/posts/loading.tsx` | 테이블 행 스켈레톤 (6행) |
| `src/app/admin/categories/loading.tsx` | 테이블 행 스켈레톤 (4행) |
| `src/app/admin/comments/loading.tsx` | 테이블 행 스켈레톤 (6행) |
| `src/app/admin/statistics/loading.tsx` | StatCard 스켈레톤 6개 + 차트 박스 |

**구현 패턴** (shadcn/ui `Skeleton` 컴포넌트 사용)

```typescript
// 예시: src/app/admin/posts/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPostsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 변경 후 구조

```
src/
├── app/admin/
│   ├── loading.tsx                      # NEW
│   ├── page.tsx                         # MODIFY: 인라인 getStats → getAdminDashboardStats 교체
│   ├── categories/
│   │   └── loading.tsx                  # NEW
│   ├── comments/
│   │   └── loading.tsx                  # NEW
│   ├── posts/
│   │   ├── loading.tsx                  # NEW
│   │   └── new/_services/save-post.ts   # MODIFY: revalidateTag + revalidatePath 추가
│   ├── statistics/
│   │   ├── loading.tsx                  # NEW
│   │   └── page.tsx                     # MODIFY: export const revalidate = 60
│   └── settings/
│       └── page.tsx                     # MODIFY: export const revalidate = false
└── db/queries/
    ├── categories.ts                    # MODIFY: getCategories → unstable_cache
    ├── posts.ts                         # MODIFY: getAllPostsForAdmin → unstable_cache
    │                                    #          getAdminDashboardStats 추가
    └── comments.ts                      # MODIFY: getAllCommentsForAdmin → unstable_cache
```

Server Action 변경:
- `create-category.ts` / `update-category.ts` / `delete-category.ts` → `revalidateTag('categories')` 추가
- `delete-comment.ts` → `revalidateTag('comments')` 추가
- `save-post.ts` → `revalidateTag('posts')` + `revalidatePath('/admin/posts')` **신규 추가**

---

## 체크리스트

### High (버그 수준)
- [ ] `src/app/admin/posts/new/_services/save-post.ts` — `revalidateTag('posts')` + `revalidatePath('/admin/posts')` 추가

### High (캐시 적용)
- [ ] `src/db/queries/categories.ts` — `getCategories` → `unstable_cache` 적용 (`tags: ['categories']`)
- [ ] `src/db/queries/posts.ts` — `getAllPostsForAdmin` → `unstable_cache` 적용 (`tags: ['posts']`)
- [ ] `src/db/queries/posts.ts` — `getAdminDashboardStats` 함수 추출 + `unstable_cache` 적용 (`tags: ['posts', 'comments']`)
- [ ] `src/db/queries/comments.ts` — `getAllCommentsForAdmin` → `unstable_cache` 적용 (`tags: ['comments']`)
- [ ] `src/app/admin/page.tsx` — 인라인 `getStats` 제거, `getAdminDashboardStats` 사용

### High (revalidateTag 연동)
- [ ] `create-category.ts` — `revalidateTag('categories')` 추가
- [ ] `update-category.ts` — `revalidateTag('categories')` 추가
- [ ] `delete-category.ts` — `revalidateTag('categories')` 추가
- [ ] `delete-comment.ts` — `revalidateTag('comments')` 추가

### Medium (페이지 revalidate)
- [ ] `src/app/admin/statistics/page.tsx` — `export const revalidate = 60` 추가
- [ ] `src/app/admin/settings/page.tsx` — `export const revalidate = false` 추가

### Medium (loading.tsx)
- [ ] `src/app/admin/loading.tsx` — 대시보드 스켈레톤 생성
- [ ] `src/app/admin/posts/loading.tsx` — 글 테이블 스켈레톤 생성
- [ ] `src/app/admin/categories/loading.tsx` — 카테고리 테이블 스켈레톤 생성
- [ ] `src/app/admin/comments/loading.tsx` — 댓글 테이블 스켈레톤 생성
- [ ] `src/app/admin/statistics/loading.tsx` — StatCard + 차트 스켈레톤 생성
