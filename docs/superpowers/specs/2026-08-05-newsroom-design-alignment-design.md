# Apple Newsroom 디자인 정렬 — 설계 문서

- 작성일: 2026-08-05
- 브랜치: `refactor/newsroom-design-alignment`
- 참고: [Apple Newsroom](https://www.apple.com/newsroom/), [Newsroom Archive](https://www.apple.com/newsroom/archive/)

## 배경 / 목표

현재 블로그는 폭 기준값이 페이지마다 뒤섞여(Header 1024 / 홈 896 / 상세·Footer 768) 콘텐츠 정렬선이 흔들린다. Apple Newsroom을 참고해 **콘텐츠 폭·radius·그리드·리스트·헤더**를 하나의 일관된 시스템으로 정리한다.

동작(라우팅·데이터·기능)은 바꾸지 않고 레이아웃·컴포넌트 구조와 외형만 정렬한다.

## 실측 레퍼런스 (Newsroom에서 직접 추출)

| 항목 | 값 |
|------|-----|
| 콘텐츠 폭 | **980px** (바깥 거터 1024px) |
| 그리드 | 6-col 베이스, **gap 36px** (hero=6칸 / 2up=3칸 / 3up=2칸) |
| 타일 radius | **32px** (hero·2up·3up 전부 동일) |
| hero(1up) | 980×362, 가로 대형 배너 |
| 2up | 470×472 (이미지 위 + 텍스트 아래) |
| 3up | 303×372 (2up의 축소판) |
| 아카이브 행 | 작은 썸네일 + `날짜 · 유형` eyebrow + 제목 (얇은 행) |
| 글 상세 본문 | 텍스트 컬럼 ~653px, 이미지는 그보다 넓게 bleed |
| 글로벌 nav | 항상 어두운 서페이스 + `backdrop-filter: saturate(1.8) blur(20px)` |

## 확정된 결정 사항

- **radius**: Apple과 동일한 **32px** (`--radius-card`). 현재 카드는 16px → 변경.
- **그리드**: 실제 사용은 **당분간 2-col 유지**. 단 카드 컴포넌트 3종(hero/2up/3up)은 **미리 별도 컴포넌트로 생성**해 둔다.
- **글 상세 폭**: 본문 prose는 **653px**로 유지(가독성), 본문 내 이미지는 콘텐츠 폭(980px)까지 **bleed**.
- **아카이브 리스트뷰**: **행 스타일만** 적용 (월별 그룹핑 없음).
- **헤더**: Newsroom처럼 **항상 검정** 서페이스(`rgba(0,0,0,0.8)`). 페이지 테마와 무관.

## 설계

### 1. 디자인 토큰 (`src/app/globals.css`)

```css
:root {
  --content-width: 980px;   /* 헤더·푸터·홈·목록 콘텐츠 폭 */
  --article-width: 653px;   /* 글 상세 본문(prose) 읽기 폭 */
}

@theme inline {
  /* ...기존... */
  --radius-card: 2rem;      /* 32px — 카드/타일 radius → rounded-card 유틸 생성 */
}
```

- 그리드 gap 36px는 Tailwind 기본 `gap-9`(=2.25rem=36px)와 정확히 일치 → 별도 토큰 불필요.
- `--content-width` / `--article-width`는 `:root` 변수로 두고 `max-w-[var(--content-width)]` 형태로 참조한다.

### 2. 공용 컨테이너 컴포넌트

`src/components/layout/content-container.tsx` (신규)

```tsx
type Props = { className?: string; children: React.ReactNode };

export function ContentContainer({ className, children }: Props) {
  return (
    <div className={cn('mx-auto w-full max-w-[var(--content-width)] px-4', className)}>
      {children}
    </div>
  );
}
```

적용 대상 — 전부 980px로 통일:

| 위치 | 현재 | 변경 후 |
|------|------|---------|
| Header 내부 | `max-w-5xl` | ContentContainer |
| Footer 내부 | `max-w-3xl` | ContentContainer |
| 홈 `page.tsx` | `max-w-4xl` | ContentContainer |
| 글 목록 `/posts` | `max-w-3xl` 등 | ContentContainer |

> 글 상세(`/posts/[slug]`)는 예외 — §7 참조.

### 3. 카드 컴포넌트 3종 (`src/components/post/`, 전부 신규·별도 파일)

전부 `rounded-card`(32px) 적용. 2up/3up은 구조가 동일하므로 내부 공용 base(`_post-tile-vertical` 성격)를 공유하되 **export는 3개로 분리**한다.

| 컴포넌트 | Apple 매핑 | 형태 |
|---------|-----------|------|
| `post-tile-hero.tsx` | 1up hero | 가로 대형. 이미지 풀블리드 배경 + 하단 그라데이션 위 eyebrow(카테고리·날짜)·제목 오버레이 |
| `post-tile-2up.tsx` | 2up | 이미지 위(aspect) / 텍스트 아래(카테고리·날짜·제목·태그). 현재 `PostCard`의 진화형 |
| `post-tile-3up.tsx` | 3up | 2up과 동일 구조의 축소판(폰트·패딩 축소) |

- props는 기존 `PostCard`와 동일 계열: `post: PostWithCategory`, `tags?: TagSummary[]`, `priority?: boolean`.
- 날짜 포맷은 date-fns 사용(프로젝트 컨벤션 준수).
- 기존 `post-card.tsx`는 2up으로 대체 후 **제거**, `post-list-item.tsx`는 §6 아카이브 행으로 대체 후 **제거**.

### 4. 홈 그리드 재구성

`src/app/(main)/_components/recent-posts-section.tsx`

- `최근 글` 섹션 = **hero(최신 1개) + 나머지 2up 2-col 그리드(`gap-9`)**.
- 첫 글은 `post-tile-hero`, 나머지는 `post-tile-2up`.
- `post-tile-3up`은 만들어만 두고 향후 3-col 도입 시 사용(이번엔 미사용).

### 5. 글 목록 (`/posts`)

`src/app/(main)/_handlers/post-list-view.handler.tsx`

- **카드뷰**: `post-tile-2up` 2-col 그리드(`gap-9`).
- **리스트뷰**: §6 아카이브 행.
- 무한 스크롤(`posts/_actions/infinite-post-list.action.tsx`)도 동일 컴포넌트로 렌더하도록 정렬.

### 6. 아카이브 리스트뷰 (행 스타일만)

`src/components/post/post-archive-row.tsx` (신규)

- 레이아웃: 작은 썸네일(좌, 고정폭) + 본문(우: `카테고리 · 날짜` eyebrow + 제목).
- 얇은 행 + 하단 `border-b`로 구분. 월별 그룹핑 없음.
- `PostListViewHandler`의 `viewType === 'list'` 분기가 이 컴포넌트를 렌더.

### 7. 글 상세 (`/posts/[slug]`)

- 본문 prose 컬럼: `max-w-[var(--article-width)]`(653px) centered.
- 본문 내 이미지: 콘텐츠 폭(980px)까지 bleed. `src/styles/prose.css`에서 `.prose img`(또는 figure)에 음수 마진/전용 래퍼로 653 → 980 확장.
- 헤더(제목·eyebrow) 정렬은 본문 컬럼 기준.

### 8. 헤더 다크 서페이스 (`src/components/nav/header.tsx`)

Newsroom처럼 **페이지 테마와 무관하게 항상 검정**.

- `<header>`에 `dark` 클래스를 스코프로 부여 → 자식들의 `dark:` 토큰이 전부 활성화된다(`@custom-variant dark (&:is(.dark *))`).
  - 결과: `Logo`가 기존 `dark:bg-zinc-100 dark:text-zinc-900`로 **자동 반전**(밝은 배경·어두운 마크) → 검은 헤더 위에서 또렷. **Logo 컴포넌트 수정 불필요.**
  - `NavLinks`의 `text-muted-foreground`/`text-foreground`도 밝은 톤으로 전환.
- 배경/보더: `bg-black/80 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10` (현재 `bg-background/95 border-b` 대체).
- 내부 컨테이너는 ContentContainer(980)로 통일. 높이 `h-14` 유지.
- **주의 지점**: `NavLinks`의 pill active 상태가 `bg-background`(다크 스코프에서 어두운 색) → 검은 헤더에서 대비가 약해질 수 있다. `bg-white/15` 계열로 조정 검토(구현 시 시각 확인).
- `ThemeToggle` 아이콘/버튼은 다크 스코프에서 밝게 렌더됨(추가 작업 최소). 토글은 여전히 페이지 body 테마를 전환.

## 영향 파일

**신규**
- `src/components/layout/content-container.tsx`
- `src/components/post/post-tile-hero.tsx`
- `src/components/post/post-tile-2up.tsx`
- `src/components/post/post-tile-3up.tsx`
- `src/components/post/post-archive-row.tsx`

**수정**
- `src/app/globals.css` (토큰)
- `src/components/nav/header.tsx` (다크 서페이스 + 컨테이너)
- `src/components/layout/footer.tsx` (컨테이너)
- `src/app/(main)/page.tsx` (컨테이너)
- `src/app/(main)/_components/recent-posts-section.tsx` (hero + 2up)
- `src/app/(main)/_handlers/post-list-view.handler.tsx` (2up / 아카이브 행)
- `src/app/(main)/posts/_actions/infinite-post-list.action.tsx` (동일 컴포넌트 정렬)
- 글 상세 페이지 + `src/styles/prose.css` (653 본문 + 이미지 bleed)

**제거(마이그레이션 후)**
- `src/components/post/post-card.tsx`
- `src/components/post/post-list-item.tsx`

## 테스트 (`.claude/rules/testing.md` 준수)

- 기존 `PostCard`/`PostListItem`/`PostListViewHandler` 테스트는 신규 컴포넌트에 맞춰 갱신·이전.
- 신규 컴포넌트별 Vitest 렌더링 테스트: `post-tile-hero.test.tsx`, `post-tile-2up.test.tsx`, `post-tile-3up.test.tsx`, `post-archive-row.test.tsx` (제목·링크 href·이미지 alt·카테고리 렌더 확인).
- `next/link`·`next/image` mock 패턴 사용.
- 필요 시 E2E: 홈 hero 렌더, 카드↔리스트 뷰 전환.

## 비목표 (YAGNI)

- 실제 3-col 그리드 배치는 이번 범위 밖(컴포넌트만 준비).
- 아카이브 월별 그룹핑은 이번 범위 밖.
- 색상 팔레트·타이포 스케일 전면 개편은 하지 않는다(폭·radius·그리드·헤더에 집중).

## 열린 확인 포인트 (구현 중 시각 검증)

- radius 32px가 작은 카드(2up/3up)에서 과하지 않은지 실제 렌더로 확인.
- 헤더 pill active 대비 조정값.
- 상세 이미지 bleed의 모바일 동작(980 미만 뷰포트에서 넘침 방지).
