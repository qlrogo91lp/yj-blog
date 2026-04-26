# SEO 풀패키지 개선 — Design

## 목표

글 작성·조회 흐름 전반에 SEO 메타데이터를 도입한다. 작성자가 `excerpt` / `metaTitle` / `metaDescription`을 입력할 수 있게 하고, 글 상세 페이지가 OpenGraph · Twitter Cards · canonical · JSON-LD `BlogPosting` · 이미지 alt 까지 출력하도록 한다.

## 용어 / 개념 정리

이번 작업에 등장하는 SEO 용어와 결정 배경 메모.

### excerpt (글 요약)

블로그에서 두 가지 용도로 쓰이는 짧은 요약 문장.

1. **글 목록 미리보기** — 카드/리스트의 제목 아래에 보이는 2~3줄 요약. 본문 전체를 노출할 수 없으므로 필요. 현재 `post-list-item.tsx:62`에서 `post.excerpt`를 쓰지만 입력 UI가 없어 항상 비어 있음.
2. **`metaDescription` fallback** — 글 상세의 `generateMetadata`에서 `metaDescription ?? excerpt`로 동작 중.

DB 코멘트(`schema.ts:45`)에도 명시됨 — *"글 요약 - 목록 미리보기 및 meta description 기본값"*.

### excerpt 자동 추출 (AI 아님)

본문 HTML에서 태그를 제거하고 첫 200자를 자르는 **단순 텍스트 절단**. AI 요약이 아님. 동작 예시:

```
입력: <h2>제목</h2><p>안녕하세요. 오늘은…</p>
출력: "제목 안녕하세요. 오늘은…"
```

한계:
- 첫 부분이 코드 블록·이미지·표면 결과가 어색할 수 있음
- 글 의미 요약은 못 함

따라서 자동 추출값은 **기본값일 뿐**이고, 사용자가 textarea에서 직접 수정할 수 있어야 함. 이 spec에서는 사용자가 한 번이라도 직접 편집하면(`excerptIsManual=true`) 이후 자동 덮어쓰기 안 함.

AI 요약(Anthropic API 호출 등)은 별도 인프라가 필요하므로 이번 spec 범위 밖.

### excerpt vs metaDescription

둘 다 "설명" 같지만 **타겟과 용도가 다름**.

| | **excerpt** | **metaDescription** |
|---|---|---|
| 누가 봄 | 이미 블로그에 들어온 독자 | 구글/네이버 검색 결과·SNS 공유 카드의 외부인 |
| 노출 위치 | 글 목록 카드/리스트 | `<meta name="description">` → 검색 결과 회색 글, OG description |
| 톤 | "본문을 클릭하게 만드는 후크" | "검색 키워드 포함한 SEO 카피" |
| 길이 | 디자인에 맞춰 자유 (보통 100~200자) | 구글 노출 한계 ~155자 |

실무에선 둘을 분리하지 않는 경우가 많아 fallback 패턴(`metaDescription ?? excerpt`)으로 처리. 이 spec에선 SEO를 항상 신경 쓸 예정이라 셋(`excerpt` / `metaTitle` / `metaDescription`)을 모두 입력 가능하게 둠.

### JSON-LD (`BlogPosting`)

검색엔진이 페이지를 정확히 이해하도록 HTML `<head>`에 `<script type="application/ld+json">`으로 박는 표준 구조화 데이터. 일반 사용자 화면엔 안 보임.

**효과**
- 구글 검색 결과의 **리치 스니펫** — 발행일·저자·썸네일이 검색 결과에 표시
- 뉴스/블로그 캐러셀 노출 가능성 (Top Stories)
- LinkedIn·Slack 등 일부 봇이 OG 대신 JSON-LD를 우선 파싱

**출력 예시**

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Next.js 16 App Router 캐싱",
  "description": "metaDescription 또는 excerpt",
  "image": "https://yjlogs.com/images/thumb.png",
  "datePublished": "2026-04-20T00:00:00Z",
  "dateModified": "2026-04-25T00:00:00Z",
  "author": { "@type": "Person", "name": "YJ" },
  "publisher": {
    "@type": "Organization",
    "name": "YJlogs",
    "logo": { "@type": "ImageObject", "url": "https://yjlogs.com/og-default.png" }
  },
  "url": "https://yjlogs.com/posts/nextjs-16-caching",
  "mainEntityOfPage": "https://yjlogs.com/posts/nextjs-16-caching"
}
```

**필드 채우는 소스**
- `headline` ← `post.title`
- `description` ← `metaDescription ?? excerpt`
- `image` ← `thumbnailUrl ?? '/og-default.png'` (절대 URL)
- `datePublished` ← `publishedAt`, `dateModified` ← `updatedAt`
- `author.name` ← `blog_settings.blogName`
- `publisher.name` ← 같음, `publisher.logo` ← 임시로 `og-default.png`. 정식 logo는 후속

> ⚠️ `publisher.logo`는 구글이 강하게 권장. 별도 logo 자산이 준비되면 `blog_settings.logoUrl` 컬럼 추가 후 사용.

### `metadataBase`

Next.js Metadata API 옵션. **root layout에 한 번 설정하면** 이후 모든 메타 태그의 상대 경로(`/og.png`, `/posts/foo`)가 자동으로 절대 URL(`https://yjlogs.com/...`)로 변환됨.

