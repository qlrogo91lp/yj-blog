# 수정 계획: PostCard · PostListItem 디자인 개편 + 테마 색상

> 작성일: 2026-03-31

## 현재 구조

```
src/components/post/
├── post-card.tsx         # 카드 뷰 컴포넌트 (수정 대상)
├── post-list-item.tsx    # 리스트 뷰 컴포넌트 (수정 대상)
└── post-card.test.tsx

src/app/(main)/
├── page.tsx
├── _handlers/
│   └── post-list-view-handler.tsx   # 그리드 레이아웃 정의
└── _actions/
    └── view-toggle-action.tsx

src/app/globals.css       # 테마 CSS 변수 (수정 대상)
```

## 분석 요약

### 현재 PostCard 문제점

1. **썸네일 비율**: `aspect-video (16:9)` → 레퍼런스는 `4:3` 비율
2. **카테고리 표시**: `<Badge>` 컴포넌트 → 레퍼런스는 대문자, 넓은 letter-spacing의 텍스트 레이블
3. **날짜 위치**: `CardFooter`(하단) → 레퍼런스는 카테고리와 같은 행 오른쪽에 배치
4. **excerpt 표시**: 현재 excerpt 렌더링 → 레퍼런스에서는 제목까지만 노출
5. **카드 스타일**: shadcn `<Card>` → 직접 스타일링 필요
6. **날짜 포맷**: `'yyyy년 M월 d일'` → `'dd MMM yyyy'` 영문 형식 (예: `12 Oct 2024`)

### 현재 PostListItem 문제점

1. **레이아웃**: 작은 썸네일(80x80) + 텍스트 → 레퍼런스는 넓은 이미지(1/3) + 풍부한 텍스트 영역
2. **카드 배경 없음**: 항목 간 구분이 divide-y 선으로만 됨 → DESIGN.md "No-Line Rule" 위반
3. **날짜 처리**: `toLocaleDateString` 사용 → date-fns 컨벤션 위반
4. **스타일 빈약**: 레퍼런스의 editorial 느낌(대제목, "READ ENTRY" CTA) 없음

### 테마 색상 문제점 (DESIGN.md 대비)

| 토큰 | 현재값 | DESIGN.md 권장 | 문제 |
|------|--------|----------------|------|
| `--background` | `oklch(1 0 0)` (순백) | `#F9F9FA` | 카드와 배경 구분 불가 |
| `--card` | `oklch(1 0 0)` (순백) | `#FFFFFF` | 배경이 같아 카드가 떠보이지 않음 |
| `--muted` | `oklch(0.97 0 0)` | `#F3F3F4` | surface_container_low에 해당 |

---

## 수정 계획

### 1. `globals.css` — 테마 배경색 수정 [High]

**현재 코드**
```css
:root {
  --background: oklch(1 0 0);   /* 순백 #FFFFFF */
  --card: oklch(1 0 0);         /* 순백 #FFFFFF */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
}
```

**수정 후**
```css
:root {
  --background: oklch(0.979 0 0);  /* #F9F9FA — DESIGN.md surface/background */
  --card: oklch(1 0 0);            /* #FFFFFF — 카드는 순백으로 배경 위에 떠보임 */
  --muted: oklch(0.957 0 0);       /* #F3F3F4 — surface_container_low */
  --muted-foreground: oklch(0.47 0 0); /* #4C4546 — on_surface_variant */
}
```

**이유**: DESIGN.md의 "Signature Textures" 원칙 — `surface_container_lowest`(card) 위에 `surface_container_low`(page bg)를 놓아 카드가 종이처럼 떠오르는 효과 구현. 순백 배경은 카드와 구분이 없어 depth 상실.

---

### 2. `post-card.tsx` — 전면 개편 [High]

**현재 코드**
```tsx
export function PostCard({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <Card className={cn('h-full overflow-hidden transition-shadow hover:shadow-md', post.thumbnailUrl && 'pt-0')}>
        {post.thumbnailUrl && (
          <div className="relative aspect-video w-full">
            <Image src={post.thumbnailUrl} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <CardHeader>
          {post.category && (
            <Badge variant="secondary" className="w-fit">{post.category.name}</Badge>
          )}
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        {post.excerpt && (
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          </CardContent>
        )}
        {publishedAt && (
          <CardFooter>
            <time className="text-xs text-muted-foreground">{publishedAt}</time>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
```

**수정 후**
```tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory } from '@/types';

type Props = {
  post: PostWithCategory;
};

export function PostCard({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="h-full overflow-hidden rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        {/* 썸네일 */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* 본문 */}
        <div className="p-5">
          {/* 카테고리 + 날짜 */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              {post.category?.name ?? ''}
            </span>
            {publishedAt && (
              <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                {publishedAt}
              </time>
            )}
          </div>

          {/* 제목 */}
          <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight">
            {post.title}
          </h2>
        </div>
      </article>
    </Link>
  );
}
```

**이유**: 4:3 이미지, 카테고리/날짜 동일 행, excerpt 제거, Air Shadow 적용(DESIGN.md Elevation 원칙), shadcn Card 의존성 제거

---

### 3. `post-list-item.tsx` — 전면 개편 [High]

