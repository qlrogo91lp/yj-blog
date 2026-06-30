# SEO 운영 가이드

YJlogs(개인 기술 블로그)에 적용된 SEO 기능을 처음 다루는 운영자를 위한 가이드입니다. 글을 쓸 때 무엇을 채워야 하는지, 발행 후 무엇을 확인해야 하는지를 다룹니다. 날짜 없이 계속 갱신되는 살아있는 문서이므로, 기능이 바뀌면 이 문서도 함께 고쳐주세요.

## 1. SEO가 뭐고 왜 하는가

SEO(Search Engine Optimization, 검색엔진 최적화)는 구글 같은 검색엔진이 내 글을 잘 찾아서, 잘 이해하고, 검색 결과 상위에 보여주도록 돕는 작업입니다. 검색엔진은 대략 이런 순서로 동작합니다.

1. **크롤링(Crawling)** — 구글 봇이 `robots.txt`를 보고 들어와도 되는 경로를 확인한 뒤, `sitemap.xml`에 적힌 URL들을 따라가며 페이지를 읽습니다.
2. **인덱싱(Indexing)** — 읽어온 페이지의 `<title>`, `meta description`, 본문, JSON-LD 구조화 데이터 등을 분석해 "이 페이지가 무엇에 대한 글인지" 데이터베이스에 저장합니다.
3. **순위화(Ranking)** — 사용자가 검색어를 입력하면, 색인된 글 중 관련도·품질이 높은 순서로 검색 결과를 보여줍니다.

개인 블로그에서 SEO를 챙기면 두 가지 효과를 얻습니다.

- **검색 유입** — 글 제목·설명·본문이 검색 의도와 맞아떨어지면 구글 검색 결과에 노출되어 외부 방문자가 유입됩니다.
- **SNS 카드 미리보기** — 카카오톡, 슬랙, X(트위터) 등에 글 URL을 붙여넣었을 때 제목·설명·썸네일이 담긴 카드가 예쁘게 표시됩니다. 카드가 없으면 단순 텍스트 링크로만 보여 클릭률이 떨어집니다.

이 블로그는 글을 작성할 때 채우는 필드(제목, 요약, 썸네일, alt 텍스트 등)를 자동으로 메타데이터로 변환해 위 과정에 활용합니다. 아래 장에서 어떤 필드가 어디에 쓰이는지 정리합니다.

## 2. 이 블로그가 출력하는 메타데이터 지도

글을 발행하면 페이지 `<head>`와 `<body>`에 아래 메타데이터가 자동으로 채워집니다. 출처 코드는 `src/app/layout.tsx`(사이트 공통 기본값)와 `src/app/(main)/posts/[slug]/page.tsx`(글 상세 페이지)입니다.

| 메타데이터 | 누구에게/어디서 보이는가 | 이 블로그에서의 동작 |
|---|---|---|
| `<title>` / `meta description` | 구글 검색 결과의 제목(파란 링크)과 그 아래 회색 설명글 | `title`은 SEO 제목(`metaTitle`)을 우선 사용하고, 비어 있으면 글 제목(`title`)을 사용합니다. `description`은 `metaDescription` → 없으면 `excerpt` 순으로 사용합니다 |
| OpenGraph (`og:*`) | 카카오톡 채팅창, 슬랙 채널에 URL을 붙였을 때 뜨는 카드 미리보기 | `og:title`/`og:description`은 위와 동일한 우선순위, `og:image`는 글 썸네일(`thumbnailUrl`) → 없으면 사이트 기본 이미지(`/og-default.png`). 글 상세에서는 `type: article`, 발행일·수정일(`publishedTime`/`modifiedTime`), 태그도 함께 출력됩니다 |
| Twitter Cards (`twitter:*`) | X(트위터)에 URL을 붙였을 때 뜨는 카드 미리보기 | `card: summary_large_image`로 큰 이미지 카드 형태. 제목·설명·이미지는 OpenGraph와 동일한 값을 사용 |
| `canonical` | 검색엔진에게 "이 URL이 대표 주소"임을 알려 중복 URL(쿼리 파라미터 등으로 변형된 같은 페이지) 페널티를 방지 | 글 상세 페이지마다 `/posts/{slug}`를 canonical로 고정 |
| JSON-LD `BlogPosting` | 구글이 검색 결과에 리치 스니펫(발행일·저자·썸네일 등)을 보여줄 때 참고하는 구조화 데이터 | 글 상세 페이지 `<script type="application/ld+json">`에 `headline`(metaTitle→title), `description`(metaDescription→excerpt), `image`(썸네일→기본 이미지), `datePublished`/`dateModified`, `author`/`publisher`(블로그 이름), `url`을 포함해 출력 (`build-article-json-ld.ts`) |
| `sitemap.xml` (`src/app/sitemap.ts`) | 크롤러가 어떤 URL들이 존재하는지 한 번에 파악하는 목록 | 홈, `/posts` 목록, 그리고 **발행(published)된 글**의 `/posts/{slug}` URL을 모두 나열. 글마다 `lastModified`(수정일)도 포함 |
| `robots.txt` (`src/app/robots.ts`) | 크롤러가 사이트에 처음 진입했을 때 가장 먼저 확인하는 규칙 파일 | `/admin/` 경로는 크롤링 금지(`disallow`)하고 나머지는 모두 허용(`allow: /`), `sitemap.xml` 위치도 함께 안내 |