OG 이미지·canonical URL은 **절대 URL이어야 검색엔진·SNS가 인식**. `metadataBase`가 없으면 매번 직접 절대 URL을 만들어야 함.

설정 한 줄:

```typescript
metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
```

기존 `sitemap.ts`와 동일한 fallback 패턴 사용.

### canonical URL

`<link rel="canonical">` 메타 태그. "이 글의 정식 URL은 여기"라고 검색엔진에 명시.

**효과**
- 동일 글이 여러 URL로 접근될 때(쿼리 파라미터, 트래킹 코드 등) **중복 콘텐츠 페널티 방지**
- 예: `/posts/foo?utm_source=twitter`로 들어와도 검색엔진은 `/posts/foo`만 정식으로 봄

Next.js Metadata API:

```typescript
alternates: { canonical: `/posts/${slug}` }
```

`metadataBase`가 있으면 자동으로 절대 URL로 변환됨.

### OpenGraph / Twitter Cards

SNS·메신저(카카오톡, 슬랙, 디스코드, X)에 URL을 붙였을 때 **카드 미리보기**(제목·설명·이미지)를 만들어주는 메타 태그.

- OpenGraph: `<meta property="og:*">` (Facebook 표준이지만 거의 모든 플랫폼이 사용)
- Twitter Cards: `<meta name="twitter:*">` (X 전용)

이 spec에서는 둘 다 출력. 이미지는 `thumbnailUrl ?? og-default.png`. Twitter는 `card: summary_large_image` (큰 카드) 사용.

## 결정 사항 요약

| 주제 | 결정 |
|------|------|
| 입력 UI 위치 | 본문 에디터 아래 collapsible "SEO 설정" 섹션 |
| 입력 필드 | `excerpt`, `metaTitle`, `metaDescription` 셋 다 |
| `excerpt` 기본값 | 본문 첫 200자 자동 추출 + textarea 수정 가능 (사용자 편집 시 자동 추출 정지) |
| 길이 가이드 | 글자수 카운터 + 권장 범위 색상 변화 |
| OG 이미지 fallback | `thumbnailUrl` → `public/og-default.png` |
| 동적 OG 생성 | 안 함 (`@vercel/og` 도입 X) |
| JSON-LD | `BlogPosting` 풀 필드 |
| 이미지 alt 입력 UI | `ImageToolbar` 톱니 버튼 → 툴바 하단(이미지 위) popover |
| canonical / metadataBase | Next.js Metadata API 표준 패턴 |

## 아키텍처

세 영역의 협력:
1. **글 작성/수정 폼** — collapsible "SEO 설정" 섹션을 추가해 메타 필드 3개 + excerpt 자동 채움
2. **글 상세 페이지(`/posts/[slug]`)** — `generateMetadata`에서 OG/Twitter/canonical 출력, 페이지 본문에 JSON-LD `<script>` 삽입
3. **이미지 alt 입력** — TipTap `ImageToolbar`에 톱니 버튼 + popover로 alt 편집

## 변경 단위

### 1) 메타 입력 UI (글 작성/수정 폼)

- `src/app/admin/posts/new/_actions/seo-section-action.tsx` (신규)
  - shadcn `Collapsible` 사용. 평소 접혀있고 "SEO 설정" 토글로 펼침
  - excerpt textarea + 글자수 카운터 (권장 200자)
  - metaTitle input + 카운터 (권장 50–60자)
  - metaDescription textarea + 카운터 (권장 150–160자)
- `src/app/admin/posts/new/_components/character-counter.tsx` (신규)
  - props: `value: string`, `recommended: { min?: number; max: number }`
  - 권장 범위 내 = `text-muted-foreground`, 권장 초과 = `text-yellow-600`, 그 이상 초과 = `text-destructive`
