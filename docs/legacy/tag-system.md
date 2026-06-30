# 수정 계획: 태그 시스템

> 작성일: 2026-04-07
> 우선순위: Low
> 영향 범위: 스키마 변경 + 에디터 수정 + SEO 페이지 추가

## 배경

현재 글은 카테고리(1:N)만 지원한다. 태그(N:M)를 추가해 더 세밀한 분류와 탐색이 가능하게 한다.

---

## 수정 계획

### 1. 스키마 추가

**`src/db/schema.ts`**

```ts
export const tags = pgTable("tags", {
  id:        serial("id").primaryKey(),
  name:      varchar("name", { length: 50 }).notNull().unique(),
  slug:      varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const postTags = pgTable("post_tags", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagId:  integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.postId, t.tagId] }) }))
```

- `npx drizzle-kit push`로 DB 반영

### 2. 캐시 태그

**`src/db/cache-tags.ts`**

```ts
export const CACHE_TAGS = {
  // ... 기존
  tags: "tags",
}
```

### 3. 쿼리 추가

**`src/db/queries/tags.ts` (신규)**

```ts
export const getAllTags = unstable_cache(async () => ...)
export const getTagBySlug = unstable_cache(async (slug: string) => ...)
export const getPostsByTag = unstable_cache(async (tagId: number, options) => ...)
```

**`src/db/queries/posts.ts`** — 글 상세 조회 시 tags join 포함

### 4. 글 에디터 수정

**`src/app/admin/posts/new/_components/` 및 `edit/`**

- 태그 멀티셀렉트 UI 추가 (`cmdk` 기반 또는 custom)
- 기존 태그 선택 + 신규 태그 즉석 생성 (Enter로 추가)
- Server Action(`create-post.ts`, `update-post.ts`)에서 `post_tags` INSERT/DELETE 처리

### 5. 타입 확장

**`src/types/post.ts`**

```ts
export type PostWithTags = Post & {
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
}
```

### 6. 글 상세 페이지 태그 표시

**`src/app/(main)/posts/[slug]/_components/`**

- 본문 하단에 태그 목록 표시 (`/tags/[slug]`로 링크)

### 7. 태그 아카이브 페이지

**`src/app/(main)/tags/[slug]/page.tsx` (신규)**

- 해당 태그가 붙은 글 목록 (무한 스크롤 또는 페이지네이션)
- `<h1>` — 태그명
- SEO metadata 포함

**`src/app/(main)/tags/page.tsx` (신규, 선택)**

- 전체 태그 목록 (tag cloud 또는 테이블)

### 8. PostCard / PostListItem 태그 표시 (선택)

- 카드 하단에 태그 칩 2~3개 표시
- 클릭 시 `/tags/[slug]`로 이동

---

## 체크리스트

- [ ] `src/db/schema.ts` — `tags`, `post_tags` 테이블 추가
- [ ] `npx drizzle-kit push` — DB 반영
- [ ] `src/db/cache-tags.ts` — `tags` 태그 추가
- [ ] `src/db/queries/tags.ts` — getAllTags, getTagBySlug, getPostsByTag
- [ ] `src/db/queries/posts.ts` — 글 조회 시 tags join
- [ ] `src/types/post.ts` — `PostWithTags` 타입 추가
- [ ] 글 에디터 — 태그 멀티셀렉트 UI
- [ ] `create-post.ts`, `update-post.ts` — post_tags INSERT/DELETE
- [ ] `src/app/(main)/posts/[slug]/_components/` — 태그 목록 표시
- [ ] `src/app/(main)/tags/[slug]/page.tsx` — 태그 아카이브
- [ ] `src/app/(main)/tags/page.tsx` — 전체 태그 목록 (선택)
- [ ] PostCard / PostListItem 태그 칩 (선택)
