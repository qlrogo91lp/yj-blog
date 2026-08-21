# 시리즈 연재 기능 설계

> 작성일: 2026-07-15
> 배경: Ralli 앱 개발 과정을 블로그에 연재하기 위한 시리즈 기능. `docs/legacy/plan-series.md`(2026-04-07)를 베이스로 현행 컨벤션·결정 사항을 반영해 재설계.

## 결정 사항 요약

| 항목 | 결정 |
|------|------|
| 관리 방식 | 관리자 페이지(`admin/series`)에서 CRUD |
| 글 순서 | `seriesOrder` 컬럼 없이 `publishedAt ASC` 자동 정렬 |
| 글 상세 UI | 상단 시리즈 박스 + 하단 이전/다음 카드 (벨로그 스타일) |
| 목록 진입점 | 헤더 내비게이션에 "시리즈" 메뉴 추가 |
| 대표 이미지 | 시리즈 내 첫 글의 썸네일 재사용 (전용 커버 없음) |
| 에디터 UI | 카테고리와 동일한 셀렉트만 (즉석 생성 없음) |

## 1. 스키마 (`src/db/schema.ts`)

```ts
export const series = pgTable('series', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // URL: /series/[slug]
  description: text('description'), // 시리즈 소개 + meta description
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

`posts`에 컬럼 1개 추가:

```ts
seriesId: integer('series_id').references(() => series.id, { onDelete: 'set null' }),
```

- PK는 현행 컨벤션(`generatedAlwaysAsIdentity()`)을 따른다. legacy 문서의 `serial`·`seriesOrder`는 사용하지 않는다.
- 시리즈 삭제 시 소속 글은 `set null`로 시리즈 지정만 해제되고 글은 보존된다.
- relations에 `series ↔ posts` 1:N 추가 (`seriesRelations`, `postsRelations.series`).
- 반영: `npx drizzle-kit push` (컬럼·테이블 추가만 있어 데이터 손실 없음).

## 2. 쿼리·캐시 레이어

**`src/db/cache-tags.ts`** — `CACHE_TAGS.series` 추가. 시리즈 관련 `unstable_cache`는 모두 이 태그를 사용한다.

**`src/db/queries/series.ts`** (신규, SQL 동사 컨벤션):

| 함수 | 용도 | 반환 |
|------|------|------|
| `selectSeriesList()` | `/series` 목록·관리자 목록 | 시리즈 + published 글 수 + 첫 글 썸네일 + 최근 발행일 |
| `selectSeriesBySlug(slug)` | `/series/[slug]` 상세 | 시리즈 + published 글 목록 (`publishedAt ASC`, id·title·slug·excerpt·publishedAt) |
| `selectSeriesPosts(seriesId)` | 글 상세 시리즈 박스 | published 글의 id·title·slug·publishedAt (`publishedAt ASC`) |
| `insertSeries` / `updateSeries` / `deleteSeries` | 관리자 쓰기 | — |

- 독자 노출 쿼리는 **published 글만** 집계·표시한다. draft는 시리즈에 속해 있어도 회차 수·목록에서 제외.
- 읽기 쿼리는 `unstable_cache` + `CACHE_TAGS.series`로 캐싱. 글 발행/수정 시에도 시리즈 구성이 바뀔 수 있으므로 글 저장 Server Action에서 `revalidateTag(CACHE_TAGS.series)`를 함께 호출한다.

## 3. 관리자 시리즈 관리 (`src/app/admin/series/`)

기존 `admin/categories` 패턴을 그대로 따른다.

- **목록**: 이름, slug, 설명, 글 수, 생성일 테이블.
- **생성/수정 폼**: 이름·slug·설명. slug는 이름에서 자동 생성하되 직접 수정 가능.
- **삭제**: 소속 글이 있으면 "글 N개의 시리즈 지정이 해제됩니다" 확인 후 진행.
- **Server Action** (`_services/`, 일반 동사): `addSeries`, `editSeries`, `removeSeries` → 내부에서 `insertSeries`/`updateSeries`/`deleteSeries` 호출 + `revalidateTag(CACHE_TAGS.series)`.
- **검증**: `seriesFormSchema` (Zod, `src/types/`) — 이름 필수·100자 제한, slug 형식(소문자·숫자·하이픈·한글 허용은 기존 post slug 규칙과 동일하게) 검증. Server Action에서 파싱 후 저장.
- slug 중복 시 DB unique 제약 에러를 잡아 "이미 사용 중인 slug입니다" 필드 에러로 반환한다.

## 4. 에디터 (`admin/posts/new`, `admin/posts/[id]/edit`)

- `SeriesSelectorAction` (`_actions/series-selector.action.tsx`) — `CategorySelectorAction`과 동일한 shadcn Select 패턴. "시리즈 없음" 선택지 포함.
- `_store.ts`에 `seriesId: number | null` 상태와 setter 추가. 수정 페이지 초기화 시 기존 값 로드.
- 글 저장 Server Action에 `seriesId` 전달·저장, `revalidateTag(CACHE_TAGS.series)` 추가.

## 5. 독자 UI — 글 상세 (`src/app/(main)/posts/[slug]/`)

`post.seriesId`가 null이면 아래 컴포넌트를 모두 렌더링하지 않는다.

- **상단 시리즈 박스** (`_actions/series-box.action.tsx`) — 본문 시작 전 배치.
  - 시리즈 이름(→ `/series/[slug]` 링크) + "3 / 7" 현재 회차 표시.
  - 접기/펼치기 토글(클라이언트 상태)로 전체 회차 목록 표시. 현재 글은 하이라이트, 나머지는 링크. 기본 접힘.
- **하단 이전/다음 카드** (`_components/series-prev-next.tsx`, 순수 컴포넌트) — 본문 끝 배치.
  - 이전 화·다음 화의 제목 카드. 첫 화는 "이전" 미표시, 마지막 화는 "다음" 미표시.
- `page.tsx`(서버 컴포넌트)에서 `selectSeriesPosts(post.seriesId)`를 호출해 두 컴포넌트에 props로 전달. 현재 글 위치(인덱스) 계산은 서버에서 수행.

## 6. 독자 UI — 시리즈 목록/상세

**`/series` (`src/app/(main)/series/page.tsx`)**

- 시리즈 카드 그리드: 첫 글 썸네일(없으면 이름·설명만의 텍스트 카드 fallback), 이름, 설명, "N개의 글", 최근 업데이트일.
- published 글이 0개인 시리즈는 목록에서 숨긴다.
- 시리즈가 하나도 없으면 빈 상태 문구 표시.

**`/series/[slug]` (`src/app/(main)/series/[slug]/page.tsx`)**

- 시리즈 이름·설명 헤더 + 회차 목록(1화부터 회차 번호·제목·발행일·excerpt).
- 존재하지 않는 slug는 `notFound()`.

**헤더 내비게이션** — `src/components/nav/nav-links.tsx`의 `links`에 `{ href: '/series', label: '시리즈' }` 추가 (블로그와 Tags 사이). `nav-links.test.tsx` 갱신.

## 7. SEO

- `/series` — 정적 `metadata` (title: "시리즈", description 고정 문구).
- `/series/[slug]` — `generateMetadata`: title = 시리즈 이름, description = 시리즈 설명(없으면 블로그 기본 meta description fallback), OG image = 첫 글 썸네일(없으면 생략).
- `src/app/sitemap.ts` — `/series` (priority 0.7, changeFrequency 'weekly') + 시리즈 상세 entries (priority 0.7, lastModified = 해당 시리즈 최신 글 발행일) 추가.
- 글 상세 JSON-LD의 `isPartOf` 시리즈 표기는 이번 범위에서 제외한다 (추후 검토).

## 8. 에러 처리

- 시리즈 폼 검증 실패: 필드 단위 에러 메시지 표시 (기존 카테고리 폼 패턴).
- slug 중복: unique 제약 에러 → 필드 에러 변환.
- 시리즈 삭제: 소속 글 수를 안내하는 확인 다이얼로그 후 실행, 완료 시 `toast.success`.
- 존재하지 않는 시리즈 slug 접근: `notFound()` → 404 페이지.

## 9. 테스트

**Vitest**
- `seriesFormSchema` — 유효/무효 케이스 (이름 누락, slug 형식, 길이 제한).
- `series-prev-next` — 첫 화(이전 없음)/중간/마지막 화(다음 없음) 렌더링.
- 시리즈 박스 — 회차 표시("3 / 7"), 접기/펼치기, 현재 글 하이라이트.
- 시리즈 카드 — 썸네일 유무 fallback 렌더링.
- `nav-links.test.tsx` — "시리즈" 링크 추가 반영.

**Playwright (`e2e/series.spec.ts`)**
- 글 상세 진입 → 시리즈 박스 노출 → 펼치기 → 다음 화 이동.
- 헤더 "시리즈" 클릭 → `/series` → 시리즈 카드 클릭 → 상세 → 1화 진입.

## 10. 구현 순서

1. 스키마 + `drizzle-kit push` + 캐시 태그
2. `src/db/queries/series.ts` + 타입/Zod 스키마
3. 관리자 `admin/series` CRUD
4. 에디터 시리즈 셀렉트 + 저장 연동
5. 글 상세 시리즈 박스·이전/다음
6. `/series`, `/series/[slug]` + 내비게이션
7. SEO (metadata·sitemap)
8. 테스트 (단계별 병행)

브랜치: `feature/series` → `develop` PR (`--no-ff` 머지).