- `src/app/admin/posts/new/_utils/extract-excerpt.ts` (신규)
  - 순수 함수: `extractExcerpt(html: string, maxLength = 200): string`
  - HTML 태그 제거, 엔티티 정리, 연속 공백 압축, maxLength로 자르고 단어 경계에서 절단
- `src/app/admin/posts/new/_handlers/excerpt-auto-fill-handler.tsx` (신규)
  - `null`을 반환하는 사이드이펙트 컴포넌트
  - `content` 변경 구독 → `excerptIsManual === false`일 때만 `setExcerpt(extractExcerpt(content))`
- `src/app/admin/posts/new/_store.ts` 수정
  - 추가: `metaTitle: string`, `setMetaTitle`
  - 추가: `metaDescription: string`, `setMetaDescription`
  - 추가: `excerptIsManual: boolean`, `setExcerptIsManual`
  - `setExcerpt`는 자동 호출/수동 편집을 구분하지 않음. 수동 편집 시 `excerptIsManual=true`는 SeoSection에서 onChange와 함께 호출
  - `reset` / `initializePost`에 새 필드 포함
- `src/app/admin/posts/[id]/edit/_handlers/post-init-handler.tsx` 수정
  - `metaTitle`, `metaDescription` 초기값 반영
  - `excerptIsManual: !!post.excerpt` (이미 채워져 있으면 자동 덮어쓰기 안 함)
- `src/app/admin/posts/new/_services/save-post.ts` / `submit-post.ts` 수정
  - 입력 인터페이스에 `metaTitle?: string`, `metaDescription?: string` 추가
  - DB insert/update payload에 두 필드 매핑 (빈 문자열은 `null`로 변환)
- `src/app/admin/posts/new/page.tsx` 수정 — `<EditorViewHandler />` 다음에 `<SeoSectionAction />` + `<ExcerptAutoFillHandler />` 추가
- `src/app/admin/posts/[id]/edit/page.tsx` 수정 — 동일

### 2) 글 상세 메타데이터 + JSON-LD

- `src/app/layout.tsx` 수정 — `generateMetadata`에 다음 추가:
  - `metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')`
  - 기본 `openGraph: { siteName, images: ['/og-default.png'] }`
  - 기본 `twitter: { card: 'summary_large_image' }`
- `src/app/(main)/posts/[slug]/page.tsx` 수정 — `generateMetadata`에 다음 추가:
  - `alternates: { canonical: \`/posts/${slug}\` }`
  - `openGraph: { type: 'article', title, description, images: [thumbnailUrl ?? '/og-default.png'], publishedTime, modifiedTime, authors: [blogName], tags: tag.name 배열, url: \`/posts/${slug}\` }`
  - `twitter: { card: 'summary_large_image', title, description, images }`
- `src/app/(main)/posts/[slug]/_utils/build-article-json-ld.ts` (신규)
  - 순수 함수: `buildArticleJsonLd({ post, blogName, baseUrl })` → `Record<string, unknown>`
  - `BlogPosting` 풀 필드 (headline, description, image, datePublished, dateModified, author, publisher, url, mainEntityOfPage)
  - `publisher.logo`는 일단 `og-default.png`로. 정식 logo는 후속
- `src/app/(main)/posts/[slug]/_components/article-json-ld.tsx` (신규)
  - props: `post`, `blogName`, `baseUrl`
  - `<script type="application/ld+json">` 출력 (`dangerouslySetInnerHTML` + `JSON.stringify`)
- `src/app/(main)/posts/[slug]/page.tsx` JSX에 `<ArticleJsonLd post={post} blogName={settings?.blogName ?? SITE_NAME} baseUrl={...} />` 추가
- `public/og-default.png` (신규) — 1200×630 사이트 기본 OG 이미지. 사용자가 별도 준비

### 3) 이미지 alt 입력 UI

- `src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx` 수정
  - props에 `alt: string`, `onAltChange: (alt: string) => void` 추가
  - 우측 끝에 톱니(`Settings`) 버튼 추가
  - shadcn `Popover` 사용. `<PopoverTrigger>` = 톱니 버튼, `<PopoverContent side="bottom">` = alt input + label "대체 텍스트 (alt)"
  - popover 안에서 alt 편집은 controlled input. 변경 시 `onAltChange` 호출
- `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx` 수정
  - `<ImageToolbar>`에 `alt={alt}`, `onAltChange={(v) => updateAttributes({ alt: v })}` 전달
  - `<img alt={alt}>`는 이미 그대로

## 데이터 흐름

