# 수정 계획: Roadmap 남은 항목 + PostCard/PostListItem 카테고리 링크

> 작성일: 2026-04-07

## 분석 요약

`.claude/roadmap.md`의 미구현 항목과, 논의 중 나온 **PostCard / PostListItem 카테고리 뱃지 내부 링크 추가**(SEO 목적)를 통합한 계획입니다. 카테고리 링크 작업은 단독 작업으로도 의미가 있지만, 홈 Phase 2(카테고리 바로가기)와 맞물리므로 함께 묶어 처리합니다.

우선순위는 roadmap 하단의 우선순위 제안(7~9)을 상위로 두고, 카테고리 링크 건을 **선행 작업(High)** 으로 배치합니다.

### 현재 구조 (관련 부분)

```
src/
├─ app/
│  ├─ (main)/
│  │  ├─ _components/        # hero-section, recent-posts-section
│  │  ├─ _constants/profile.ts
│  │  ├─ categories/[slug]/page.tsx   # 링크 없는 숨겨진 아카이브
│  │  ├─ posts/[slug]/page.tsx        # 글 상세 (TOC 없음, 이전/다음 없음)
│  │  └─ page.tsx                      # 홈 (Hero + 최근 글만)
│  └─ admin/
│     ├─ page.tsx                      # 대시보드 (4개 카운터만)
│     ├─ settings/page.tsx             # placeholder
│     └─ statistics/referrers/page.tsx # placeholder
├─ components/
│  └─ post/
│     ├─ post-card.tsx        # 전체가 하나의 <Link>로 감싸짐
│     └─ post-list-item.tsx   # 전체가 하나의 <Link>로 감싸짐
└─ db/queries/posts.ts
```

---

## 우선순위

| 우선순위 | 항목 |
|----------|------|
| **High** | 1. PostCard / PostListItem 카테고리 링크 · 2. 대시보드 최근 활동 위젯 · 3. 글 상세 TOC · 4. RSS 피드 |
| **Medium** | 5. 홈 Phase 2 (카테고리 바로가기 + 인기 글) · 6. 이전/다음 글 네비게이션 · 7. 글 공유 버튼 |
| **Low** | 8. 관리자 글 검색/필터 · 9. 글 상태 일괄 변경 · 10. 통계 상세(인기 글/글별 조회수/유입 경로) · 11. 설정 페이지 · 12. 홈 Phase 3 (About/Playground 프로모션) · 13. 태그 시스템 · 14. 시리즈/연재 |

---

## 수정 계획

### 1. [High] PostCard 카테고리 링크 추가

**현재 코드** (`src/components/post/post-card.tsx:12`)

```tsx
export function PostCard({ post, priority = false }: Props) {
  // ...
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="h-full overflow-hidden rounded-2xl ...">
        {/* ... */}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest ...">
              {post.category?.name ?? ''}
            </span>
            {/* ... */}
          </div>
          <h2 className="line-clamp-2 text-lg font-bold ...">{post.title}</h2>
        </div>
      </article>
    </Link>
  );
}
```

**문제점**
- `<a>` 안에 또 다른 `<a>`를 중첩할 수 없음 (HTML 사양 위반)
- 카테고리 뱃지를 개별 링크로 만들려면 구조를 바꿔야 함

**수정 후**

```tsx
export function PostCard({ post, priority = false }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative h-full overflow-hidden rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) calc(100vw - 32px), 420px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="p-5">
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

        <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight">
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

**이유**
- 카드 전체 클릭 영역은 `h2 > Link`의 `::after` 가상요소로 확장 → 여전히 카드 어디를 눌러도 글 상세로 이동
- 카테고리 `<Link>`는 `relative z-10`으로 `::after` 위에 올라가 클릭 가능 → 카테고리 아카이브로 이동
- `<a>` 중첩 없이 **카드 전체 링크 + 내부 링크 공존** 패턴 확보
- SEO 관점에서 `/categories/[slug]`로 향하는 **내부 링크 주스**와 앵커 텍스트 시그널 확보

**타입 확인 필요**: `PostWithCategory`의 `category`에 `slug`가 포함돼 있는지 `src/types/post.ts`에서 확인. `posts.ts:38`에서 `categories` 전체 컬럼을 `select`하므로 포함될 가능성이 높음.

**테스트 업데이트**: `post-card.test.tsx`에 카테고리 링크 href 검증 케이스 추가

```tsx
it("카테고리 뱃지는 /categories/[slug]로 링크된다", () => {
  render(<PostCard post={mockPost} />)
  const categoryLink = screen.getByRole("link", { name: mockPost.category.name })
  expect(categoryLink).toHaveAttribute("href", `/categories/${mockPost.category.slug}`)
})

