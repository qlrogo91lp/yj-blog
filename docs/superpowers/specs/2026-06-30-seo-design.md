# SEO 풀패키지 — Design

> 작성일 2026-06-30. 과거 `docs/legacy/seo-design.md`·`seo-plan.md`를 현재 시점·현재 `.claude/rules` 컨벤션 기준으로 다시 설계한 문서. legacy 문서는 히스토리로만 보존하고 이 문서를 기준으로 한다.

## 목표

개인 블로그의 검색·SNS 노출을 개선한다. 글마다 SEO 메타데이터(요약·OG·구조화 데이터)를 챙길 수 있는 입력 UI와, 글 상세 페이지의 완전한 메타 출력을 도입한다. 처음 SEO를 적용하는 운영자(본인)를 위한 실전 가이드 문서도 함께 만든다.

## 결정 요약

| 주제 | 결정 |
|------|------|
| 입력 필드 | **excerpt + metaTitle** 두 개만 노출. `metaDescription`은 excerpt를 fallback으로 재사용 (별도 입력 없음) |
| excerpt 채우기 | 기본 빈 칸 + **"AI로 요약 생성" 버튼**(Claude Haiku) + textarea 수동 보정 |
| OG 이미지 | 정적 — `thumbnailUrl` → `public/og-default.png` fallback (동적 생성 안 함) |
| 메타 출력 | OpenGraph / Twitter Cards / canonical / metadataBase |
| 구조화 데이터 | JSON-LD `BlogPosting` 풀필드 |
| 이미지 alt | `ImageToolbar`에 톱니 버튼 → alt 편집 popover |
| 가이드 | SEO 운영 가이드 + 글 작성 체크리스트 문서 (`docs/seo-guide.md`) |
| 네이밍 | 현재 `.claude/rules` dot-suffix 컨벤션 준수 (`*.action.tsx` 등) |

## 현재 상태 (이미 갖춰진 것)

- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/feed.xml/route.ts` — 크롤링 인프라
- `posts` 스키마에 `excerpt`, `metaTitle`, `metaDescription`, `thumbnailUrl` 컬럼 존재
- 썸네일 업로드 UI(`_actions/thumbnail-upload.action.tsx`), 글 목록 카드/상세 헤더에서 썸네일 사용
- 글 상세 `generateMetadata`는 기본 `title`/`description`만 출력 (`metaTitle ?? title`, `metaDescription ?? excerpt`)
- 루트 레이아웃 `generateMetadata`는 기본 `title`/`description` + RSS alternate

### 미구현 (이번 작업 범위)

1. SEO 입력 UI (excerpt + metaTitle, AI 요약 버튼, 글자수 카운터)
2. AI 요약 Server Action
3. OG / Twitter / canonical / metadataBase
4. JSON-LD `BlogPosting`
5. 이미지 alt 입력 UI
6. `og-default.png` 기본 OG 이미지
7. SEO 운영 가이드 문서

## 데이터 모델

스키마 변경 **없음**. 기존 컬럼을 그대로 활용한다.

- `excerpt` — 입력 UI에서 직접 채움(또는 AI 생성). 글 목록 카드 요약 + metaDescription fallback
- `metaTitle` — 선택 입력. 비면 `title` 사용
- `metaDescription` — 입력 UI 노출 안 함. `generateMetadata`에서 `metaDescription ?? excerpt`로 이미 fallback 동작 중이므로 그대로 둔다 (excerpt로 통합되는 효과)

## 아키텍처 — 5개 영역 + 가이드

### 1) 메타 입력 UI

작성(`admin/posts/new`)과 수정(`admin/posts/[id]/edit`)이 공용으로 쓴다. 수정 페이지는 new의 컴포넌트를 import 하는 기존 패턴을 따른다.

- **`new/_actions/seo-section.action.tsx`** (신규)
  - shadcn 스타일 collapsible "SEO 설정" 섹션. 평소 접힘, 토글로 펼침 (기존 코드가 shadcn `Collapsible`을 쓰면 그것을, 아니면 `useState` + `hidden` 토글)
  - excerpt: `Textarea` + `CharacterCounter`(권장 200) + **"AI로 요약 생성" 버튼**
  - metaTitle: `Input` + `CharacterCounter`(권장 60, 하드 100)
  - excerpt 입력/AI 생성 → `setExcerpt`, metaTitle 입력 → `setMetaTitle`
- **`new/_components/character-counter.tsx`** (신규, 순수 컴포넌트)
  - props: `value: string`, `recommendedMax: number`, `hardMax?: number`
  - 권장 내 `text-muted-foreground` / 권장 초과 `text-yellow-600` / 하드 초과 `text-destructive`
  - 표시 형식 `"{length} / {recommendedMax}"`
- **`new/_store.ts`** (수정)
  - 추가 state: `metaTitle: string`, `isGeneratingExcerpt: boolean`
  - 추가 action: `setMetaTitle`, `setIsGeneratingExcerpt`
  - `reset` / `initializePost`에 `metaTitle` 포함 (초기값 `''`)
  - excerpt/`setExcerpt`는 이미 존재한다고 가정. 없으면 함께 추가
- **`new/_services/save-post.ts`** (수정)
  - `SavePostInput`에 `metaTitle?: string` 추가
  - INSERT/UPDATE payload에 `metaTitle: metaTitle ?? null` 추가
  - `excerpt`는 빈 문자열이면 `null`로 변환 (`excerpt && excerpt.length > 0 ? excerpt : null`)
- **`new/_services/submit-post.ts`** (수정)
  - `savePost` 호출 인자에 `metaTitle: store.metaTitle` 추가
- **`[id]/edit/_handlers/post-init.handler.tsx`** (수정)
  - `initializePost`에 `metaTitle: post.metaTitle ?? ''` 추가
- **`new/page.tsx`** (수정) — `<EditorViewHandler />`를 감싼 `div` 다음에 `<SeoSectionAction />` 추가
- **`[id]/edit/page.tsx`** (수정) — 동일 위치에 `<SeoSectionAction />` 추가 (new에서 import)

### 2) AI 요약 생성 (Server Action)

- **`new/_services/generate-excerpt.ts`** (신규, `'use server'`)
  - 시그니처: `generateExcerpt(contentHtml: string): Promise<{ excerpt: string }>`
  - 처리 순서:
    1. Clerk `auth()`로 로그인(본인) 확인. 미인증 → 에러 throw
    2. `contentHtml`에서 HTML 태그 제거 → 순수 텍스트. 너무 길면 앞부분만(예: 4000자)
    3. 텍스트가 비어있으면 에러 throw ("본문이 비어 있습니다")
    4. Claude Haiku 호출 — 프롬프트: "다음 블로그 글을 검색 노출용으로 150자 이내 한국어 한 문단으로 요약. 군더더기·메타발언 없이 핵심만."
    5. 응답 텍스트를 `trim()`하여 `{ excerpt }` 반환
  - 모델: `claude-haiku-4-5`
  - 의존성: `@anthropic-ai/sdk` 설치, `.env`에 `ANTHROPIC_API_KEY`
- 클라이언트(`seo-section.action.tsx`) 동작:
  - "AI로 요약 생성" 버튼 클릭 → `setIsGeneratingExcerpt(true)` → `generateExcerpt(content)` 호출 → 결과를 `setExcerpt`로 채움 → `setIsGeneratingExcerpt(false)`
  - 본문(store.content)이 비어있으면 버튼 비활성
  - 실패 시 `toast.error(...)`, 로딩 해제
  - **저장 시 자동 호출 아님** — 버튼 클릭 시에만 호출 (비용·지연 통제)

### 3) OG / Twitter / canonical / metadataBase

- **`src/app/layout.tsx`** `generateMetadata` (수정) — 추가:
  - `metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')`
  - `openGraph: { siteName, type: 'website', images: ['/og-default.png'] }`
  - `twitter: { card: 'summary_large_image', images: ['/og-default.png'] }`
  - 기존 `title`/`description`/RSS alternate 유지
- **`(main)/posts/[slug]/page.tsx`** `generateMetadata` (수정) — 추가:
  - `alternates: { canonical: \`/posts/${slug}\` }`
  - `openGraph: { type: 'article', title, description, url, images: [thumbnailUrl ?? '/og-default.png'], publishedTime, modifiedTime, tags: post.tags.map(t => t.name) }`
  - `twitter: { card: 'summary_large_image', title, description, images: [...] }`
  - `title`/`description`은 기존 fallback 로직 유지

