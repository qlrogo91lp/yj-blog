# 수정 계획: 통계 상세 — 유입 경로(Referrers) + 글별 조회수

> 작성일: 2026-04-07
> 우선순위: Low
> 선행 조건: 기존 `posts.views` 및 `daily_stats` 테이블 존재

## 배경

`src/app/admin/statistics/referrers/page.tsx`는 현재 placeholder 상태. 유입 경로 데이터를 수집하려면 조회수 기록 시 `document.referrer`를 저장하는 백엔드 로직부터 설계가 필요하다.

---

## 수정 계획

### 1. `referrers` 테이블 설계

**`src/db/schema.ts`에 추가**

```ts
export const referrers = pgTable("referrers", {
  id:        serial("id").primaryKey(),
  postId:    integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
  referrer:  varchar("referrer", { length: 2048 }),  // document.referrer 값
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
})
```

- `referrer`가 빈 문자열이면 직접 접근(direct)으로 분류
- `npx drizzle-kit push`로 DB 반영

### 2. 조회수 기록 로직 확장

**대상**: 조회수를 기록하는 Server Action (현재 위치 확인 필요)

- 클라이언트에서 `document.referrer`를 함께 전송
- Server Action에서 `referrers` 테이블에 INSERT

```ts
// 클라이언트 (ViewCountHandler 또는 유사 컴포넌트)
await incrementViewCount({ postId, referrer: document.referrer })

// Server Action
await db.insert(referrers).values({ postId, referrer })
```

### 3. 쿼리 추가

**`src/db/queries/statistics.ts` (신규 또는 기존 파일에 추가)**

```ts
// 특정 기간 상위 referrer 집계
export async function getTopReferrers(limit = 20, days = 30) { ... }

// 글별 referrer 집계
export async function getReferrersByPost(postId: number) { ... }
```

### 4. 통계 인기 글 + 글별 조회수 페이지

**`src/app/admin/statistics/page.tsx`**
- "인기 글 Top 10" 테이블 추가 — `getPopularPosts(10)` 재사용

**`src/app/admin/statistics/posts/[id]/page.tsx` (신규)**
- 글별 일별 조회수 추이 (기존 `daily_stats` 활용)
- 글별 referrer 목록

**`src/app/admin/statistics/referrers/page.tsx` (placeholder 대체)**
- 기간 필터 (7일 / 30일 / 전체)
- 상위 referrer 테이블: 도메인, 방문 수, 비율

---

## 체크리스트

- [ ] `src/db/schema.ts` — `referrers` 테이블 추가
- [ ] `npx drizzle-kit push` — DB 반영
- [ ] 조회수 기록 클라이언트 컴포넌트 — `document.referrer` 전송
- [ ] 조회수 Server Action — `referrers` INSERT 추가
- [ ] `src/db/queries/statistics.ts` — `getTopReferrers`, `getReferrersByPost`
- [ ] `app/admin/statistics/page.tsx` — 인기 글 Top 10 테이블
- [ ] `app/admin/statistics/posts/[id]/page.tsx` — 글별 조회수 상세
- [ ] `app/admin/statistics/referrers/page.tsx` — placeholder 대체