it("제목 링크는 /posts/[slug]로 연결된다", () => {
  render(<PostCard post={mockPost} />)
  const titleLink = screen.getByRole("link", { name: mockPost.title })
  expect(titleLink).toHaveAttribute("href", `/posts/${mockPost.slug}`)
})
```

---

### 2. [High] PostListItem 카테고리 링크 추가

**현재 코드** (`src/components/post/post-list-item.tsx:11`)

```tsx
return (
  <Link href={`/posts/${post.slug}`} className="block group">
    <article className="flex min-h-35 gap-6 rounded-2xl ...">
      {/* ... */}
      <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest ...">
            {post.category?.name ?? ''}
          </span>
          {/* ... */}
        </div>
        <h2 className="line-clamp-2 text-xl font-bold ...">{post.title}</h2>
        {post.excerpt && <p>...</p>}
      </div>
    </article>
  </Link>
);
```

**수정 후**

```tsx
return (
  <article className="group relative flex min-h-35 gap-6 rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
    <div className="relative w-40 shrink-0 overflow-hidden rounded-l-xl bg-muted sm:w-48">
      {/* ... 기존 Image ... */}
    </div>

    <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
      <div className="flex items-center gap-2">
        {post.category && (
          <Link
            href={`/categories/${post.category.slug}`}
            className="relative z-10 text-[10px] font-black tracking-widest text-muted-foreground uppercase hover:text-foreground"
          >
            {post.category.name}
          </Link>
        )}
        {publishedAt && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {publishedAt}
            </time>
          </>
        )}
      </div>

      <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight">
        <Link
          href={`/posts/${post.slug}`}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {post.title}
        </Link>
      </h2>

      {post.excerpt && (
        <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>
      )}
    </div>
  </article>
);
```

**이유**: PostCard와 동일한 패턴 적용. 카드 뷰와 리스트 뷰 모두 일관된 동작.

---

### 3. [High] 대시보드 최근 활동 위젯

**대상**: `src/app/admin/page.tsx`

**추가 작업**
1. `src/db/queries/posts.ts`에 `getRecentPostsForAdmin(limit = 5)` 추가 — `updatedAt DESC` 기준, draft 포함
2. `src/db/queries/comments.ts`에 `getRecentComments(limit = 5)` 추가 — `createDate DESC`, post title join
3. `src/app/admin/_components/recent-posts-widget.tsx` 신규 — 제목, 상태 뱃지, 수정 시각
4. `src/app/admin/_components/recent-comments-widget.tsx` 신규 — 작성자, 내용 일부, 소속 글 제목 링크
5. `src/app/admin/_components/quick-actions.tsx` 신규 — "새 글 작성", "카테고리 관리" 버튼
6. `admin/page.tsx`에서 카운터 카드 아래 grid 추가

**캐시 태그**: 기존 `CACHE_TAGS.posts`, `CACHE_TAGS.comments` 재사용. 새 쿼리는 `unstable_cache`로 감싸되 기존 태그를 함께 지정해 글/댓글 변경 시 자동 무효화.

---

### 4. [High] 글 상세 TOC (Table of Contents)

**대상**: `src/app/(main)/posts/[slug]/page.tsx`

**구현 방향**
1. `src/lib/markdown.ts`에서 markdown → html 변환 시 heading에 `id` 부여 (rehype-slug)하고, 동시에 TOC 배열 추출 (rehype-autolink-headings 또는 AST 직접 방문)
2. 반환값을 `{ html, toc: Array<{ level: 2|3, text: string, id: string }> }`로 확장
3. `_components/post-toc.tsx` 신규 — 클라이언트 컴포넌트, `IntersectionObserver`로 현재 heading 하이라이트, `position: sticky`로 우측 고정
4. `posts/[slug]/page.tsx`에서 `lg:grid lg:grid-cols-[1fr_220px]` 레이아웃으로 본문 + TOC 배치. 모바일에서는 숨김
5. h2/h3만 수집 (h1은 글 제목, h4 이하는 과도)

**파일 추가**
- `src/app/(main)/posts/[slug]/_components/post-toc.tsx`
- `src/app/(main)/posts/[slug]/_utils/extract-toc.ts` (또는 lib에 통합)

---

### 5. [High] RSS 피드

**대상**: 새 파일 `src/app/feed.xml/route.ts`

**구현**
1. `getPosts({ limit: 20 })`로 최신 글 20개 조회
2. RSS 2.0 XML 문자열 생성 (feed library 없이 템플릿 리터럴로 충분). `<item>`에 `title`, `link`, `guid`, `pubDate`, `description`(excerpt), `category` 포함
3. `NextResponse`로 반환하며 `Content-Type: application/xml; charset=utf-8`, `Cache-Control: s-maxage=3600, stale-while-revalidate`
4. `BLOG_URL` 환경 변수 또는 상수에서 호스트 가져오기 (`src/app/(main)/_constants/profile.ts`에 `siteUrl` 추가)
5. `src/app/layout.tsx` 또는 `(main)/layout.tsx`의 `metadata.alternates.types['application/rss+xml']`에 피드 URL 등록 → 브라우저/리더에서 자동 검색
6. 글 발행 시 재검증은 기존 `CACHE_TAGS.posts` 흐름에 맡김 (route handler 내부에서 `getPosts` 호출 시 캐시 공유)

---

### 6. [Medium] 홈 Phase 2 — 카테고리 바로가기 + 인기 글

**대상**: `src/app/(main)/page.tsx`, `_components/`

**새 섹션**
1. `_components/categories-section.tsx` — 칩 형태. `/categories/[slug]` 링크. 상단 10개 카테고리 또는 전체
2. `_components/popular-posts-section.tsx` — 조회수 Top 5. `posts.views` 기준 정렬
3. `src/db/queries/posts.ts`에 `getPopularPosts(limit = 5)` 추가. `unstable_cache` + `CACHE_TAGS.popularPosts` 새 태그 도입 → 조회수 업데이트 시 너무 자주 무효화되지 않도록 `revalidate: 3600` 병행
4. `CACHE_TAGS`에 `popularPosts` 상수 추가
5. `page.tsx` 조합:
   ```tsx
   <HeroSection />
   <RecentPostsSection posts={recent} />
   <CategoriesSection categories={categories} />
   <PopularPostsSection posts={popular} />
   ```

**인터랙션 메모**: PostCard 카테고리 링크 작업(1번 항목)이 선행되면, 카테고리 칩 클릭 경로가 일관됨.

---

### 7. [Medium] 이전/다음 글 네비게이션

**대상**: `src/app/(main)/posts/[slug]/page.tsx`

**구현**
1. `src/db/queries/posts.ts`에 `getAdjacentPosts(publishedAt: Date, categoryId?: number | null)` 추가 → `publishedAt > cur`의 첫 글 / `publishedAt < cur`의 첫 글 조회 (같은 카테고리 우선, fallback 없이 null 허용)
2. `_components/post-navigation.tsx` 신규 — 좌우 2칸 grid, 각각 이전/다음 글 링크(제목, 썸네일 optional)
3. `page.tsx`에서 본문 아래, CommentSection 위에 배치

---

### 8. [Medium] 글 공유 버튼

**대상**: `src/app/(main)/posts/[slug]/_components/share-buttons.tsx` (신규, 클라이언트)

**구현**
- 링크 복사 (`navigator.clipboard.writeText`) → `toast.success('링크가 복사되었습니다')`
- X(트위터) / 페이스북 / LinkedIn share URL 열기 (새 탭)
- 제목 아래 또는 본문 하단 고정 영역에 배치
- Web Share API(`navigator.share`) 분기로 모바일 네이티브 공유 시트 우선

---

### 9. [Low] 관리자 글 검색/필터

**대상**: `src/app/admin/posts/page.tsx`, `_components/`

**구현**
- 상단에 검색 input + 카테고리 select + 상태(전체/발행/임시) select
- `searchParams` 기반(`?q=...&category=...&status=...`)
- `getAllPostsForAdmin`을 옵션 수신 버전으로 확장하거나 별도 `getAdminPosts(options)` 추가
- `_actions/admin-post-filter-action.tsx`로 필터 UI 분리 (클라이언트, `useRouter`로 쿼리 업데이트)

---

### 10. [Low] 글 상태 일괄 변경

**대상**: `src/app/admin/posts/_components/`

**구현**
- DataTable에 체크박스 컬럼 추가
- 선택된 id 배열을 상태로 보관 (zustand 또는 로컬 `useState`)
- 상단에 "선택 항목 발행 / 비공개 전환" 버튼
- Server Action `bulkUpdatePostStatus(ids: number[], status: 'draft' | 'published')`
- `CACHE_TAGS.posts` 무효화

---

### 11. [Low] 통계 상세 (인기 글 / 글별 조회수 / 유입 경로)

**대상**: `src/app/admin/statistics/`

**세부 항목**
- `page.tsx`에 "인기 글 Top 10" 테이블 추가 — `getPopularPosts(10)` 재사용
- `statistics/posts/[id]/page.tsx` 신규 — 글별 일별 조회수 추이 (기존 daily-stats 활용)
- `statistics/referrers/page.tsx` — 현재 placeholder. 데이터 소스가 없으므로 `referrers` 테이블 설계부터 필요. **선행 조건**: 조회수 기록 시 `document.referrer` 저장 로직 추가 → 별도 작업으로 분리 권장

---

### 12. [Low] 설정 페이지

**대상**: `src/app/admin/settings/page.tsx`

**구현 방향**
- `blog_settings` 테이블(단일 row) 또는 `key-value` 테이블
- 필드: blogName, tagline, authorBio, socialLinks(JSON), defaultMetaDescription, siteUrl
- 폼은 react-hook-form + zod
- 저장 시 `CACHE_TAGS.settings` 무효화 → Hero, RSS, 메타데이터에서 조회
- `src/app/(main)/_constants/profile.ts`의 하드코딩 값을 settings DB로 이관하는 것도 함께

---

### 13. [Low] 홈 Phase 3 — About / Apps·Playground 프로모션

**대상**: `src/app/(main)/page.tsx`, 필요 시 `/about` 신규

- 짧은 About 카드는 홈 하단에, 긴 설명은 `/about/page.tsx`로 분리
- Apps·Playground 프로모션 카드 2열 그리드

---

### 14. [Low] 태그 시스템 / 시리즈·연재

**구조 변경 작업**

- 태그: `tags`, `post_tags` 테이블 신규. 다대다. 글 에디터에서 멀티셀렉트
- 시리즈: `series` 테이블 + `posts.seriesId`, `posts.seriesOrder`. 글 상세에 "이 시리즈의 다른 글" 섹션

두 항목 모두 **스키마 변경 + UI/에디터 수정 + SEO 페이지 추가**까지 영향이 커서 별도 plan으로 분리 권장.

---

## 변경 후 구조 (High 항목 적용 기준)

```
src/
├─ app/
│  ├─ (main)/
│  │  ├─ _components/
│  │  │  ├─ hero-section.tsx
│  │  │  ├─ recent-posts-section.tsx
│  │  │  ├─ categories-section.tsx           (+ Phase 2)
│  │  │  └─ popular-posts-section.tsx        (+ Phase 2)
│  │  ├─ posts/[slug]/
│  │  │  ├─ _components/
│  │  │  │  ├─ post-toc.tsx                   (+ TOC)
│  │  │  │  ├─ post-navigation.tsx            (+ 이전/다음)
│  │  │  │  └─ share-buttons.tsx              (+ 공유)
│  │  │  └─ page.tsx                          (TOC grid 레이아웃)
│  │  └─ page.tsx                              (Phase 2 섹션 조합)
│  ├─ admin/
│  │  ├─ _components/
│  │  │  ├─ recent-posts-widget.tsx           (+ 대시보드)
│  │  │  ├─ recent-comments-widget.tsx        (+ 대시보드)
│  │  │  └─ quick-actions.tsx                 (+ 대시보드)
│  │  └─ page.tsx                              (위젯 grid)
│  └─ feed.xml/
│     └─ route.ts                              (+ RSS)
├─ components/post/
│  ├─ post-card.tsx                            (카테고리 링크)
│  ├─ post-card.test.tsx                       (테스트 추가)
│  └─ post-list-item.tsx                       (카테고리 링크)
├─ db/
│  ├─ cache-tags.ts                            (+ popularPosts)
│  └─ queries/
│     ├─ posts.ts                              (+ getRecentPostsForAdmin, getPopularPosts, getAdjacentPosts)
│     └─ comments.ts                           (+ getRecentComments)
└─ lib/
   └─ markdown.ts                              (TOC 추출)