```
[글 작성]
사용자 본문 입력 → editor.onUpdate
   ↓
ExcerptAutoFillHandler가 store.content 구독
   ├─ excerptIsManual === false → extractExcerpt(content) → setExcerpt
   └─ excerptIsManual === true  → 무시
   ↓
SeoSection 사용자 편집
   ├─ excerpt textarea onChange → setExcerpt + setExcerptIsManual(true)
   └─ metaTitle / metaDescription onChange → 그대로 setX
   ↓
저장 (save-post / submit-post)
   ↓
posts 테이블 (excerpt, metaTitle, metaDescription 모두 저장)

[글 조회]
posts/[slug]/page.tsx
   ↓
generateMetadata
   ├─ title: post.metaTitle ?? post.title
   ├─ description: post.metaDescription ?? post.excerpt
   ├─ alternates.canonical: /posts/{slug}
   ├─ openGraph: { type:'article', images:[thumbnailUrl ?? og-default], publishedTime, modifiedTime, authors, tags }
   └─ twitter: { card:'summary_large_image', images:[같음] }
   ↓
페이지 렌더 + <ArticleJsonLd /> 출력 (script type=application/ld+json)
```

## 에러 / 엣지 케이스

- `NEXT_PUBLIC_BASE_URL` 미설정 → `'http://localhost:3000'` fallback (sitemap.ts와 동일 패턴)
- 글 수정 시 기존 `excerpt`가 비어 있는 경우 → `excerptIsManual=false`로 시작 → 본문 변경 즉시 자동 채움
- 글 수정 시 기존 `excerpt`가 채워져 있는 경우 → `excerptIsManual=true`로 시작 → 자동 덮어쓰기 안 함
- 톱니 popover 안에서 alt 편집 후 외부 클릭 → popover 자동 닫힘. 변경값은 onChange 시점에 이미 `updateAttributes`로 저장됐으므로 별도 저장 동작 없음
- `thumbnailUrl`이 R2 외부 도메인이라도 OG 이미지로 그대로 사용 가능 (`next/image` 제약은 OG 메타와 무관)
- 빈 `metaTitle` / `metaDescription`은 `null`로 저장 (DB nullable 컬럼). fallback이 동작하도록 함

## 테스트 전략

### Vitest

- `extract-excerpt.test.ts`
  - HTML 태그 제거 결과
  - 200자 초과 시 단어 경계 자르기 + `…`
  - 빈 문자열 입력 → 빈 문자열 반환
  - 코드 블록·이미지·표가 섞인 HTML도 텍스트만 추출
- `build-article-json-ld.test.ts`
  - 모든 필드 정상 매핑
  - `thumbnailUrl` 없을 때 `image`가 `og-default.png` 절대 URL로 채워짐
  - `dateModified`는 `updatedAt`이 `publishedAt`과 다를 때만 출력 (옵션) — 또는 항상 출력
- `character-counter.test.tsx`
  - 권장 범위 내 색상 클래스
  - 초과 시 색상 클래스
  - 카운트 텍스트 형식 `"52 / 60"`
- `seo-section-action.test.tsx`
  - 세 입력에 값 입력 시 store 업데이트
  - excerpt textarea 입력 시 `excerptIsManual=true`로 변경
- `image-toolbar.test.tsx` 갱신
  - 톱니 버튼 렌더 확인
  - 톱니 클릭 시 popover 표시
  - popover 안 input에 입력 → `onAltChange` 호출

### 수동 검증

- 글 작성 → SEO 섹션 펼침 → 본문 입력 시 excerpt 자동 채움 → 직접 편집 시 자동 채움 멈춤
- metaTitle 60자, metaDescription 160자 초과 시 카운터 색상 변화
- 이미지 클릭 → 툴바 우측 톱니 클릭 → 이미지 위에 popover 노출 → alt 입력 후 외부 클릭 → 닫힘
- 글 발행 → 상세 페이지 view source 에서 다음 모두 정상 출력 확인:
  - `<title>`, `<meta name="description">`
  - `<link rel="canonical">`
  - `<meta property="og:type" content="article">`, `og:title`, `og:description`, `og:image`, `og:url`, `article:published_time`, `article:modified_time`, `article:tag`
  - `<meta name="twitter:card" content="summary_large_image">`, `twitter:title`, `twitter:description`, `twitter:image`
  - `<script type="application/ld+json">` 안에 `BlogPosting` JSON
- 구글 [Rich Results Test](https://search.google.com/test/rich-results)로 글 URL 검사 → `BlogPosting` 인식, 오류 없음
- 카카오톡 / Slack / Discord에 글 URL 붙이기 → 카드 미리보기 (제목·설명·이미지) 정상 표시
- `og-default.png`로 fallback되는 경우(썸네일 없음 글)도 동일 검증