> 사이트 전역 기본값(`metadataBase`, 사이트명, 기본 설명, 기본 OG 이미지 `/og-default.png`)은 `src/app/layout.tsx`의 `generateMetadata`에서 한 번 정의되고, 글 상세 페이지가 이를 글 단위 값으로 덮어씁니다. `metadataBase`는 환경변수 `NEXT_PUBLIC_BASE_URL`(없으면 `http://localhost:3000`)로 설정됩니다.

## 3. 글 쓸 때 체크리스트

새 글을 작성할 때(`/admin/posts/new`) 아래 항목을 확인해주세요.

- [ ] 제목에 검색될 만한 키워드를 넣었나 (예: "Next.js 16 App Router 마이그레이션"처럼 구체적인 단어 포함)
- [ ] 썸네일을 올렸나 — 썸네일은 글 카드뿐 아니라 OG/Twitter 카드 이미지로도 그대로 재사용됩니다. 올리지 않으면 사이트 기본 이미지(`/og-default.png`)가 대신 노출됩니다
- [ ] **SEO 설정** 섹션(글쓰기 화면 하단, 토글로 펼침)에서 **요약(excerpt)**을 채웠나 — "AI로 요약 생성" 버튼을 누르면 본문을 바탕으로 150자 내외 초안이 자동 생성되니, 어색한 부분만 다듬으면 됩니다 (권장 200자, 최대 500자)
- [ ] 본문 이미지마다 대체 텍스트(alt)를 넣었나 — 이미지를 클릭하면 뜨는 툴바의 톱니(설정) 버튼을 눌러 팝오버에서 입력합니다. alt는 시각장애인을 위한 스크린 리더뿐 아니라 구글 이미지 검색 노출에도 쓰입니다
- [ ] slug가 의미 있는 영문/한글인가 — slug는 글 URL(`/posts/{slug}`)과 `canonical`/JSON-LD `url`에 그대로 쓰이므로, 숫자 ID보다는 내용을 짐작할 수 있는 문자열이 좋습니다

> 참고: SEO 설정 섹션의 "SEO 제목(meta title)"은 선택 항목입니다. 비워두면 글 제목이 그대로 검색 결과 제목으로 쓰이므로, 글 제목이 너무 길거나(60자 초과) 검색엔진에 더 어울리는 표현을 따로 쓰고 싶을 때만 채우면 됩니다 (권장 60자, 최대 100자).

## 4. 발행 후 검증 방법

글을 발행한 뒤에는 아래 방법으로 메타데이터가 의도대로 출력됐는지 확인하세요.