**현재 코드**
```tsx
export function PostListItem({ post }: Props) {
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('ko-KR', { ... })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <div className="flex gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
        <div className="shrink-0">
          {post.thumbnailUrl ? (
            <Image src={post.thumbnailUrl} alt={post.title} width={80} height={80} className="rounded-md object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-md bg-muted" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {post.category && <Badge ...>{post.category.name}</Badge>}
          <p className="font-medium leading-snug">{post.title}</p>
          {post.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
          {publishedAt && <time className="text-xs text-muted-foreground">{publishedAt}</time>}
        </div>
      </div>
    </Link>
  );
}
```

**수정 후**
```tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory } from '@/types';

type Props = {
  post: PostWithCategory;
};

export function PostListItem({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMM dd, yyyy', { locale: enUS })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="flex gap-6 rounded-2xl bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
        {/* 썸네일 */}
        <div className="relative w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex min-w-0 flex-col justify-center gap-3">
          {/* 카테고리 · 날짜 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              {post.category?.name ?? ''}
            </span>
            {publishedAt && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                  {publishedAt}
                </time>
              </>
            )}
          </div>

          {/* 제목 */}
          <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight">
            {post.title}
          </h2>

          {/* excerpt */}
          {post.excerpt && (
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
```

**이유**: 레퍼런스 editorial 레이아웃 반영 — 넓은 이미지, 카테고리·날짜 메타 라인, 큰 제목, excerpt, "READ ENTRY" CTA. 흰색 카드 배경으로 회색 페이지 배경과 depth 구분. 구분선(divide-y) 제거하고 카드 간격으로 대체(DESIGN.md "No-Line Rule").

---

### 4. `post-list-view-handler.tsx` — 리스트 레이아웃 수정 [Medium]

**현재 코드**
```tsx
return viewType === 'card' ? (
  <div className="grid gap-4 sm:grid-cols-2">
    {posts.map((post) => <PostCard key={post.id} post={post} />)}
  </div>
) : (
  <div className="flex flex-col divide-y">
    {posts.map((post) => <PostListItem key={post.id} post={post} />)}
  </div>
);
```

**수정 후**
```tsx
return viewType === 'card' ? (
  <div className="grid gap-6 sm:grid-cols-2">
    {posts.map((post) => <PostCard key={post.id} post={post} />)}
  </div>
) : (
  <div className="flex flex-col gap-4">
    {posts.map((post) => <PostListItem key={post.id} post={post} />)}
  </div>
);
```

**이유**: 리스트 뷰 `divide-y` 제거 → `gap-4` 간격으로 대체(DESIGN.md "No-Line Rule"). 카드 배경이 생겼으므로 선 없이도 항목 구분 가능. 카드 열 수는 기존대로 2열 유지.

---

### 5. `page.tsx` — max-width 확장 [Low]

**현재 코드**
```tsx
<div className="mx-auto max-w-3xl px-4 py-8">
```

**수정 후**
```tsx
<div className="mx-auto max-w-4xl px-4 py-8">
```

**이유**: 넓은 리스트 아이템 레이아웃 수용을 위해 max-w-4xl로 소폭 확장 (2열 카드 + 리스트 아이템 기준)

---

## 변경 후 구조

```
src/app/globals.css              # ✅ --background, --muted, --muted-foreground 조정
src/components/post/
├── post-card.tsx                # ✅ 4:3 이미지, 메타 한 행, excerpt 제거, Air Shadow
├── post-list-item.tsx           # ✅ editorial 레이아웃, 흰 카드, date-fns 적용
└── post-card.test.tsx           # 업데이트 필요할 수 있음
src/app/(main)/
├── page.tsx                     # ✅ max-w-4xl
└── _handlers/
    └── post-list-view-handler.tsx  # ✅ gap-6 + divide-y 제거
```

## 체크리스트

- [ ] `globals.css` — `--background` 순백 → `#F9F9FA` 계열로 변경
- [ ] `globals.css` — `--muted` → `#F3F3F4` 계열로 변경
- [ ] `globals.css` — `--muted-foreground` → `#4C4546` 계열로 변경
- [ ] `post-card.tsx` — shadcn Card 제거, 레퍼런스 디자인 전면 재작성
- [ ] `post-card.tsx` — 날짜 포맷 `'dd MMM yyyy'` (enUS) 적용
- [ ] `post-card.tsx` — 썸네일 `aspect-[4/3]`, 카테고리/날짜 한 행
- [ ] `post-card.tsx` — excerpt 렌더링 제거
- [ ] `post-list-item.tsx` — editorial 레이아웃 전면 재작성
- [ ] `post-list-item.tsx` — 흰 카드 배경(`bg-card`) + Air Shadow 적용
- [ ] `post-list-item.tsx` — `toLocaleDateString` → date-fns 교체
- [ ] `post-list-item.tsx` — "Read Entry" CTA 추가
- [ ] `post-list-view-handler.tsx` — 카드 2열 유지, `gap-4` → `gap-6`, 리스트 `divide-y` → `gap-4`
- [ ] `page.tsx` — `max-w-3xl` → `max-w-4xl`