### 4) JSON-LD `BlogPosting`

- **`(main)/posts/[slug]/_utils/build-article-json-ld.ts`** (신규, 순수 함수)
  - `buildArticleJsonLd({ post, blogName, baseUrl }): Record<string, unknown>`
  - 필드: `@context`, `@type: 'BlogPosting'`, `headline`(metaTitle ?? title), `description`(metaDescription ?? excerpt ?? ''), `image`(thumbnailUrl ?? `${baseUrl}/og-default.png`), `datePublished`(publishedAt), `dateModified`(updatedAt), `author`(Person, blogName), `publisher`(Organization, blogName, logo=og-default.png), `url`, `mainEntityOfPage`
- **`(main)/posts/[slug]/_components/article-json-ld.tsx`** (신규)
  - props: `post`, `blogName`, `baseUrl`
  - `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />`
- **`(main)/posts/[slug]/page.tsx`** (수정)
  - `getPostBySlug`와 `getBlogSettings`를 `Promise.all`로 병렬 조회
  - JSX 최상단에 `<ArticleJsonLd post={post} blogName={settings?.blogName ?? SITE_NAME} baseUrl={...} />`

### 5) 이미지 alt 입력 UI

- **`new/_components/_image-block/image-toolbar.tsx`** (수정)
  - props에 `alt: string`, `onAltChange: (alt: string) => void` 추가
  - 우측에 톱니(`Settings`) 버튼 + shadcn `Popover` — `PopoverContent`에 "대체 텍스트 (alt)" `Label` + `Input`
  - alt 변경 시 `onAltChange` 호출 (controlled)
- **`new/_components/_image-block/image-node-view.tsx`** (수정)
  - `<ImageToolbar>`에 `alt={alt}`, `onAltChange={(v) => updateAttributes({ alt: v })}` 전달
  - 렌더되는 `<img alt={alt}>`는 이미 존재

### + 기본 자산

- **`public/og-default.png`** (신규, 수동) — 1200×630 PNG, 사이트 공통 OG 이미지. 1MB 이하. 임시 placeholder로 빌드 가능, 실제 SNS 검증은 디자인 완성 후

### 가이드 문서

- **`docs/seo-guide.md`** (신규) — 날짜 없는 살아있는 운영 매뉴얼. 처음 SEO를 적용하는 본인을 위해 자세히 작성. 구성:
  1. **SEO가 뭐고 왜 하는가** — 검색엔진이 글을 발견·색인·순위화하는 흐름, 개인 블로그에 주는 효과
  2. **이 블로그가 출력하는 메타데이터 지도** — 각 메타가 *누구에게 / 어디서* 보이는지:
     - `<title>` / `description` → 구글 검색 결과 제목·회색 설명
     - OpenGraph / Twitter → 카카오톡·슬랙·X 카드 미리보기
     - `canonical` → 중복 URL(쿼리 파라미터 등) 페널티 방지
     - JSON-LD → 구글 리치 스니펫(발행일·저자·썸네일)
     - `sitemap.xml` / `robots.txt` → 크롤러 진입 (이미 존재)
  3. **글 쓸 때 체크리스트** — 제목 키워드 / 썸네일(=OG 이미지) / excerpt(AI 버튼→보정) / 본문 이미지 alt / 의미 있는 slug
  4. **발행 후 검증 방법** — Rich Results Test, SNS 링크 카드 확인, Search Console 등록·sitemap 제출(1회), 페이지 소스 보기로 메타 확인
  5. **용어 사전** — excerpt vs metaDescription, canonical, OG, Twitter Cards, JSON-LD, metadataBase

## 데이터 흐름