1. **브라우저 "페이지 소스 보기"로 직접 확인** — 발행된 글 페이지에서 우클릭 → "페이지 소스 보기"(또는 `Ctrl/Cmd+U`)를 열어 `<head>` 안의 `<meta>` 태그들과 `<script type="application/ld+json">` 내용을 눈으로 확인합니다. `title`, `description`, `og:image`, JSON-LD의 `headline`/`image`/`datePublished` 값이 의도한 대로 들어갔는지 봅니다.
2. **구글 Rich Results Test** — [search.google.com/test/rich-results](https://search.google.com/test/rich-results)에 글 URL을 입력해 검사합니다. `BlogPosting`이 정상적으로 인식되고 오류가 0개인지 확인합니다. (개발 환경 URL은 구글이 접근할 수 없으므로, 배포된 실제 URL로 검사해야 합니다.)
3. **카카오톡/슬랙 카드 미리보기 확인** — 카카오톡 채팅방이나 슬랙 채널에 글 URL을 붙여넣어 카드(제목·설명·썸네일)가 정상적으로 뜨는지 확인합니다. 카카오톡은 한 번 캐시한 카드를 한동안 재사용하므로, 메타데이터를 고친 직후라면 카카오톡 공유 디버거 등으로 캐시를 갱신해야 바뀐 내용이 보일 수 있습니다.
4. **구글 Search Console 등록 + sitemap 제출 (최초 1회)** — [Search Console](https://search.google.com/search-console)에 사이트를 등록(소유권 확인)하고, `색인 생성 > Sitemaps` 메뉴에서 `sitemap.xml`(`https://{도메인}/sitemap.xml`)을 제출합니다. 이후 새 글은 sitemap에 자동으로 추가되므로 매번 다시 제출할 필요는 없지만, 색인 현황은 Search Console에서 주기적으로 확인하는 것이 좋습니다.
5. **`ANTHROPIC_API_KEY` 환경변수 확인** — "AI로 요약 생성" 버튼은 Claude API(`generateExcerpt`, `src/app/admin/posts/new/_services/generate-excerpt.ts`)를 호출합니다. 환경변수 `ANTHROPIC_API_KEY`가 설정되어 있지 않으면 버튼을 눌렀을 때 "ANTHROPIC_API_KEY가 설정되지 않았습니다" 에러가 발생합니다. 로컬·배포 환경 모두 `.env`에 키를 등록해야 합니다.

## 5. 용어 사전

| 용어 | 설명 |
|---|---|
| **excerpt** | 글의 요약문. 글 목록 카드의 미리보기 텍스트로 쓰이고, `metaDescription`이 비어 있을 때 검색 결과 설명글의 대체값(fallback)으로도 쓰입니다 |
| **metaDescription** | 검색 결과 설명글 전용 필드. excerpt와 별도로 둘 수 있지만, 이 블로그는 별도 입력 UI 없이 비어 있으면 excerpt를 그대로 사용합니다 |
| **canonical** | "이 URL이 이 콘텐츠의 정식 주소"라고 검색엔진에 알리는 태그. 같은 글이 여러 URL(쿼리 파라미터 등)로 접근 가능할 때 검색엔진이 한 URL로만 색인하도록 유도해 중복 콘텐츠 페널티를 막습니다 |
| **OpenGraph** | 페이스북이 만든 메타태그 규격(`og:title`, `og:description`, `og:image` 등). 카카오톡, 슬랙 등 대부분의 메신저·SNS가 이 규격을 읽어 링크 카드를 만듭니다 |
| **Twitter Cards** | X(트위터) 전용 카드 메타태그 규격(`twitter:card`, `twitter:title` 등). 이 블로그는 `summary_large_image` 타입을 사용해 큰 이미지가 강조된 카드를 보여줍니다 |
| **JSON-LD** | 검색엔진이 페이지 내용을 구조적으로 이해하도록 `<script type="application/ld+json">`에 넣는 구조화 데이터 포맷. 이 블로그는 `schema.org`의 `BlogPosting` 타입을 사용합니다 |
| **metadataBase** | Next.js가 OG 이미지 등 상대 경로(`/og-default.png`)를 절대 URL로 바꿀 때 기준이 되는 사이트 루트 주소. 이 블로그는 `NEXT_PUBLIC_BASE_URL` 환경변수 값을 사용합니다 |
