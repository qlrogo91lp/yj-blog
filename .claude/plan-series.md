# 수정 계획: 시리즈/연재

> 작성일: 2026-04-07
> 우선순위: Low
> 영향 범위: 스키마 변경 + 에디터 수정 + 글 상세 UI + SEO 페이지 추가

## 배경

관련 글을 순서 있는 시리즈로 묶어 독자가 연재물을 순서대로 탐색할 수 있게 한다.

---

## 수정 계획

### 1. 스키마 추가

**`src/db/schema.ts`**

```ts
export const series = pgTable("series", {
  id:          serial("id").primaryKey(),
  name:        varchar("name", { length: 100 }).notNull(),
  slug:        varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
})
```

**`posts` 테이블에 컬럼 추가**

```ts
seriesId:    integer("series_id").references(() => series.id, { onDelete: "set null" }),
seriesOrder: integer("series_order"),
```

- `npx drizzle-kit push`로 DB 반영

### 2. 캐시 태그

**`src/db/cache-tags.ts`**

```ts
export const CACHE_TAGS = {
  // ... 기존
  series: "series",
}
```

### 3. 쿼리 추가

**`src/db/queries/series.ts` (신규)**

```ts
export const getAllSeries = unstable_cache(async () => ...)
export const getSeriesBySlug = unstable_cache(async (slug: string) => ...)

// 시리즈에 속한 글 목록 (seriesOrder ASC)
export const getPostsBySeries = unstable_cache(async (seriesId: number) => ...)
```

### 4. 글 에디터 수정

**`src/app/admin/posts/new/_components/` 및 `edit/`**

- 시리즈 셀렉트 UI 추가 (기존 시리즈 선택 + 신규 시리즈 즉석 생성)
- `seriesOrder` 숫자 입력 필드 (시리즈 선택 시 표시)
- Server Action(`create-post.ts`, `update-post.ts`)에서 `seriesId`, `seriesOrder` 저장

### 5. 타입 확장

**`src/types/post.ts`**

```ts
export type PostWithSeries = Post & {
  series: Pick<Series, 'id' | 'name' | 'slug'> | null
  seriesOrder: number | null
  seriesPosts?: Pick<Post, 'id' | 'title' | 'slug' | 'seriesOrder'>[]
}
```

### 6. 글 상세 — "이 시리즈의 다른 글" 섹션

**`src/app/(main)/posts/[slug]/_components/series-nav.tsx` (신규)**

- 시리즈 이름 표시
- 전체 글 목록 (현재 글 하이라이트)
- 이전/다음 시리즈 글 네비게이션

**`src/app/(main)/posts/[slug]/page.tsx`**

- `post.seriesId`가 있으면 `getPostsBySeries(seriesId)` 호출
- 본문 하단 또는 우측 사이드에 `<SeriesNav />` 배치

### 7. 시리즈 목록/상세 페이지

**`src/app/(main)/series/page.tsx` (신규)**

- 전체 시리즈 목록 (이름, 글 수, 설명)

**`src/app/(main)/series/[slug]/page.tsx` (신규)**

- 시리즈 설명 + 글 목록 (seriesOrder ASC)
- SEO metadata 포함

### 8. 관리자 시리즈 관리

**`src/app/admin/series/page.tsx` (신규, 선택)**

- 시리즈 목록 CRUD
- 또는 글 에디터에서 인라인 생성만 지원하는 최소 구현도 가능

---

## 체크리스트

- [ ] `src/db/schema.ts` — `series` 테이블, `posts.seriesId`, `posts.seriesOrder` 추가
- [ ] `npx drizzle-kit push` — DB 반영
- [ ] `src/db/cache-tags.ts` — `series` 태그 추가
- [ ] `src/db/queries/series.ts` — getAllSeries, getSeriesBySlug, getPostsBySeries
- [ ] `src/types/post.ts` — `PostWithSeries` 타입 추가
- [ ] 글 에디터 — 시리즈 셀렉트 + seriesOrder 입력 UI
- [ ] `create-post.ts`, `update-post.ts` — seriesId, seriesOrder 저장
- [ ] `src/app/(main)/posts/[slug]/_components/series-nav.tsx` — 시리즈 내 글 목록
- [ ] `src/app/(main)/posts/[slug]/page.tsx` — SeriesNav 조건부 렌더링
- [ ] `src/app/(main)/series/page.tsx` — 시리즈 목록
- [ ] `src/app/(main)/series/[slug]/page.tsx` — 시리즈 상세
- [ ] `src/app/admin/series/page.tsx` — 관리자 시리즈 관리 (선택)