```
[글 작성]
본문 입력(store.content)
   ↓
SEO 섹션
   ├─ "AI로 요약 생성" 클릭 → generateExcerpt(content) → setExcerpt
   ├─ excerpt textarea 직접 수정 → setExcerpt
   └─ metaTitle 입력 → setMetaTitle
   ↓
저장 (submit-post → save-post)
   ↓
posts 테이블 (excerpt, metaTitle 저장; 빈 값은 null)

[글 조회] /posts/[slug]
   ↓
generateMetadata
   ├─ title: metaTitle ?? title
   ├─ description: metaDescription ?? excerpt
   ├─ canonical: /posts/{slug}
   ├─ openGraph: { type:'article', images:[thumbnailUrl ?? og-default], publishedTime, modifiedTime, tags }
   └─ twitter: { card:'summary_large_image', images:[같음] }
   ↓
페이지 렌더 + <ArticleJsonLd /> (BlogPosting script)
```

## 에러 / 엣지 케이스

- `NEXT_PUBLIC_BASE_URL` 미설정 → `'http://localhost:3000'` fallback (sitemap.ts와 동일 패턴)
- `ANTHROPIC_API_KEY` 미설정 / AI 호출 실패 → `toast.error`로 안내, 입력은 수동으로 계속 가능
- 본문이 비어있을 때 "AI 생성" 버튼 비활성
- excerpt 빈 문자열 저장 시 `null`로 통일 → description fallback이 정상 동작
- metaTitle 빈 값 → `title` 그대로 사용
- `thumbnailUrl`이 R2 외부 도메인이어도 OG 이미지로 사용 가능 (`next/image` 제약과 무관)
- alt popover 편집 후 외부 클릭 → 자동 닫힘, 값은 `onAltChange` 시점에 이미 반영됨

## 테스트 전략

### Vitest

- `character-counter.test.tsx` — 권장/초과/하드초과 색상 클래스, 카운트 형식
- `seo-section.action.test.tsx` — 토글 펼침, excerpt/metaTitle 입력 시 store 업데이트, AI 버튼 렌더·본문 없을 때 비활성
- `generate-excerpt` — Anthropic SDK를 `vi.mock`으로 대체. 태그 제거·요약 반환, 본문 비었을 때 에러, 미인증 에러
- `build-article-json-ld.test.ts` — 필수 필드 매핑, thumbnailUrl 없을 때 og-default 절대 URL, metaTitle/metaDescription 우선, author/publisher
- `image-toolbar.test.tsx` (갱신) — 톱니 버튼 렌더, 클릭 시 alt input 표시, 변경 시 `onAltChange` 호출, 기존 `baseProps`에 `alt`/`onAltChange` 추가

### 수동 검증

- 글 작성 → SEO 섹션 펼침 → "AI로 요약 생성" → excerpt 채워짐 → 수동 보정
- metaTitle 60/100자에서 카운터 색상 변화
- 이미지 클릭 → 툴바 톱니 → popover에서 alt 입력 → 외부 클릭 시 닫힘·값 유지
- 글 발행 → 상세 페이지 소스 보기에서 확인:
  - `<title>`, `<meta name="description">`, `<link rel="canonical">`
  - `og:type=article`, `og:title/description/image/url`, `article:published_time/modified_time/tag`
  - `twitter:card=summary_large_image`, `twitter:title/description/image`
  - `<script type="application/ld+json">` 안 `BlogPosting`
- 구글 Rich Results Test → `BlogPosting` 인식·오류 0
- 카카오톡/슬랙/디스코드에 글 URL → 카드 미리보기 정상
- 썸네일 없는 글 → OG 이미지 `og-default.png` fallback 확인
- 회귀: `npx vitest run`, `npm run lint`, `npm run build` 모두 통과

## 작업 순서 (구현 계획에서 task로 분해)

1. `CharacterCounter` 컴포넌트
2. `_store.ts` 확장 (metaTitle, isGeneratingExcerpt)
3. `generateExcerpt` Server Action (+ `@anthropic-ai/sdk` 설치)
4. `SeoSectionAction` (입력 + AI 버튼)
5. `save-post`/`submit-post`/`post-init.handler` 저장·초기화
6. `new/page.tsx`·`edit/page.tsx`에 섹션 등록
7. `ImageToolbar` alt popover + `ImageNodeView` 바인딩
8. `og-default.png` 준비
9. `layout.tsx` metadataBase + 기본 OG/Twitter
10. `posts/[slug]` generateMetadata 확장
11. `buildArticleJsonLd` + `ArticleJsonLd` + 페이지 등록
12. `docs/seo-guide.md` 작성
13. 수동 검증 + 회귀