```

---

## 체크리스트

### High
- [ ] `PostWithCategory` 타입에 `category.slug` 포함 여부 확인
- [ ] `src/components/post/post-card.tsx` — 카테고리 `<Link>` + 제목 `::after` 오버레이 패턴
- [ ] `src/components/post/post-list-item.tsx` — 동일 패턴
- [ ] `src/components/post/post-card.test.tsx` — 카테고리/제목 링크 href 테스트 추가
- [ ] `e2e/home.spec.ts` 또는 별도 — 카테고리 뱃지 클릭 시 `/categories/[slug]` 이동 검증
- [ ] `db/queries/posts.ts` — `getRecentPostsForAdmin(limit)`
- [ ] `db/queries/comments.ts` — `getRecentComments(limit)` + post title join
- [ ] `app/admin/_components/recent-posts-widget.tsx`
- [ ] `app/admin/_components/recent-comments-widget.tsx`
- [ ] `app/admin/_components/quick-actions.tsx`
- [ ] `app/admin/page.tsx` — 위젯 grid 추가
- [ ] `lib/markdown.ts` — rehype-slug 도입, TOC 배열 추출
- [ ] `app/(main)/posts/[slug]/_components/post-toc.tsx` — sticky + IntersectionObserver
- [ ] `app/(main)/posts/[slug]/page.tsx` — TOC grid 레이아웃
- [ ] `app/feed.xml/route.ts` — RSS 2.0 XML
- [ ] `app/(main)/_constants/profile.ts` — `siteUrl` 추가
- [ ] `app/layout.tsx` metadata.alternates에 RSS 등록

### Medium
- [ ] `db/cache-tags.ts` — `popularPosts` 태그
- [ ] `db/queries/posts.ts` — `getPopularPosts(limit)`, `getAdjacentPosts(...)`
- [ ] `app/(main)/_components/categories-section.tsx`
- [ ] `app/(main)/_components/popular-posts-section.tsx`
- [ ] `app/(main)/page.tsx` — Phase 2 섹션 조합
- [ ] `app/(main)/posts/[slug]/_components/post-navigation.tsx`
- [ ] `app/(main)/posts/[slug]/_components/share-buttons.tsx`
- [ ] `posts/[slug]/page.tsx` — PostNavigation, ShareButtons 배치

### Low
- [ ] 관리자 글 검색/필터 UI + 쿼리 확장
- [ ] 글 상태 일괄 변경 Server Action + 체크박스 UI
- [ ] 통계: 인기 글 Top 10 테이블, 글별 조회수 상세 페이지
- [ ] `referrers` 테이블 설계 및 조회수 기록 로직 확장 (별도 plan 권장)
- [ ] `blog_settings` 테이블 + 설정 폼 (별도 plan 권장)
- [ ] 홈 Phase 3 — About / Apps·Playground 프로모션
- [ ] 태그 시스템 (별도 plan 권장)
- [ ] 시리즈/연재 (별도 plan 권장)

### Roadmap 문서 정리
- [ ] 작업 완료 후 `.claude/roadmap.md`에서 해당 항목 ✅ 표시 / 항목 제거
